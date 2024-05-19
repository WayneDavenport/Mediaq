// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Add other fields as necessary
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;