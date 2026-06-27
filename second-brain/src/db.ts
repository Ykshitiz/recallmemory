import mongoose from "mongoose";
import "dotenv/config";

const mongoUrl = process.env.MONGO_URL || "";

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not defined");
}

mongoose.connect(mongoUrl).then(() => {
  console.log("Connected to MongoDB");
});
