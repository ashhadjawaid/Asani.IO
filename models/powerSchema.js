import mongoose from "mongoose";

const powerSchema = new mongoose.Schema({
    DeviceID: {
        type: String,
        required: true
    },
    Power1: {
        type: Number
    },
    Energy1: {
        type: Number
    }
}, { timestamps: true })

const PowerSchema = mongoose.model("Power", powerSchema)

export default PowerSchema