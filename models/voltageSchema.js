import mongoose from "mongoose";

const voltageSchema = new mongoose.Schema({
    DeviceID: {
        type: String,
        required: true
    },
    Volt1: {
        type: Number
    },
    Current1: {
        type: Number
    }
}, { timestamps: true })

const VoltageSchema = mongoose.model("Voltage", voltageSchema)

export default VoltageSchema