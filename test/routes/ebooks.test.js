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
const setup = require('../../libs/helpers/mocha/mongoose');

// App
const { app } = require('../../index'); // Get the Express app

// Models
const File = require('../../models/file.model'); // File model

// Helpers
const {
    recognizeErrorMessage,
    recognize200,
    recognize400,
    recognize404,
    recognize500,
    pathShouldBeString,
} = require('../../libs/helpers/mocha/express/assert'); // Helper Mocha Assert Tests

// Global Variables
const endpointURI = '/api/v1/ebooks';

describe('(ebooks.test.js) eBooks Router', () => {
    before(async () => {
        await setup.mongooseTestConnection();
    });

    after(async () => {
        await setup.mongoooseTestDisconnection();
    });

    describe(`GET - ${endpointURI}/:fileId/did-read`, () => {
        before(async() => {
            await createMongoItems();
        });

        after(async() => {
            await destroyMongoItems();
        });

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).patch(`${endpointURI}/blah/did-read`);

            assert.isNotNull(res);
            recognize400(res); // TODO: Missing from REST Specifications
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find File', async() => {
            const res = await chai.request(app).patch(`${endpointURI}/blahblahblah/did-read`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id.');
        });
    });
});

/**
 * @async
 * @function createMongoItems
 * @description Create the items to use when testing the endpoints.
 * @author J.T.
 */
const createMongoItems = async () => {
    const fileOne = new File({
        _id: '5fa80bb8f4f44b073c7b0737',
        type: 'book',
        name: 'File One',
        path: ['path', 'to', 'file-one.pdf'],
        cover: [],
        didRead: false
    });

    await fileOne.save();
}

/**
 * @async
 * @function destroyMongoItems
 * @description Detroy the items that were used for testing the endpoints.
 * @author J.T.
 */
const destroyMongoItems = async () => {
    await File.deleteMany({});
};