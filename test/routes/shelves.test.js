// Packages
// ========
// Chai
const chai = require('chai');
const chaiHttp = require('chai-http'); // Chai-HTTP Plugin
chai.use(chaiHttp); // Allow Chai to use Chai-HTTP plugin.
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

        it('Return three shelves', () => {
            chai.request(app).get('/api/v1/shelves').end((err, res) => {
                const shelfCount = res.body.length;
                assert.equal(shelfCount, 3, 'Should return only three from mock MongoDB.');
                assert.isAbove(shelfCount, 2);
                assert.isBelow(shelfCount, 5);
            });
        });

        it('Return a status of 200', () => {
            chai.request(app).get('/api/v1/shelves').end((err, res) => {
                assert.equal(res.status, 200);
            });
        });

        it('Returns no errors', () => {
            chai.request(app).get('/api/v1/shelves').end((err, res) => {
                assert.isNull(err);
            });
        });
    });

    describe('POST - /api/v1/shelves', () => {
        it('Fail request because of short name', () => {
            chai.request(app).post('/api/v1/shelves').send({
                name: 'Yo', // Need to be three or more
                root: '/',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                assert.isNotNull(err, 'Should expect an error.');
            });
        });
    });
});