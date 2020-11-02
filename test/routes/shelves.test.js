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
    bookShelf,
    magazineShelf
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
        let request;

        before(async () => {
            // FIXME: Fake shelves are returning undefined.
            // Create some shelves
            await bookShelf.save();
            await magazineShelf.save();
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
            const res = await chai.request(app).post(endpointURI).send({
                name: 'From Test',
                root: 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Magazines',
                showDirectories: true,
                multiFile: false
            });

            const response = res.body;
            assert.isNotNull(res);
            recognize201(res);

            assert.containIgnoreCase(response.name, 'From Test');
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

        it('Bad request with a too short ID string (12 characters minimum)', (done) => {
            chai.request(app).get(`${endpointURI}/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
                done();
            });
        });

        it('Unable to find shelf with bad ID', (done) => {
            chai.request(app).get(`${endpointURI}/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id:');
                done();
            });
        });

        it('Find a shelf with ID (Shelf Two)', (done) => {
            chai.request(app).get(`${endpointURI}/5ec5df19ed30ea2b80ef14ae`).end((err, res) => {
                assert.isNotNull(res);
                recognize200(res);
                assert.equal(res.body.name, 'Shelf Two');
                assert.containIgnoreCase(res.body.root, '/books');
                done();
            });
        });

        it('Find the magazine shelf (Shelf Three)', (done) => {
            chai.request(app).get(`${endpointURI}/5ec739cdc8bcdc4a1c74e75e`).end((err, res) => {
                assert.isNotNull(res);
                recognize200(res);
                assert.equal(res.body.name, 'Shelf Three');
                assert.containIgnoreCase(res.body.root, '/magazines/issues');
                done();
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

        it('Fail request with empty body', (done) => {
            request.send({}).end((err, res) => {
                assert.isNotNull(res);
                recognize400(res);
                recognizeErrorMessage(res, 'You did not send any information');
                done();
            });
        });

        it('Bad request with a too short ID string (12 characters minimum)', (done) => {
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
                done();
            });
        });

        it('Fail request because it could not find Shelf', (done) => {
            chai.request(app).put(`${endpointURI}/blahblahblah`).send({
                name: 'Shelf Derp',
                root: '/derp',
                showDirectories: true,
                multiFile: false
            }).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
                done();
            });
        });

        it('Successfully updated Shelf One', (done) => {
            request.send({
                name: 'Updated Shelf One',
                root: '/books/updated',
                showDirectories: true,
                multiFile: true
            }).end((err, res) => {
                const updatedShelf = res.body;
                assert.isNotNull(res);
                recognize200(res);

                // Test old and new values
                assert.equal(updatedShelf.name, 'Updated Shelf One');
                assert.notEqual(updatedShelf.name, 'Shelf One');
                assert.isNotArray(updatedShelf.root);
                assert.equal(updatedShelf.root, '/books/updated');
                assert.notEqual(updatedShelf.root, '/books');
                assert.isTrue(updatedShelf.showDirectories);
                assert.isNotFalse(updatedShelf.showDirectories);
                assert.isTrue(updatedShelf.multiFile);
                assert.isNotFalse(updatedShelf.multiFile);
                done();
            });
        });

        // Technically, this should be more of a PATCH, but not sure...
        it('Successfully updated Shelf Three with partial data', (done) => {
            chai.request(app).put(`${endpointURI}/${shelfThreeId}`).send({
                showDirectories: false,
            }).end((err, res) => {
                const updatedShelf = res.body;
                assert.isNotNull(res);
                recognize200(res);

                // Test old and new values
                assert.equal(updatedShelf.name, 'Shelf Three');
                assert.isNotArray(updatedShelf.root);
                assert.equal(updatedShelf.root, '/magazines');
                assert.isFalse(updatedShelf.multiFile);

                // Updated data
                assert.isFalse(updatedShelf.showDirectories);
                assert.isNotTrue(updatedShelf.showDirectories);
                done();
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

        it('Bad request with a too short ID string (12 characters minimum)', (done) => {
            chai.request(app).delete(`${endpointURI}/blah`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
                done();
            });
        });

        it('Fail request because it could not find Shelf', (done) => {
            chai.request(app).delete(`${endpointURI}/blahblahblah`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
                done();
            });
        });

        it('Successfully delete a Shelf', (done) => {
            chai.request(app).delete(`${endpointURI}/${shelfOneId}`).end((err, res) => {
                assert.isNotNull(res);
                recognize204(res);
                done();
            });
        });
    });

    describe(`GET - ${endpointURI}/:shelfId/refresh`, () => {
        const bookShelfId = '5f440bf9e3475949849c292e';

        before(async () => {

            let bookShelf = new Shelf({
                _id: bookShelfId,
                name: 'Book Shelf',
                // You will need to adjust the path accordingly
                root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books'],
                showDirectories: true,
                multiFile: false
            });
            
            await bookShelf.save();
        });

        it('Bad request with a too short ID string (12 characters minimum)', (done) => {
            chai.request(app).get(`${endpointURI}/blah/refresh`).end((err, res) => {
                assert.isNotNull(res);
                // TODO: This is subject to change once I am able to parse MongoDB errors.
                recognize400(res);
                recognizeErrorMessage(res, 'Cast to ObjectId failed');
                done();
            });
        });

        it('Fail request because it could not find Shelf', (done) => {
            chai.request(app).get(`${endpointURI}/blahblahblah/refresh`).end((err, res) => {
                assert.isNotNull(res);
                recognize404(res);
                recognizeErrorMessage(res, 'Unable to find shelf with id');
                done();
            });
        });

        it('Respond with no content if successful', (done) => {
            chai.request(app).get(`${endpointURI}/${bookShelfId}/refresh`).end((err, res) => {
                assert.isEmpty(res.body);
                recognize204(res);

                // Then retrieve a response to get the results from the database
                chai.request(app).get(`/api/v1/ebooks/shelf/${bookShelfId}`).end((err, res) => {
                    assert.lengthOf(res.body.breadcrumbs, 0);
                    assert.lengthOf(res.body.directories, 1);
                    assert.lengthOf(res.body.files, 0);

                    // Then dive into the folder to get its response
                    chai.request(app).get(`/api/v1/ebooks/shelf/${bookShelfId}/folder/${res.body.directories[0]._id}`).end((err, res) => {
                        assert.lengthOf(res.body.breadcrumbs, 1);
                        assert.lengthOf(res.body.directories, 0);
                        assert.lengthOf(res.body.files, 2);

                        done();
                    });
                });
            });
        });
    });
});