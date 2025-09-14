import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("⚠️ Please define the MONGODB_URI environment variable inside .env.local");
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (!cached) {
        throw new Error("Cached mongoose connection is undefined.");
    }
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => mongooseInstance.connection);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
