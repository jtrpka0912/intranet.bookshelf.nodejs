// Packages
// ========
// Chai
const chai = require('chai');
const chaiHttp = require('chai-http'); // Chai-HTTP Plugin
const chaiString = require('chai-string'); // Chai String Plugin
chai.use(chaiHttp); // Allow Chai to use Chai-HTTP plugin.
chai.use(chaiString); // Allow Chai to use Chai String plugin.
const assert = chai.assert; // Assert Style

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Internal
const { app } = require('../../index');
const Shelf = require('../../models/shelf.model');

// Global Variables
let mongoServer;

describe('Shelves Router', () => {
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

    describe('GET - /api/v1/shelves', () => {
        let request;

        before(async () => {
            // Set up request variable
            request = chai.request(app).get('/api/v1/shelves');

            // Create some shelves
            const shelfOne = new Shelf({
                name: 'Shelf One',
                root: '/',
                showDirectories: false,
                multiFile: false
            });

            const shelfTwo = new Shelf({
                name: 'Shelf Two',
                root: '/books',
                showDirectories: true,
                multiFile: true
            });

            const shelfThree = new Shelf({
                name: 'Shelf Three',
                root: '/magazines',
                showDirectories: true,
                multiFile: false
            });

            await shelfOne.save();
            await shelfTwo.save();
            await shelfThree.save();
        });

        beforeEach(() => {
            // Set up request variable
            request = chai.request(app).get('/api/v1/shelves');
        });

        afterEach(() => {
            // Need to reset the request variable for each test.
            request = null;
        });

        it('Recognized path', () => {
            request.end((err, res) => {
                assert.isNumber(res.status);
                assert.notEqual(res.status, 404);
            });
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
                assert.equal(res.status, 200);
            });
        });

        it('Returns no errors', () => {
            request.end((err, res) => {
                assert.isNull(err);
            });
        });
    });

    describe('POST - /api/v1/shelves', () => {
        let request;

        beforeEach(() => {
            // Set up request variable
            request = chai.request(app).post('/api/v1/shelves');
        });

        afterEach(() => {
            // Need to reset the request variable for each test.
            request = null;
        });

        it('Recognized path', () => {
            request.send({}).end((err, res) => {
                assert.isNumber(res.status);
                assert.notEqual(res.status, 404);
            });
        });

        it('Fail request with empty body', () => {
            request.send({}).end((err, res) => {
                const response = res.body;
                assert.isNotNull(res);
                assert.isNumber(response.errorCode);
                assert.equal(response.errorCode, 400);
                assert.isString(response.errorCodeMessage);
                assert.equal(response.errorCodeMessage, 'Bad Request');
                assert.isString(response.errorMessage);
                assert.containIgnoreCase(response.errorMessage, 'is required.');
            });
        });

        it('Fail request because of short name', () => {
            request.send({
                name: 'Yo', // Need to be three or more
                root: '/',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                // Returns an error object response
                const response = res.body;
                assert.isNotNull(res);
                assert.isNumber(response.errorCode);
                assert.equal(response.errorCode, 400);
                assert.isString(response.errorCodeMessage);
                assert.equal(response.errorCodeMessage, 'Bad Request');
                assert.isString(response.errorMessage);
                assert.containIgnoreCase(response.errorMessage, 'is shorter than the minimum allowed');
            });
        });

        it('Fail request because of conflicts with show directories and multi-files.', () => {
            request.send({
                name: 'Sample', // Need to be three or more
                root: '/',
                showDirectories: false,
                multiFile: true
            }).end((err, res) => {
                const response = res.body;
                assert.isNotNull(res);
                assert.isNumber(response.errorCode);
                assert.equal(response.errorCode, 400);
                assert.isString(response.errorCodeMessage);
                assert.equal(response.errorCodeMessage, 'Bad Request');
                assert.isString(response.errorMessage);
                assert.containIgnoreCase(response.errorMessage, 'you can not use multi-file directories');
            });
        });

        it('Successfully create a new shelf', () => {
            request.send({
                name: 'From Test',
                root: '/',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                const response = res.body;
                assert.isNotNull(res);
                assert.isString(response);
                assert.equal(response, 'Successful');
            });
        });
    });

    describe('GET - /api/v1/shelves/{shelfId}', () => {
        before(async () => {
            // Set up request variable
            request = chai.request(app).get('/api/v1/shelves');

            // Create some shelves
            const shelfOne = new Shelf({
                _id: '5ec73853788ef556ecc225dd',
                name: 'Shelf One',
                root: '/',
                showDirectories: false,
                multiFile: false
            });

            const shelfTwo = new Shelf({
                _id: '5ec5df19ed30ea2b80ef14ae',
                name: 'Shelf Two',
                root: '/books',
                showDirectories: true,
                multiFile: true
            });

            const shelfThree = new Shelf({
                _id: '5ec739cdc8bcdc4a1c74e75e',
                name: 'Shelf Three',
                root: '/magazines',
                showDirectories: true,
                multiFile: false
            });

            await shelfOne.save();
            await shelfTwo.save();
            await shelfThree.save();
        });
    });
});