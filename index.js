// Packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Routes
const shelvesRouter = require('./routes/shelves');
const contentsRouter = require('./routes/contents');
const ebooksRouter = require('./routes/ebooks');

// Initialize express
const app = express();

// Retrieve ENV Variables
const {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB
} = process.env

// Apply cors to express
app.use(cors());

// Express will request and receive JSON content
app.use(express.json());

// Serve the static content inside the public folder pointing to /static
app.use('/static', express.static('public/images/covers'));

// Connect to MongoDB with Mongoose
const mongoURI = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

// Connect to MongoDB
const connection = mongoose.connection;
connection.once('open', () => {
    console.info('\x1b[34m%s', 'MongoDB database connection established successfully.')
});

// Express Routes
app.use('/api/v1/shelves', shelvesRouter);
app.use('/api/v1/contents', contentsRouter);
app.use('/api/v1/ebooks', ebooksRouter);

// Connect node to a part
const port = process.env.NODE_PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

module.exports = {
    app: app
};