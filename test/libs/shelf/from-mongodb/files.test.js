// Packages
// ========
// Chai
const chai = require('chai');
const chaiString = require('chai-string');
chai.use(chaiString);
const assert = chai.assert;

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Models
const Shelf = require('../../../../models/shelf.model');
const Folder = require('../../../../models/folder.model');
const File = require('../../../../models/file.model');

// Libs
const { retrieveFiles } = require('../../../../libs/shelf/from-mongodb/files');

// Global Variables
let mongoServer;

describe('Files from MongoDB', () => {
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
        // Disconnect mongoose and stock the mock database.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('Throw an error because its missing a shelf', async () => {
        const error = await retrieveFiles();
        // TODO: Fix this for folders => isString(error.errorCodeMessage)
        assert.isString(error.errorMessage);
        assert.containIgnoreCase(error.errorMessage, 'Shelf was missing in call.');
    });

    describe('Find files when showing directories', () => {
        
    });

    describe('Find files when not showing directories', () => {

    });
});