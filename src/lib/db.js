import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

let client;
let clientPromise;
let mongooseConnectionPromise;

if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        connectTimeoutMS: 30000, // Increase connection timeout to 30 seconds
    });
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

if (!global._mongooseConnectionPromise) {
    mongoose.set('strictQuery', false); // Optional: to suppress deprecation warnings
    global._mongooseConnectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

mongooseConnectionPromise = global._mongooseConnectionPromise;

export default clientPromise;

export async function connectToDatabase() {
    try {
        console.log("Attempting to connect to database...");
        const client = await clientPromise;
        console.log("Connected to database");
        return client;
    } catch (error) {
        console.error("Failed to connect to database:", error);
        throw new Error("Failed to connect to database");
    }
}

export async function connectToMongoose() {
    try {
        console.log("Attempting to connect to Mongoose...");
        await mongooseConnectionPromise;
        console.log("Connected to Mongoose");
    } catch (error) {
        console.error("Failed to connect to Mongoose:", error);
        throw new Error("Failed to connect to Mongoose");
    }
}