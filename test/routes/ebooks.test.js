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
} = require('../../libs/helpers/mocha/express/assert'); // Helper Mocha Assert Tests

// Global Variables
let mongoServer;
const endpointURI = '/api/v1/ebooks';

describe('eBooks Router', () => {
    before(async () => {
        // Set up an in-memory MongoDB server
        mongoServer = new MongoMemoryServer();

        // Retrieve the URI from the mock database
        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true
        });
    });

    after(async () => {
        // Disconnect mongoose and stop the mock database.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('Should not be able to find endpoint with no shelfId.', (done) => {
        chai.request(app).get(`${endpointURI}/shelf`).end((err, res) => {
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Missing Shelf ID.');
            done();
        });
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
        const shelfOneId = '5ec73853788ef556ecc225dd';

        before(async () => {
            // Create a shelf
            const shelf = new Shelf({
                _id: shelfOneId,
                name: 'Shelf One',
                root: ['books'],
                showDirectories: true,
                multiFile: false
            });

            await shelf.save();
        });

        after(async () => {
            // Remove all shelves
            await Shelf.deleteMany({});
        });

        it('Bad request with a too short ID string (12 characters minimum)', (done) => {
            chai.request(app).get(`${endpointURI}/shelf/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
                done();
            });
        });

        it('Fail request because it could not find Shelf', (done) => {
            chai.request(app).get(`${endpointURI}/shelf/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
                done();
            });
        });

        describe('With files and folders in collection', () => {
            before(async () => {
                // Create some files
                // =================

                const bookOne = new File({
                    type: 'book',
                    name: 'Book One',
                    path: ['books', 'example'],
                    cover: ['images', 'books', 'example', 'Book One.jpg'],
                    didRead: false
                });

                const bookTwo = new File({
                    type: 'book',
                    name: 'Book Two',
                    path: ['books'],
                    cover: ['images', 'books', 'Book Two.jpg'],
                    didRead: true
                });

                const bookThree = new File({
                    type: 'book',
                    name: 'Book Three',
                    path: ['books'],
                    cover: ['images', 'books', 'Book Three.jpg'],
                    didRead: true
                });

                const magazineOne = new File({
                    type: 'magazine',
                    name: 'Magainze Issue 001',
                    path: ['magazines', 'issues'],
                    cover: null,
                    didRead: false
                });

                const magazineTwo = new File({
                    type: 'magazine',
                    name: 'Magainze Issue 002',
                    path: ['magazines', 'issues'],
                    cover: null,
                    didRead: false
                });

                const magazineThree = new File({
                    type: 'magazine',
                    name: 'Magainze Issue 003',
                    path: ['magazines', 'issues'],
                    cover: null,
                    didRead: false
                });

                const magazineFour = new File({
                    type: 'magazine',
                    name: 'Magainze Issue 004',
                    path: ['magazines', 'issues'],
                    cover: null,
                    didRead: false
                });

                // Create some folders
                // ===================

                const folderOne = new Folder({
                    name: 'Example',
                    path: ['books', 'example']
                });

                const folderTwo = new Folder({
                    name: 'Foobar',
                    path: ['foo', 'bar']
                });

                const folderThree = new Folder({
                    name: 'Issues',
                    path: ['magazines', 'issues']
                });

                await bookOne.save();
                await bookTwo.save();
                await bookThree.save();
                await magazineOne.save();
                await magazineTwo.save();
                await magazineThree.save();
                await magazineFour.save();
                await folderOne.save();
                await folderTwo.save();
                await folderThree.save();
            });

            after(async () => {
                // Remove all files and folders
                await File.deleteMany({});
                await Folder.deleteMany({});
            });

            it('Successfully be able to find the files and folders', (done) => {
                chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}`).end((err, res) => {
                    // console.info('res', res);

                    assert.isNotNull(res);
                    recognize200(res);

                    // Only expecting one folder, from directories, to arrive
                    // assert.equal(1, res.body.directories.length, 'Incorrect folder count');

                    // Expecting two files to arrive
                    assert.equal(2, res.body.files.length, 'Incorrect file count');

                    done();
                });
            });
        });

        describe('With no files and folders in collection (go through server)', () => {});
    });
});