import mongoose from "mongoose";

const specificDataSchema = new mongoose.Schema({
    DeviceID: {
        type: String,
        required: false
    },
    Power1: {
        type: Number
    },
    Energy1: {
        type: Number
    },
    Volt1: {
        type: Number
    },
    Current1: {
        type: Number
    },
    Freq1: {
        type: Number
    },
    Current1:{
        type: Number
    },
    Pf1:{
        type: Number
    }
}, { timestamps: true })

const SpecificDataSchema = mongoose.model("specificData", specificDataSchema)

export default SpecificDataSchema