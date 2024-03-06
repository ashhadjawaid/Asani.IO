import mongoose from "mongoose";

const connectToMongoDb = async (req, res) => {
  try {
    await mongoose.connect("mongodb+srv://mafzaljutt550:ZGx1R7pn3TLnjNzc@cluster0.ow4rll5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB", error.message);
  }
};

export default connectToMongoDb