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
const endpointURI = '/api/v1/shelves';

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

    describe(`GET - ${endpointURI}`, () => {
        let request;

        before(async () => {
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

        it('Recognized path', () => {
            recognizeThePath(request);
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

        it('Recognized path', () => {
            recognizeThePath(request);
        });

        it('Fail request with empty body', () => {
            request.send({}).end((err, res) => {
                const response = res.body;
                assert.isNotNull(res);
                recognize400(res.body);
                recognizeErrorMessage(res.body, 'is required.');
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
                recognize400(res.body);
                recognizeErrorMessage(res.body, 'is shorter than the minimum allowed');
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
                recognize400(res.body);
                recognizeErrorMessage(res.body, 'you can not use multi-file directories');
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

    describe(`GET - ${endpointURI}/:shelfId`, () => {
        before(async () => {
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

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Recognized path', () => {
            recognizeThePath(request);
        });

        it('Bad request with a too short ID string (12 characters minimum)', () => {
            chai.request(app).get(`${endpointURI}/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res.body);
                recognizeErrorMessage(res.body, 'Cast to ObjectId failed');
            });
        });

        it('Unable to find document with bad ID.', () => {
            chai.request(app).get(`${endpointURI}/blahblahblah`).end((err, res) => {

            });
        });
    });
});

/**
 * @function recognizeThePath
 * @summary Check if route exists
 * @description A reusable test to check if testing recognizes the route exists.
 * @todo Create a testing helper and export it to other future route test files.
 * @params { object } request
 */
const recognizeThePath = (request) => {
    request.end((err, res) => {
        assert.isNumber(res.status);
        assert.notEqual(res.status, 404);
    });
};

/**
 * @function recognize400
 * @summary Check if Bad Request (400)
 * @description A reusable assertion test to see if route had a 400 Bad Request.
 * @todo Create a testing helper and export it to other future route test files.
 * @param { * } response 
 */
const recognize400 = (response) => {
    assert.isNumber(response.errorCode);
    assert.equal(response.errorCode, 400);
    assert.isString(response.errorCodeMessage);
    assert.equal(response.errorCodeMessage, 'Bad Request');
}

/**
 * @function recognize404
 * @summary Check if Not Found (404)
 * @description A reusable assertion test to check if route had a 404 Not Found.
 * @param { * } response 
 */
const recognize404 = (response) => {
    assert.isNumber(response.errorCode);
    assert.equal(response.errorCode, 404);
    assert.isString(response.errorCodeMessage);
    assert.equal(response.errorCodeMessage, 'Not Found');
};

/**
 * @function recognize500
 * @summary Check if Internal Server Error (500)
 * @description A reusable assertion test to check if route had an Internal Server Error (500).
 * @param { * } response 
 */
const recognize500 = (response) => {
    assert.isNumber(response.errorCode);
    assert.equal(response.errorCode, 500);
    assert.isString(response.errorCodeMessage);
    assert.equal(response.errorCodeMessage, 'Internal Server Error');
}

/**
 * @function recognizeErrorMessage
 * @summary Check for contents of error message.
 * @description A reusable assertion test to check for a sub-string of the error message.
 * @param { * } response 
 * @param { string } partialMessage 
 */
const recognizeErrorMessage = (response, partialMessage) => {
    assert.isString(response.errorMessage);
    assert.containIgnoreCase(response.errorMessage, partialMessage);
};