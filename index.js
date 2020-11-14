// Packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false); // Remove use of deprecated method
require('dotenv').config();

// Routes
const shelvesRouter = require('./routes/shelves');
const contentsRouter = require('./routes/contents');
const ebooksRouter = require('./routes/ebooks');

// Initialize express
const app = express();

// Assign port number
const port = process.env.PORT ? process.env.PORT : 3000;

// Apply cors to express
app.use(cors());

// Express will request and receive JSON content
app.use(express.json());

// Serve the static content inside the public folder pointing to /static
app.use('/static', express.static('public/images/covers'));

// Connect to MongoDB with Mongoose
const mongoDB = process.env.MONGO_DATABASE ? process.env.MONGO_DATABASE : 'shelf';
const mongoURI = `mongodb://localhost:27017/${mongoDB}`;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true
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
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

module.exports = {
    app: app
};