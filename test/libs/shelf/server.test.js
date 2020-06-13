// Packages
// ========
// Chai
const chai = require('chai');
const chaiString = require('chai-string');
chai.use(chaiString)
const assert = chai.assert;

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Models
const Shelf = require('../../../models/shelf.model');

// Libs
const { retrieveFilesFolders } = require('../../../libs/shelf/server');

// Global Variables
let mongoServer;

describe('Create and Retrieve Files and Folders through Server to MongoDB', () => {
    before(async () => {
        // Set up an in-memory MongoDB server
        mongoServer = new MongoMemoryServer();

        // Retrieve the URI from the mock database
        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
    });

    after(async () => {
        // TODO: Fix comment typo in mongodb.test.js
        // Disconnect mongoose and stop the mock database
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('retrieveFilesFolders()', () => {
        let unknownShelf;

        before(async () => {
            // Create some shelves
            // ===================
            unknownShelf = new Shelf({
                name: 'Unknown Shelf',
                root: ['sample-server', 'Unknown'],
                showDirectories: true,
                multiFile: false
            });

            await unknownShelf.save();
        });

        after(async () => {
            await Shelf.deleteMany({});
        });

        it('Throw error if no shelf was passed', async () => {
            const error = await retrieveFilesFolders();
            assert.containIgnoreCase(error.message, 'Shelf was missing in call');
        });

        it('Throw error if shelf root directory was not found', async () => {
            const error = await retrieveFilesFolders(unknownShelf);
            assert.containIgnoreCase(error.message, 'no such file or directory');
        });
    });
});