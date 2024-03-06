import mqtt from 'mqtt';
import express from 'express';
import dotenv from 'dotenv';
import connectToMongoDb from './db/connectToMongoDb.js';
import specificDataModel from './models/specificDataSchema.js'; // Import the schema for storing specific fields

const app = express();
const PORT = 5000;
dotenv.config();
app.use(express.json());

app.get('/', (req, res) => {
    // Root route
    res.send("Server is ready");
});

app.listen(PORT, () => {
    connectToMongoDb();
    console.log(`Server running on port ${PORT}`);
});

// MQTT Settings
const MQTT_BROKER = 'mqtt://18.136.254.174:1883';
const POWER_TOPIC = '/asani/devices/power/powerenergy/stmc/PZEMTEST';
const VOLTAGE_TOPIC = '/asani/devices/power/voltcurr/stmc/PZEMTEST';
const FREQUENCY_TOPIC = '/asani/devices/power/pffreq/stmc/PZEMTEST';

// Create MQTT client 
const mqttClient = mqtt.connect(MQTT_BROKER);

// Define a variable to store combined data
let combinedData = {};

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

// Function to insert data into MongoDB
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
