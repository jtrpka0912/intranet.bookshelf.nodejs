// Packages
// ========
// Chai
const chai = require('chai');
const chaiHttp = require('chai-http'); // Chai-HTTP plugin
const chaiString = require('chai-string'); // Chai String plugin
chai.use(chaiHttp); // Allow Chai to use Chai-HTTP plugin
chai.use(chaiString); // Allow Chai to use Chai String plugin
const assert = chai.assert; // Assert Style

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// App
const { app } = require('../../index'); // Get the Express app

// Models
const Shelf = require('../../models/shelf.model'); // Shelf model

// Helpers
const {
    recognizeThePath,
    recognizeErrorMessage,
    recognize200,
    recognize400,
    recognize404,
} = require('../../helpers/mocha/assert'); // Helper Mocha Assert Tests

// Global Variables
let mongoServer;
const endpointURI = '/api/v1/ebooks';

describe('eBooks Router', () => {
    before(async () => {
        // Set up an in-memory MongoDB server
        mongoServer = new MongoMemoryServer();

        // Retrieve the URI from the mock server
        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true
        });
    });

    after(async () => {
        // Disconnect mongoose and stop the mock server.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
        // TODO: Will need to do separate testing with documents in collections
        // ... and another with empty collections so it can create documents for them.
        describe('With files and folders in collection', () => {
            const shelfOneId = '5ec73853788ef556ecc225dd'
            before(async () => {
                // Create a shelf
                const shelfOne = new Shelf({
                    _id: shelfOneId,
                    name: 'Shelf One',
                    root: '/books',
                    showDirectories: false,
                    multiFile: false
                });

                // TODO: Create some files

                // TODO: Create some folders

                await shelfOne.save();
            });

            after(async () => {
                // Remove all shelves
                await Shelf.deleteMany({});
            });
        });
    });
});