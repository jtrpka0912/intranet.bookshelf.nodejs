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
            //console.info('res', res.status, res.body);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Missing ShelfId.');
        });
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
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

            await shelf.save();
        });

        after(async () => {
            // Remove all shelves
            await Shelf.deleteMany({});
        });

        it('Bad request with a too short ID string (12 characters minimum)', () => {
            chai.request(app).get(`${endpointURI}/shelf/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
            });
        });

        it('Fail request because it could not find Shelf', () => {
            chai.request(app).get(`${endpointURI}/shelf/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id')
            });
        });

        describe('With files and folders in collection', () => {
            before(async () => {
                // Create some files
                // =================

                // This is inside another folder
                // Receive? No
                const fileOne = new File({
                    type: 'book',
                    name: 'Book One',
                    path: '/books/example',
                    cover: '/images/books/example/Book One.jpg',
                    didRead: false
                });

                // This is inside the root shelf
                // Receive? Yes
                const fileTwo = new File({
                    type: 'book',
                    name: 'Book Two',
                    path: '/books',
                    cover: '/images/books/Book Two.jpg',
                    didRead: true
                });

                // This is outside the root shelf path
                // Receive? No
                const fileThree = new File({
                    type: 'magazine',
                    name: 'Magainze Issue 000',
                    path: '/magazines',
                    cover: null,
                    didRead: false
                })

                // Create some folders
                // ===================

                // This is inside the root shelf
                // Receive? Yes
                const folderOne = new Folder({
                    name: 'Example',
                    path: '/books/example'
                });

                // This is outside the root shelf
                // Receive? No
                const folderTwo = new Folder({
                    name: 'Foobar',
                    path: '/foo/bar'
                });

                await fileOne.save();
                await fileTwo.save();
                await fileThree.save();
                await folderOne.save();
                await folderTwo.save();
            });

            after(async () => {
                // Remove all files and folders
                await File.deleteMany({});
                await Folder.deleteMany({});
            });

            it('Successfully be able to find the files and folders', () => {
                chai.request(app).get(`${endpointURI}/shelf/${shelfId}`).end((err, res) => {
                    assert.isNotNull(res);
                    recognize200(res);

                    // Only expecting one folder to arrive
                    assert.equal(1, res.body.directories.length);

                    // Only expecting one file to arrive
                    assert.equal(1, res.body.files.length);

                });
            });
        });

        describe('With no files and folders in collection (go through server)', () => {});
    });
});