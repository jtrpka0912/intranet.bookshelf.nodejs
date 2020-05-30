// Packages
// ========
// Chai
const chai = require('chai');
const chaiString = require('chai-string');
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

    it('Throw an error because its missing a shelf', async () => {
        const error = await retrieveFolders();
        assert.isString(error.errorCodeMessage);
        assert.containIgnoreCase(error.errorMessage, 'Shelf was missing in call.');
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

        it('Find the magazine example issues', async () => {
            const folders = await retrieveFolders(magazineShelf, magazineExample);
            assert.equal(folders.length, 1);
        });

        it('Return an error message that shelf and folder do not belong to each other.', async () => {
            const error = await retrieveFolders(magazineShelf, rootExample);
            assert.containIgnoreCase(error.errorMessage, 'Shelf and current folder are not compatible');
        });
    });
});