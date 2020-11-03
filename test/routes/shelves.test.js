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
const setup = require('../../libs/helpers/mocha/mongoose');

// App
const { app } = require('../../index'); // Get the Express app

// Models
const File = require('../../models/file.model');
const Folder = require('../../models/folder.model');
const Shelf = require('../../models/shelf.model');

// Helpers
const {
    recognizeErrorMessage,
    recognize200,
    recognize201,
    recognize204,
    recognize400,
    recognize404,
} = require('../../libs/helpers/mocha/express/assert'); // Helper Mocha Assert Tests

const {
    bookShelfArray,
    bookShelfString,
    magazineShelfArray,
    magazineShelfString
} = require('../../libs/fake-data/mock-objects');

// Global Variables
const endpointURI = '/api/v1/shelves';

describe('(shelves.test.js) Shelves Router', () => {
    before(async () => {
        await setup.mongooseTestConnection();
    });

    after(async () => {
        await setup.mongoooseTestDisconnection();        
    });

    describe(`GET - ${endpointURI}`, () => {
        before(async () => {
            // Create some shelves
            await Shelf(bookShelfArray).save();
            await Shelf(magazineShelfArray).save();
        });
        
        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Return two shelves', async () => {
            const res = await chai.request(app).get(endpointURI);
            recognize200(res);
            const shelfCount = res.body.length;
            assert.equal(shelfCount, 2, 'Should return only two from database.');

            // Check paths
            assert.equal(res.body[0].root, 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Books');
            assert.equal(res.body[1].root, 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Magazines');
        });
    });

    describe(`POST - ${endpointURI}`, () => {
        afterEach(async () => {
            await Folder.deleteMany({});
            await File.deleteMany({});
        });

        after(async () => {
            // Clear out all shelf test documents.
            await Shelf.deleteMany({});
        });

        it('Fail request with empty body', async () => {
            const res = await chai.request(app).post(endpointURI).send({});
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'is required.');
        });

        it('Fail request because of short name', async () => {
            const res = await chai.request(app).post(endpointURI).send({
                name: 'Yo', // Need to be three or more
                root: '/',
                showDirectories: true,
                multiFile: false
            });
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'is shorter than the minimum allowed');
        });

        it('Fail request because of conflicts with show directories and multi-files.', async () => {
            const res = await chai.request(app).post(endpointURI).send({
                name: 'Sample',
                root: '/',
                showDirectories: false,
                multiFile: true
            });
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'you can not use multi-file directories');
        });

        it('Successfully create a new shelf', async () => {
            const res = await chai.request(app).post(endpointURI).send(magazineShelfString);

            const response = res.body;
            assert.isNotNull(res);
            recognize201(res);

            assert.containIgnoreCase(response.name, 'Magazine');
            assert.isNotArray(response.root); // We make it an array in mongo, but should return back as string
            assert.equal(response.root, 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Magazines');
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
                root: ['magazines', 'issues'],
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

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/blah`);
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Unable to find shelf with bad ID', async() => {
            const res = await chai.request(app).get(`${endpointURI}/blahblahblah`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id:');
        });

        it('Find a shelf with ID (Shelf Two)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/5ec5df19ed30ea2b80ef14ae`);
            assert.isNotNull(res);
            recognize200(res);
            assert.equal(res.body.name, 'Shelf Two');
            assert.containIgnoreCase(res.body.root, 'books');
        });

        it('Find the magazine shelf (Shelf Three)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/5ec739cdc8bcdc4a1c74e75e`);
            assert.isNotNull(res);
            recognize200(res);
            assert.equal(res.body.name, 'Shelf Three');
            assert.containIgnoreCase(res.body.root, 'magazines/issues');
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

        it('Fail request with empty body', async() => {
            const res = await request.send({});
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'You did not send any information');
        });

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/blah`).send({
                name: 'Shelf Derp',
                root: '/derp',
                showDirectories: true,
                multiFile: false
            });
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find Shelf', async() => {
            const res = await chai.request(app).put(`${endpointURI}/blahblahblah`).send({
                name: 'Shelf Derp',
                root: '/derp',
                showDirectories: true,
                multiFile: false
            });
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id');
        });

        it('Successfully updated Shelf One', async() => {
            const res = await request.send({
                name: 'Updated Shelf One',
                root: '/books/updated',
                showDirectories: true,
                multiFile: true
            });

            const updatedShelf = res.body;
            assert.isNotNull(res);
            recognize200(res);

            // Test old and new values
            assert.equal(updatedShelf.name, 'Updated Shelf One');
            assert.notEqual(updatedShelf.name, 'Shelf One');
            assert.isNotArray(updatedShelf.root);
            assert.equal(updatedShelf.root, 'books/updated');
            assert.notEqual(updatedShelf.root, 'books');
            assert.isTrue(updatedShelf.showDirectories);
            assert.isNotFalse(updatedShelf.showDirectories);
            assert.isTrue(updatedShelf.multiFile);
            assert.isNotFalse(updatedShelf.multiFile);
        });

        // Technically, this should be more of a PATCH, but not sure...
        it('Successfully updated Shelf Three with partial data', async() => {
            const res = await chai.request(app).put(`${endpointURI}/${shelfThreeId}`).send({
                showDirectories: false,
            });
            
            const updatedShelf = res.body;
            assert.isNotNull(res);
            recognize200(res);

            // Test old and new values
            assert.equal(updatedShelf.name, 'Shelf Three');
            assert.isNotArray(updatedShelf.root);
            assert.equal(updatedShelf.root, 'magazines');
            assert.isFalse(updatedShelf.multiFile);

            // Updated data
            assert.isFalse(updatedShelf.showDirectories);
            assert.isNotTrue(updatedShelf.showDirectories);
        });
    });

    describe(`DELETE - ${endpointURI}/:shelfId`, () => {
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

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).delete(`${endpointURI}/blah`);
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find Shelf', async() => {
            const res = await chai.request(app).delete(`${endpointURI}/blahblahblah`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id');
        });

        it('Successfully delete a Shelf', async() => {
            const res = await chai.request(app).delete(`${endpointURI}/${shelfOneId}`)
            assert.isNotNull(res);
            recognize204(res);
        });
    });

    describe(`GET - ${endpointURI}/:shelfId/refresh`, () => {
        before(async () => {
            let bookShelf = new Shelf(bookShelfArray);
            await bookShelf.save();
        });

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/blah/refresh`);
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find Shelf', async() => {
            const res = await chai.request(app).get(`${endpointURI}/blahblahblah/refresh`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id');
        });

        it('Respond with no content if successful', async() => {
            // First retrieve the book shelf we created for this test.
            const bookShelf = await Shelf.findOne({ name: 'Book Shelf' });

            // Check if it still fetches that book shelf from the endpoint.
            const res = await chai.request(app).get(`${endpointURI}/${bookShelf._id}/refresh`);
            assert.isEmpty(res.body);
            recognize204(res);
        });
    });
});