// Packages
// ========
// Chai
const chai = require('chai');
const chaiHttp = require('chai-http'); // Chai-HTTP plugin
const chaiString = require('chai-string'); // Chai String plugin
chai.use(chaiHttp); // Allow Chai to use Chai-HTTP plugin.
chai.use(chaiString); // Allow Chai to use Chai String plugin.
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
    recognizeErrorMessage,
    recognize200,
    recognize201,
    recognize400,
    recognize404,
} = require('../../libs/helpers/mocha/express/assert'); // Helper Mocha Assert Tests

// Global Variables
let mongoServer;
const endpointURI = '/api/v1/shelves';

describe('Shelves Router', () => {
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

    describe(`GET - ${endpointURI}`, () => {
        let request;

        before(async () => {
            // Create some shelves
            const shelfOne = new Shelf({
                name: 'Shelf One',
                root: [],
                showDirectories: false,
                multiFile: false
            });

            const shelfTwo = new Shelf({
                name: 'Shelf Two',
                root: ['books'],
                showDirectories: true,
                multiFile: true
            });

            const shelfThree = new Shelf({
                name: 'Shelf Three',
                root: ['magazines'],
                showDirectories: true,
                multiFile: false
            });

            await shelfOne.save();
            await shelfTwo.save();
            await shelfThree.save();
        });

        beforeEach(() => {
            // Set up request variable
            request = chai.request(app).get(endpointURI);
        });

        afterEach(() => {
            // Need to reset the request variable for each test.
            request = null;
        });
        
        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Return three shelves', () => {
            request.end((err, res) => {
                const shelfCount = res.body.length;
                assert.equal(shelfCount, 3, 'Should return only three from mock MongoDB.');
                assert.isAbove(shelfCount, 2);
                assert.isBelow(shelfCount, 5);
            });
        });

        it('Return a status of 200', () => {
            request.end((err, res) => {
                recognize200(res);
            });
        });

        it('Returns no errors', () => {
            request.end((err, res) => {
                assert.isNull(err);
            });
        });
    });

    describe(`POST - ${endpointURI}`, () => {
        let request;

        beforeEach(() => {
            // Set up request variable
            request = chai.request(app).post(endpointURI);
        });

        afterEach(() => {
            // Need to reset the request variable for each test.
            request = null;
        });

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Fail request with empty body', () => {
            request.send({}).end((err, res) => {
                assert.isNotNull(res);
                recognize400(res);
                recognizeErrorMessage(res, 'is required.');
            });
        });

        it('Fail request because of short name', () => {
            request.send({
                name: 'Yo', // Need to be three or more
                root: '/',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                assert.isNotNull(res);
                recognize400(res);
                recognizeErrorMessage(res, 'is shorter than the minimum allowed');
            });
        });

        it('Fail request because of conflicts with show directories and multi-files.', () => {
            request.send({
                name: 'Sample', // Need to be three or more
                root: '/',
                showDirectories: false,
                multiFile: true
            }).end((err, res) => {
                assert.isNotNull(res);
                recognize400(res);
                recognizeErrorMessage(res, 'you can not use multi-file directories');
            });
        });

        it('Successfully create a new shelf', () => {
            request.send({
                name: 'From Test',
                root: '/example/foo/bar',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                const response = res.body;

                assert.isNotNull(res);
                recognize201(res);

                assert.containIgnoreCase(response.name, 'From Test');
                assert.isNotArray(response.root); // We make it an array in mongo, but should return back as string
                assert.equal(response.root, '/example/foo/bar');
            });
        });
    });

    describe(`GET - ${endpointURI}/:shelfId`, () => {
        before(async () => {
            // Create some shelves
            const shelfOne = new Shelf({
                _id: '5ec73853788ef556ecc225dd',
                name: 'Shelf One',
                root: [],
                showDirectories: false,
                multiFile: false
            });

            const shelfTwo = new Shelf({
                _id: '5ec5df19ed30ea2b80ef14ae',
                name: 'Shelf Two',
                root: ['books'],
                showDirectories: true,
                multiFile: true
            });

            const shelfThree = new Shelf({
                _id: '5ec739cdc8bcdc4a1c74e75e',
                name: 'Shelf Three',
                root: ['magazines'],
                showDirectories: true,
                multiFile: false
            });

            await shelfOne.save();
            await shelfTwo.save();
            await shelfThree.save();
        });

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Bad request with a too short ID string (12 characters minimum)', () => {
            chai.request(app).get(`${endpointURI}/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
            });
        });

        it('Unable to find shelf with bad ID', () => {
            chai.request(app).get(`${endpointURI}/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id:');
            });
        });

        it('Find a shelf with ID (Shelf Two)', () => {
            chai.request(app).get(`${endpointURI}/5ec5df19ed30ea2b80ef14ae`).end((err, res) => {
                assert.isNotNull(res);
                recognize200(res);
                assert.equal(res.body.name, 'Shelf Two');
                assert.containIgnoreCase(res.body.root[0], 'books');
            });
        });
    });

    describe(`PUT - ${endpointURI}/:shelfId`, () => {
        let request;
        const shelfOneId = '5ec73853788ef556ecc225dd';
        const shelfThreeId = '5ec739cdc8bcdc4a1c74e75e';

        before(async () => {
            // Create a shelf to edit
            const shelfOne = new Shelf({
                _id: shelfOneId,
                name: 'Shelf One',
                root: [],
                showDirectories: false,
                multiFile: false
            });

            const shelfThree = new Shelf({
                _id: shelfThreeId,
                name: 'Shelf Three',
                root: ['magazines'],
                showDirectories: true,
                multiFile: false
            });

            await shelfOne.save();
            await shelfThree.save();
        });

        beforeEach(() => {
            // Set up request variable
            request = chai.request(app).put(`${endpointURI}/${shelfOneId}`);
        });

        afterEach(() => {
            // Need to reset the request variable for each test.
            request = null;
        });

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Fail request with empty body', () => {
            request.send({}).end((err, res) => {
                assert.isNotNull(res);
                recognize400(res);
                recognizeErrorMessage(res, 'You did not send any information');
            });
        });

        it('Bad request with a too short ID string (12 characters minimum)', () => {
            chai.request(app).get(`${endpointURI}/blah`).send({
                name: 'Shelf Derp',
                root: '/derp',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
            });
        });

        it('Fail request because it could not find Shelf', () => {
            chai.request(app).put(`${endpointURI}/blahblahblah`).send({
                name: 'Shelf Derp',
                root: '/derp',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
            });
        });

        it('Successfully updated Shelf One', () => {
            request.send({
                name: 'Updated Shelf One',
                root: '/books',
                showDirectories: true,
                multiFile: true
            }).end((err, res) => {
                const updatedShelf = res.body;
                assert.isNotNull(res);
                recognize200(res);

                // Test old and new values
                assert.equal(updatedShelf.name, 'Updated Shelf One');
                assert.notEqual(updatedShelf.name, 'Shelf One');
                assert.equal(updatedShelf.root, '/books');
                assert.notEqual(updatedShelf.root, '/');
                assert.isTrue(updatedShelf.showDirectories);
                assert.isNotFalse(updatedShelf.showDirectories);
                assert.isTrue(updatedShelf.multiFile);
                assert.isNotFalse(updatedShelf.multiFile);
            });
        });

        // Technically, this should be more of a PATCH, but not sure...
        it('Successfully updated Shelf Three with partial data', () => {
            chai.request(app).put(`${endpointURI}/${shelfThreeId}`).send({
                showDirectories: false,
            }).end((err, res) => {
                const updatedShelf = res.body;
                assert.isNotNull(res);
                recognize200(res);

                // Test old and new values
                assert.equal(updatedShelf.name, 'Shelf Three'); 
                assert.equal(updatedShelf.root[0], 'magazines');
                assert.isFalse(updatedShelf.multiFile);

                // Updated data
                assert.isFalse(updatedShelf.showDirectories);
                assert.isNotTrue(updatedShelf.showDirectories);
            });
        });
    });

    describe(`DELETE - ${endpointURI}/:shelfId`, () => {
        let request;
        const shelfOneId = '5ec73853788ef556ecc225dd';

        before(async () => {
            // Create just one shelf to delete
            const shelfOne = new Shelf({
                _id: shelfOneId,
                name: 'Shelf One',
                root: [],
                showDirectories: false,
                multiFile: false
            });

            await Shelf.create(shelfOne);
        });

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Bad request with a too short ID string (12 characters minimum)', () => {
            chai.request(app).delete(`${endpointURI}/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
            });
        });

        it('Fail request because it could not find Shelf', () => {
            chai.request(app).delete(`${endpointURI}/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
            });
        });

        it('Successfully delete a Shelf', () => {
            chai.request(app).delete(`${endpointURI}/${shelfOneId}`).end((err, res) => {
                assert.isNotNull(res);
                recognize200(res);
            });
        });
    });
});