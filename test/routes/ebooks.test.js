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

// Global Variables
const endpointURI = '/api/v1/ebooks';

describe('(ebooks.test.js) eBooks Router', () => {
    before(async () => {
        await setup.mongooseTestConnection();
    });

    after(async () => {
        await setup.mongoooseTestDisconnection();
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
        before(async() => {
            await createMongoItems();
        });

        after(async() => {
            await destroyMongoObjects();
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
        _id: 'fileOne-abcd-efgh',
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