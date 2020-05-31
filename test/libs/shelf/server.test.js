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
const something = require('../../../libs/shelf/server');

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

    describe('Create Folders from server, and retrieve from MongoDB', () => {
        let comicShelf;

        before(async () => {
            // Create some shelves
            // ===================
            comicShelf = new Shelf({
                name: 'Comicbook Shelf',
                root: ['library', 'comics'],
                showDirectories: true,
                multiFile: false
            });

            await comicShelf.save();
        });

        after(async () => {
            await Shelf.deleteMany({});
        });

        it('Something', () => {
            assert(true);
        });
    });
});