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
const fileOneId = '5fa80bb8f4f44b073c7b0737';
const fileTwoId = '5fa81b35579aed0d48253c45';

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
            const res = await chai.request(app).patch(`${endpointURI}/blahblahblah/did-read`).send({
                didRead: false
            });

            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id.');
        });

        it('Fail request because the did read value is not a boolean.', async() => {
            const res = await chai.request(app).patch(`${endpointURI}/${fileOneId}/did-read`).send({
                didRead: 'abc'
            });

            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'didRead is not a boolean value.');
        });

        it('Successfully change the file to be flagged read.', async() => {
            const res = await chai.request(app).patch(`${endpointURI}/${fileOneId}/did-read`).send({
                didRead: true
            });

            assert.isNotNull(res);
            recognize200(res);
            
            const mongoFile = await File.findById(fileOneId);
            assert.isTrue(mongoFile.didRead);
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
        _id: fileOneId,
        type: 'book',
        name: 'File One',
        path: ['path', 'to', 'file-one.pdf'],
        cover: [],
        didRead: false
    });

    const fileTwo = new File({
        _id: fileTwoId,
        type: 'book',
        name: 'File Two',
        path: ['path', 'to', 'file-two.pdf'],
        cover: [],
        didRead: false
    });

    await fileOne.save();
    await fileTwo.save();
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