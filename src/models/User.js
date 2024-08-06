// src/models/User.js
import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
    email: String,
})

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    readingSpeed: { type: Number, required: true },
    friends: [friendSchema],
    sentInvites: [friendSchema],
    receivedInvites: [friendSchema],
    declinedInvites: [friendSchema],
    declinedByMe: [friendSchema]

}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;