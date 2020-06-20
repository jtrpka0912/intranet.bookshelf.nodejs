// Packages
// ========
// NodeJS
const path = require('path');

// Chai
const chai = require('chai');
const chaiString = require('chai-string');
chai.use(chaiString)
const assert = chai.assert;

// Mongoose / MongoDB Mock
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Models
const Shelf = require('../../../models/shelf.model');
const Folder = require('../../../models/folder.model');

// Libs
const { retrieveFilesFolders, createFolderToMongoDB } = require('../../../libs/shelf/server');

// Global Variables
let mongoServer;

describe('Create and Retrieve Files and Folders through Server to MongoDB', () => {
    let unknownShelf;
    let bookShelf;

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

        // Create some shelves
        // ===================
        unknownShelf = new Shelf({
            name: 'Unknown Shelf',
            root: ['sample-server', 'Unknown'],
            showDirectories: true,
            multiFile: false
        });

        bookShelf = new Shelf({
            name: 'Book Shelf',
            // You will need to adjust the path accordingly
            root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books'],
            showDirectories: true,
            multiFile: false
        });

        await unknownShelf.save();
        await bookShelf.save();
    });

    after(async () => {
        // TODO: Fix comment typo in mongodb.test.js
        
        // Remove documents from collections
        await Shelf.deleteMany({});
        await Folder.deleteMany({});

        // Disconnect mongoose and stop the mock database
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('retrieveFilesFolders()', () => {
        it('Throw error if no shelf was passed', async () => {
            const error = await retrieveFilesFolders();
            // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
            assert.containIgnoreCase(error.message, 'Shelf was missing in call');
        });

        it('Throw error if shelf root directory was not found', async () => {
            const error = await retrieveFilesFolders(unknownShelf);
            // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
            assert.containIgnoreCase(error.message, 'no such file or directory');
        });

        it.skip('Find the new nodes from the book shelf in MongoDB', async () => {
            await retrieveFilesFolders(bookShelf);

            // Retrieve the folder count
            Folder.find().countDocuments(function(err, count) {
                assert.equal(count, 1);
            });

            const count = await Folder.find().countDocuments().exec();
            assert.equal(count, 1);

            const sampleFolder = await Folder.findOne({ name: 'Sample' }).exec();
            assert.isObject(sampleFolder);
            assert.equal(sampleFolder.name, 'Samples');
            assert.equal(Folder.convertPathToString(sampleFolder.path), 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Books/Samples');
        });  
    });

    describe('createFolderToMongoDB()', () => {
        it('Throw an error because it is missing node', async () => {
            const error = await createFolderToMongoDB();
            // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
            assert.containIgnoreCase(error.message, 'Missing node argument');
        });

        it('Throw an error because it is missing node path', async () => {
            const error = await createFolderToMongoDB('foo/bar');
            // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
            assert.containIgnoreCase(error.message, 'Missing node path argument');
        });

        it('Throw an error if folder does not exist in server', async () => {
            const node = 'FooBar';
            const rootStringPath = Shelf.convertRootToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);

            const error = await createFolderToMongoDB(node, nodePath);
            // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
            assert.containIgnoreCase(error.message, 'no such file or directory'); // From FS library
        });
    });

    describe('createFileToMongoDB()', () => {
        it('Add assertions');
    });
});