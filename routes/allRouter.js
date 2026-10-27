const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Registration = require('../models/RegistrationModel');

function computeFinalAmount(ticketPrice, discountCode) {
    if (!discountCode) return ticketPrice;
    if (discountCode === 'CAMPUS50') return ticketPrice * 0.5;
    if (discountCode === 'EARLYBIRD') return Math.max(ticketPrice - 100, 0);
    return null;
}


router.post('/registrations', async function (req, res) {
    try {
        var body = req.body;

        if (body.discountCode) {
            var upper = body.discountCode.toUpperCase().trim();
            if (upper !== 'CAMPUS50' && upper !== 'EARLYBIRD') {
                return res.status(400).json({ success: false, message: 'Invalid discount code' });
            }
        }
        body.finalAmount = computeFinalAmount(body.ticketPrice, body.discountCode ? body.discountCode.toUpperCase().trim() : null);

        var registration = new Registration(body);
        var saved = await registration.save();
        res.status(201).json({ success: true, message: 'Registration successful', data: saved });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'This email is already registered for the event' });
        }
        if (err.name === 'ValidationError') {
            var messages = Object.values(err.errors).map(function (e) { return e.message; });
            return res.status(400).json({ success: false, errors: messages });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/registrations', async function (req, res) {
    try {
        var filter = {};
        if (req.query.eventType) filter.eventType = req.query.eventType;
        if (req.query.status) filter.status = req.query.status;

        var data = await Registration.find(filter);
        res.status(200).json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/registrations/:id', async function (req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid registration ID format' });
        }
        var reg = await Registration.findById(req.params.id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.status(200).json({ success: true, data: reg });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.put('/registrations/:id', async function (req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid registration ID format' });
        }

        var body = req.body;
        if (body.discountCode) {
            var upper = body.discountCode.toUpperCase().trim();
            if (upper !== 'CAMPUS50' && upper !== 'EARLYBIRD') {
                return res.status(400).json({ success: false, message: 'Invalid discount code' });
            }
        }
        var existing = await Registration.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Registration not found' });

        var eventType = body.eventType || existing.eventType;
        var teamSize = body.teamSize !== undefined ? body.teamSize : existing.teamSize;

        if (eventType === 'AI_WORKSHOP' && teamSize !== 1) {
            return res.status(400).json({ success: false, errors: ['AI Workshop only permits individual registrations'] });
        }

        var price = body.ticketPrice !== undefined ? body.ticketPrice : existing.ticketPrice;
        var code = body.discountCode !== undefined ? (body.discountCode ? body.discountCode.toUpperCase().trim() : null) : (existing.discountCode || null);
        body.finalAmount = computeFinalAmount(price, code);

        var updated = await Registration.findByIdAndUpdate(req.params.id, body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, message: 'Registration updated', data: updated });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'This email is already registered for the event' });
        }
        if (err.name === 'ValidationError') {
            var messages = Object.values(err.errors).map(function (e) { return e.message; });
            return res.status(400).json({ success: false, errors: messages });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/registrations/:id', async function (req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid registration ID format' });
        }
        var reg = await Registration.findByIdAndDelete(req.params.id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.status(200).json({ success: true, message: 'Registration deleted', data: reg });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;