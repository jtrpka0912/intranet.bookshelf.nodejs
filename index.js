// Packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize express
const app = express();

// Assign port number
const port = process.env.PORT || 3001;

// Apply cors to express
app.use(cors());

// Express will request and receive JSON content
app.use(express.json());

// Connect to MongoDB
const uri = process.env.URI || 'mongodb://localhost:27017/sandbox';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully.')
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});