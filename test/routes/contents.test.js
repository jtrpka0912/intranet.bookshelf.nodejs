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
const Shelf = require('../../models/shelf.model'); // Shelf model
const Folder = require('../../models/folder.model'); // Folder model
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
const endpointURI = '/api/v1/contents';
const shelfOneId = '5ec73853788ef556ecc225dd';
const shelfTwoId = '5f3e762dbc0d6f00200404b2';

const folderOneId = '5f3eaf75dd9ede497015699a';
const folderTwoId = '5f3eaf75dd9ede497015699b';
const folderThreeId = '5f3eaf75dd9ede497015699c';

describe('(contents.test.js) Contents Router', () => {
    before(async () => {
        await setup.mongooseTestConnection();
    });

    after(async () => {
        await setup.mongoooseTestDisconnection();
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId`, () => {
        before(async () => {
            await createMongoItems();
        });

        after(async () => {
            await destroyMongoItems();
        });

        it('Should not be able to find endpoint with no shelfId.', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Missing Shelf ID.');
        });

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/blah`);
            assert.isNotNull(res);
            recognize400(res); // TODO: Missing from REST Specifications
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find Shelf', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/blahblahblah`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find shelf with id');
        });

        it('Successfully be able to find files and folders from book shelf', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}`)
            assert.isNotNull(res);
            recognize200(res);

            // Expect the shelf to return back
            assert.isObject(res.body.shelf, 'This is not an object');

            // Though the shelf is not inside an array.
            //    Put it inside the array just to let this assertion function to do its job.
            pathShouldBeString([res.body.shelf]); 

            // Only expecting one folder, from directories, to arrive
            assert.lengthOf(res.body.directories, 1, 'Incorrect folder count');

            // Check if directory paths are strings
            pathShouldBeString(res.body.directories);

            // Expecting two files to arrive
            assert.lengthOf(res.body.files, 2, 'Incorrect file count');
            
            // Check if file paths are strings
            pathShouldBeString(res.body.files);
        });

        it('Successfully be able to find no files, but one folder from magazine shelf', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfTwoId}`)
            assert.isNotNull(res);
            recognize200(res);

            // Expect the shelf to return back
            assert.isObject(res.body.shelf, 'This is not an object');
            
            // Though the shelf is not inside an array.
            //    Put it inside the array just to let this assertion function to do its job.
            pathShouldBeString([res.body.shelf]); 

            // Expects one folder though that folder does have another folder
            assert.lengthOf(res.body.directories, 1);
            pathShouldBeString(res.body.directories);

            assert.lengthOf(res.body.files, 0);
        });
    });

    describe(`GET - ${endpointURI}/shelf/:shelfId/folder/:folderId`, () => {
        before(async () => {
            await createMongoItems();
        });

        after(async () => {
            await destroyMongoItems();
        });

        it('Should not be able to find endpoint with no shelfId.', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/:shelfId/folder`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Missing Folder ID.');
        });

        it('Bad request with a too short ID string (12 characters minimum)', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}/folder/meh`);
            assert.isNotNull(res);
            recognize400(res);
            recognizeErrorMessage(res, 'Cast to ObjectId failed');
        });

        it('Fail request because it could not find Folder', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}/folder/blahblahblah`);
            assert.isNotNull(res);
            recognize404(res);
            recognizeErrorMessage(res, 'Unable to find folder with id');
        });

        it('Fail to find folder from book shelf.', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}/folder/${folderTwoId}`);
            assert.isNotNull(res);
            recognize500(res);
            recognizeErrorMessage(res, 'Shelf and current folder are not compatible');
        });

        it('Find one file from the book shelf\'s example folder', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfOneId}/folder/${folderOneId}`);
            assert.isNotNull(res);
            recognize200(res);

            assert.isObject(res.body.shelf, 'This is not an object');
            // Though the shelf is not inside an array.
            //    Put it inside the array just to let this assertion function to do its job.
            pathShouldBeString([res.body.shelf]);

            assert.isArray(res.body.directories);
            assert.lengthOf(res.body.directories, 0);
            pathShouldBeString(res.body.directories);
            
            assert.isArray(res.body.files);
            assert.lengthOf(res.body.files, 1);
            pathShouldBeString(res.body.files);
            
            // Though SHELF root will be part of breadcrumbs, but the folder only array will have none.
            assert.isArray(res.body.breadcrumbs);
            assert.lengthOf(res.body.breadcrumbs, 0);
            pathShouldBeString(res.body.breadcrumbs, true);
        });

        it('Find all magazine issues from the example issues folder', async() => {
            const res = await chai.request(app).get(`${endpointURI}/shelf/${shelfTwoId}/folder/${folderThreeId}`)
            assert.isNotNull(res);
            recognize200(res);

            assert.isObject(res.body.shelf, 'This is not an object');
            // Though the shelf is not inside an array.
            //    Put it inside the array just to let this assertion function to do its job.
            pathShouldBeString([res.body.shelf]);

            assert.isArray(res.body.directories);
            assert.lengthOf(res.body.directories, 0);
            pathShouldBeString(res.body.directories);
            
            assert.isArray(res.body.files);
            assert.lengthOf(res.body.files, 4);
            pathShouldBeString(res.body.files);
            
            // Though SHELF root will be part of breadcrumbs, but the folder only array will have none.
            assert.isArray(res.body.breadcrumbs);
            assert.lengthOf(res.body.breadcrumbs, 0);
            pathShouldBeString(res.body.breadcrumbs, true);
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
    // Create a shelf
    const bookShelf = new Shelf({
        _id: shelfOneId,
        name: 'Shelf One',
        root: ['books'],
        showDirectories: true,
        multiFile: false
    });

    const magazineShelf = new Shelf({
        _id: shelfTwoId,
        name: 'Shelf Two',
        root: ['magazines'],
        showDirectories: true,
        multiFile: false
    });

    // Create some folders
    // ===================

    const folderOne = new Folder({
        _id: folderOneId,
        name: 'Example',
        path: ['books', 'example']
    });

    const folderTwo = new Folder({
        _id: folderTwoId,
        name: 'Foobar',
        path: ['foo', 'bar']
    });

    const folderThree = new Folder({
        _id: folderThreeId,
        name: 'Issues',
        path: ['magazines', 'issues']
    });

    // Create some files
    // =================

    const bookOne = new File({
        type: 'book',
        name: 'Book One',
        path: ['books', 'example', 'book1.pdf'],
        cover: ['images', 'books', 'example', 'Book One.jpg'],
        didRead: false
    });

    const bookTwo = new File({
        type: 'book',
        name: 'Book Two',
        path: ['books', 'book2.pdf'],
        cover: ['images', 'books', 'Book Two.jpg'],
        didRead: true
    });

    const bookThree = new File({
        type: 'book',
        name: 'Book Three',
        path: ['books', 'book3.epub'],
        cover: ['images', 'books', 'Book Three.jpg'],
        didRead: true
    });

    const magazineOne = new File({
        type: 'magazine',
        name: 'Magainze Issue 001',
        path: ['magazines', 'issues', '001.pdf'],
        cover: [],
        didRead: false
    });

    const magazineTwo = new File({
        type: 'magazine',
        name: 'Magainze Issue 002',
        path: ['magazines', 'issues', '002.pdf'],
        cover: [],
        didRead: false
    });

    const magazineThree = new File({
        type: 'magazine',
        name: 'Magainze Issue 003',
        path: ['magazines', 'issues', '003.pdf'],
        cover: [],
        didRead: false
    });

    const magazineFour = new File({
        type: 'magazine',
        name: 'Magainze Issue 004',
        path: ['magazines', 'issues', '004.pdf'],
        cover: [],
        didRead: false
    });

    await bookShelf.save();
    await magazineShelf.save();
    await folderOne.save();
    await folderTwo.save();
    await folderThree.save();
    await bookOne.save();
    await bookTwo.save();
    await bookThree.save();
    await magazineOne.save();
    await magazineTwo.save();
    await magazineThree.save();
    await magazineFour.save();
};

/**
 * @async
 * @function destroyMongoItems
 * @description Detroy the items that were used for testing the endpoints.
 * @author J.T.
 */
const destroyMongoItems = async () => {
    // Remove all shelves, files, and folders
    await Shelf.deleteMany({});
    await File.deleteMany({});
    await Folder.deleteMany({});
};