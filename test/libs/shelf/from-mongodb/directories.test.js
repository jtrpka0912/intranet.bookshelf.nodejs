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

    describe('No folders (documents) in the collection', () => {
        it('Should not find any documents.', () => {
            const folders = retrieveFolders();

            assert.equal(folders.length, 0);
        });
    });

    describe('Folders (documents) in the collection', () => {
        before(async () => {
            // Create some directories
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

            // Save Folders into mock database
            await bookExample.save();
            await magazineExample.save();
            await bookFoobar.save();
            await rootExample.save();
            await magazineExample.save();
        });
    });
});