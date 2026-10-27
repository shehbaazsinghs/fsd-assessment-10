const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    studentName: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
    collegeEmail: {
        type: String, required: true, trim: true, unique: true, lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+(edu|ac\.in)$/, 'Must be a valid college email ending in .edu or .ac.in']
    },
    rollNumber: {
        type: String, required: true, minlength: 8, maxlength: 10, uppercase: true,
        match: [/^[A-Z0-9]{8,10}$/, 'Must be alphanumeric and between 8 to 10 characters long.'],
    },
    eventType: {
        type: String,
        enum: ["CODING_HACKATHON", "AI_WORKSHOP", "ROBOTICS", "GAMING"],
        required: true
    },
    teamSize: {
        type: Number, min: 1, max: 4, required: true,
        validate: {
            validator: function (val) {
                if (this.eventType === "AI_WORKSHOP" && val !== 1) return false;
                return true;
            },
            message: 'AI Workshop only permits individual registrations'
        }
    },
    ticketPrice: { type: Number, required: true, min: 0 },
    discountCode: { type: String, uppercase: true, trim: true },
    finalAmount: { type: Number },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "CANCELLED"], default: "PENDING" },
    registrationDate: {
        type: Date, default: Date.now,
        validate: {
            validator: function (val) { return val <= new Date(); },
            message: 'Registration date cannot be in the future'
        }
    }
});

module.exports = mongoose.model('Registration', registrationSchema);
