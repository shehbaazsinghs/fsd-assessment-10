require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const router = require('./routes/allRouter');

app.use(express.json());
app.use('/api', router);

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(function () {
        console.log('Connected to MongoDB');
        app.listen(PORT, function () {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(function (err) {
        console.log('DB connection error:', err);
    });