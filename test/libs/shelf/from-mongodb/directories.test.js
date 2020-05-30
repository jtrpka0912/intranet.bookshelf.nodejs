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
            useUnifiedTopology: true
        });
    });

    after(async () => {
        // Disconnect mongoose and stock the mock database.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('Should not find any documents.', async () => {
        const folders = await retrieveFolders();
        assert.equal(folders.length, 0);
    });

    describe('Folders (documents) in the collection', () => {
        let bookShelf;

        before(async () => {
            // Create some shelves
            // ===================
            bookShelf = new Shelf({
                _id: '5ecd01b4a3d0b90b0830a25a',
                name: 'Book Shelf',
                root: '/books',
                showDirectories: true,
                multiFile: false
            });

            // Create some directories
            // =======================
            const bookExample = new Folder({
                name: 'Book Example',
                path: '/books/example'
            });

            const magazineExample = new Folder({
                name: 'Magazine Example',
                path: '/magazines/example'
            });

            const bookFoobar = new Folder({
                name: 'Book Foobar',
                path: '/books/foobar'
            });

            const rootExample = new Folder({
                name: 'Root Example',
                path: '/example'
            });

            const magazineExampleIssues = new Folder({
                name: 'Issues',
                path: '/magazines/example/issues'
            });

            // Save Shelves into mock database
            await bookShelf.save();

            // Save Folders into mock database
            await bookExample.save();
            await magazineExample.save();
            await bookFoobar.save();
            await rootExample.save();
            await magazineExample.save();
        });

        after(async () => {
            Shelf.deleteMany({});
            Folder.deleteMany({});
        });

        it('Find all folders from book shelf', async () => {
            const folders = await retrieveFolders(bookShelf);
            assert.equal(folders.length, 2);
        });
    });
});