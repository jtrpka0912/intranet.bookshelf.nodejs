// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer

/** 
 * Breakdown of console logs:
 * 1) Font color \x1b[32m
 * 3) %s is placeholder 
 * 4) Reset colors \x1b[0m
 * console.log('\x1b[32m%s \x1b[0m', 'Connected to in-memory MongoDB test environment');
 * Refer to: https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
 */

mongoose.connection.on('connected', () => {
    console.log('\x1b[32m%s \x1b[0m', 'Connected to in-memory MongoDB test environment');
});

mongoose.connection.on('disconnected', () => {
    console.log('\x1b[31m%s \x1b[0m', 'Disconnected in-memory MongoDB test environment');
});

const mongooseTestConnection = async () => {
    // Disconnect any prior connections
    await mongoose.disconnect();

    // Set up an in-memory MongoDB server
    mongoServer = new MongoMemoryServer();

    // Retrieve the URI from the mock database
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    });
}

const mongoooseTestDisconnection = async () => {
    // Disconnect mongoose and stop the mock database.
    await mongoose.disconnect();
    await mongoServer.stop();

    // console.info(mongoose.connection);
}

module.exports = {
    mongooseTestConnection,
    mongoooseTestDisconnection
};