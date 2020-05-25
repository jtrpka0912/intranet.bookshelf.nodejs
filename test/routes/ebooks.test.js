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
const Folder = require('../../models/folder.model'); // Folder model
const File = require('../../models/file.model'); // File model


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

    it('Should not be able to find endpoint with no shelfId.', () => {
        chai.request(app).get(`${endpointURI}/shelf`).end((err, res) => {
            assert.isNotNull(res);
            assert.isNumber(res.status);
            assert.equal(res.status, 404);
        });
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
        // TODO: Will need to do separate testing with documents in collections
        // ... and another with empty collections so it can create documents for them.

        it('Recognized path', () => {
            recognizeThePath(chai.request(app).get(`${endpointURI}/shelf/blahblahblah`));
        });

        describe('With files and folders in collection', () => {
            const shelfId = '5ec73853788ef556ecc225dd';

            before(async () => {
                // Create a shelf
                const shelf = new Shelf({
                    _id: shelfId,
                    name: 'Shelf One',
                    root: '/books',
                    showDirectories: false,
                    multiFile: false
                });

                // Create some files
                const fileOne = new File({
                    type: 'book',
                    name: 'Book One',
                    path: '/books/example',
                    cover: '/images/books/example/Book One.jpg',
                    didRead: false
                });

                const fileTwo = new File({
                    type: 'book',
                    name: 'Book Two',
                    path: '/books/example',
                    cover: '/images/books/example/Book Two.jpg',
                    didRead: false
                });

                // Create some folders
                const folder = new Folder({
                    name: 'Example',
                    path: '/books/example'
                });

                await shelf.save();
                await fileOne.save();
                await fileTwo.save();
                await folder.save();
            });

            after(async () => {
                // Remove all shelves
                await Shelf.deleteMany({});
            });
            
        });
    });
});