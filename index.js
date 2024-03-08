import mqtt from 'mqtt';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import connectToMongoDb from './db/connectToMongoDb.js';
import specificDataModel from './models/specificDataSchema.js'; // Import the schema for storing specific fields

const app = express();
const PORT = 5000;
dotenv.config();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    // Root route
    res.send("Server is ready");
});

const server = app.listen(PORT, () => {
    connectToMongoDb();
    console.log(`Server running on port ${PORT}`);
});


const wss = new WebSocket.Server({server})

app.get('/data/:timeFrame', async (req, res) => {
    try {
        const { timeFrame } = req.params;
        let startDate;

        // Set start date based on time frame
        switch (timeFrame) {
            case 'day':
                startDate = new Date(new Date().setDate(new Date().getDate() - 1)); // Data from the last 24 hours
                break;
            case 'week':
                startDate = new Date(new Date().setDate(new Date().getDate() - 7)); // Data from the last 7 days
                break;
            case 'month':
                startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)); // Data from the last month
                break;
            case 'year':
                startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)); // Data from the last year
                break;
            default:
                return res.status(400).json({ message: 'Invalid time frame' });
        }

        // Query MongoDB for data within the specified time frame
        const data = await specificDataModel.find({ createdAt: { $gte: startDate } });
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/data/:timeFrame/:valueType', async (req, res) => {
    try {
        const { timeFrame, valueType } = req.params;
        let startDate;

        // Set start date based on time frame
        switch (timeFrame) {
            case 'day':
                startDate = new Date(new Date().setDate(new Date().getDate() - 1)); // Data from the last 24 hours
                break;
            case 'week':
                startDate = new Date(new Date().setDate(new Date().getDate() - 7)); // Data from the last 7 days
                break;
            case 'month':
                startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)); // Data from the last month
                break;
            case 'year':
                startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)); // Data from the last year
                break;
            default:
                return res.status(400).json({ message: 'Invalid time frame' });
        }

        // Select fields based on value type
        let fieldsToSelect = {};
        switch (valueType) {
            case 'power':
                fieldsToSelect = { Power1: 1 };
                break;
            case 'energy':
                fieldsToSelect = { Energy1: 1 };
                break;
            case 'voltage':
                fieldsToSelect = { Volt1: 1 };
                break;
            case 'current':
                fieldsToSelect = { Current1: 1 };
                break;
            case 'frequency':
                fieldsToSelect = { Freq1: 1 };
                break;
            default:
                return res.status(400).json({ message: 'Invalid value type' });
        }

        // Query MongoDB for data within the specified time frame and selected value type
        const data = await specificDataModel.find({ createdAt: { $gte: startDate } }, fieldsToSelect);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Define a variable to store combined data
let combinedData = {};

// MQTT Settings
const MQTT_BROKER = 'mqtt://18.136.254.174:1883';
const POWER_TOPIC = '/asani/devices/power/powerenergy/stmc/PZEMTEST';
const VOLTAGE_TOPIC = '/asani/devices/power/voltcurr/stmc/PZEMTEST';
const FREQUENCY_TOPIC = '/asani/devices/power/pffreq/stmc/PZEMTEST';

// Create MQTT client 
const mqttClient = mqtt.connect(MQTT_BROKER);


// MQTT message handler
mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        // Add received data to the combined object based on the topic
        switch (topic) {
            case POWER_TOPIC:
                combinedData.PowerData = data.PowerData;
                break;
            case VOLTAGE_TOPIC:
                combinedData.VoltageData = data.CurrentData;
                break;
            case FREQUENCY_TOPIC:
                combinedData.FrequencyData = data.PfFreq;
                break;
            default:
                console.log('Unknown topic:', topic);
                break;
        }

        // Send data to the Websocket client
        
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                console.log('Sending data to client:', combinedData);
                client.send(JSON.stringify(combinedData));
            }
        });

        // Check if all necessary data is received
        if (combinedData.PowerData && combinedData.VoltageData && combinedData.FrequencyData) {
            // Save the combined data to MongoDB
            await insertDataIntoMongoDB(specificDataModel, combinedData);

            // Reset combinedData for next batch
            combinedData = {};
        }
    } catch (err) {
        console.error('Error handling MQTT message:', err);
    }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial data to the client
    if (combinedData) {
        ws.send(JSON.stringify(combinedData));
    }

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Subscribe to POWER topic
mqttClient.subscribe(POWER_TOPIC, (err) => {
    if (err) {
        console.error('Error subscribing to Power topic:', err);
        return;
    }
    console.log('Subscribed to Power topic:', POWER_TOPIC);
});

// Subscribe to Voltage topic
mqttClient.subscribe(VOLTAGE_TOPIC, (err) => {
    if (err) {
        console.error('Error subscribing to Voltage topic:', err);
        return;
    }
    console.log('Subscribed to Voltage topic:', VOLTAGE_TOPIC);
});

// Subscribe to Frequency topic
mqttClient.subscribe(FREQUENCY_TOPIC, (err) => {
    if (err) {
        console.error('Error subscribing to Frequency topic:', err);
        return;
    }
    console.log('Subscribed to Frequency topic:', FREQUENCY_TOPIC);
});

// Function to insert specific data into MongoDB
async function insertDataIntoMongoDB(model, data) {
    try {
        if (!data || !Object.keys(data).length || !model) {
            throw new Error('Received message or data is undefined, or model is not provided');
        }

        // Extract specific fields from the combined data
        const { PowerData, VoltageData, FrequencyData } = data;
        const { Energy1, Power1 } = PowerData;
        const { Volt1, Current1 } = VoltageData;
        const { Freq1 } = FrequencyData;
        const extractedPf1 = FrequencyData && FrequencyData.Pf1 !== undefined ? FrequencyData.Pf1 : null;
        const { DeviceID } = PowerData; // Assuming DeviceID is common for all data types

        console.log('Extracted values:', { Energy1, Power1, Volt1, Freq1, DeviceID, Current1, Pf1: extractedPf1 });

        // Create a new document using the specificDataModel schema
        const newData = new model({ Energy1, Power1, Volt1, Freq1, DeviceID, Current1, Pf1: extractedPf1 });
        console.log(newData);

        // Save the document to MongoDB
        await newData.save();
        console.log(`${model.modelName} data inserted into MongoDB:`, newData);
    } catch (err) {
        console.error('Error inserting into MongoDB:', err);
    }
}


// Handle MQTT connection events
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

mqttClient.on('error', (err) => {
    console.error('Error with MQTT connection:', err);
});

// Handle MongoDB connection events
connectToMongoDb();

mqttClient.on('connect', () => {
    console.log('Connected to MongoDB');
});

mqttClient.on('error', (err) => {
    console.error('Error with MongoDB connection:', err);
});

app.get('/mqtt/power', async (req, res) => {
    try {
        // Fetch and send MQTT data for the Power topic
        res.json(combinedData.PowerData);
    } catch (error) {
        console.error('Error fetching MQTT power data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/mqtt/voltage', async (req, res) => {
    try {
        // Fetch and send MQTT data for the Voltage topic
        res.json(combinedData.VoltageData);
    } catch (error) {
        console.error('Error fetching MQTT voltage data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/mqtt/frequency', async (req, res) => {
    try {
        // Fetch and send MQTT data for the Frequency topic
        res.json(combinedData.FrequencyData);
    } catch (error) {
        console.error('Error fetching MQTT frequency data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
