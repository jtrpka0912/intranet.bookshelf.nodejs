// Packages
// ========
// Chai
const chai = require('chai');
const chaiString = require('chai-http');
chai.use(chaiString);
const assert = chai.assert;

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Models
const Shelf = require('../../../../models/shelf.model');
const Folder = require('../../../../models/folder.model');

// Libs
const { retrieveFolders } = require('../../../../libs/shelf/from-mongodb/directories');

// Global Variables
let mongoServer;

describe('Directories from MongoDB', () => {
    before(async () => {
        // Set up an in-memory MongoDB server
        mongoServer = new MongoMemoryServer();

        // Retrieve the URI from the mock database
        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
    });

    after(async () => {
        // Disconnect mongoose and stock the mock database.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('Should not find any documents.', async () => {
        // TODO: Should it throw an empty array or an error message
        const folders = await retrieveFolders();
        assert.equal(folders.length, 0);
    });

    describe('Folders (documents) in the collection', () => {
        let bookShelf;
        let magazineShelf;

        let bookExample;
        let magazineExample;
        let bookFoobar;
        let rootExample;
        let magazineExampleIssues;

        before(async () => {
            // Create some shelves
            // ===================
            bookShelf = new Shelf({
                name: 'Book Shelf',
                root: ['books'],
                showDirectories: true,
                multiFile: false
            });

            magazineShelf = new Shelf({
                name: 'Magazine Shelf',
                root: ['magazines'],
                showDirectories: true,
                multiFile: false
            });

            // Create some directories
            // =======================
            bookExample = new Folder({
                name: 'Book Example',
                path: ['books', 'example']
            });

            magazineExample = new Folder({
                name: 'Magazine Example',
                path: ['magazines', 'example']
            });

            bookFoobar = new Folder({
                name: 'Book Foobar',
                path: ['books', 'foobar']
            });

            rootExample = new Folder({
                name: 'Root Example',
                path: ['example']
            });

            magazineExampleIssues = new Folder({
                name: 'Issues',
                path: ['magazines', 'example', 'issues']
            });

            // Save Shelves into mock database
            await bookShelf.save();
            await magazineShelf.save();

            // Save Folders into mock database
            await bookExample.save();
            await magazineExample.save();
            await bookFoobar.save();
            await rootExample.save();
            await magazineExampleIssues.save();
        });

        after(async () => {
            Shelf.deleteMany({});
            Folder.deleteMany({});
        });

        it('Find the one folder from magazine shelf root directory.', async () => {
            const folders = await retrieveFolders(magazineShelf);
            assert.equal(folders.length, 1);
        });

        it('Find the two folders in the books shelf', async () => {
            const folders = await retrieveFolders(bookShelf);
            assert.equal(folders.length, 2);
        });

        it.skip('Find the magazine example issues', async () => {
            const folders = await retrieveFolders(magazineShelf, magazineExampleIssues);
            assert.equal(folders.length, 1);
        });
    });
});