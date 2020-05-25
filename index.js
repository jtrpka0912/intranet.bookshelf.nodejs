// Packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false); // Remove use of deprecated method
require('dotenv').config();

// Routes
const shelvesRouter = require('./routes/shelves');
const ebooksRouter = require('./routes/ebooks')

// Initialize express
const app = express();

// Assign port number
const port = process.env.PORT;

// Apply cors to express
app.use(cors());

// Express will request and receive JSON content
app.use(express.json());

// Connect to MongoDB with Mongoose
const uri = process.env.MONGO_URI
mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    // console.log('MongoDB database connection established successfully.')
});

// Express Routes
app.use('/api/v1/shelves', shelvesRouter);
app.use('/api/v1/ebooks', ebooksRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

module.exports = {
    app: app
};