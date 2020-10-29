// Packages
// ========
// NodeJS
const path = require('path');

// Chai
const chai = require('chai');
const chaiString = require('chai-string');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiString); // String libary
chai.use(chaiAsPromised); // Promise library
const assert = chai.assert;


// Mongoose / MongoDB Mock
const setup = require('../../../libs/helpers/mocha/mongoose');

// Models
const Shelf = require('../../../models/shelf.model');
const Folder = require('../../../models/folder.model');
const File = require('../../../models/file.model');

// Libs
const { removeFilesFolders, retrieveFilesFolders, createFolderToMongoDB, createFileToMongoDB } = require('../../../libs/shelf/server');
const { pathArrayToString, pathStringToArray } = require('../../../libs/helpers/routes');

describe('(server.test.js) Create and Retrieve Files and Folders through Server to MongoDB', () => {
    let unknownShelf;
    let bookShelf;

    before(async () => {
        await setup.mongooseTestConnection();

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

        // TODO Add magazine shelf

        await unknownShelf.save();
        await bookShelf.save();
    });

    after(async () => {
        // Remove documents from collections
        await Shelf.deleteMany({});

        await setup.mongoooseTestDisconnection();
    });

    describe('removeFilesFolders()', () => {
        it('Throw error if no shelf was passed.', async () => {
            assert.isRejected(removeFilesFolders());
        });
    });
    
    describe('retrieveFilesFolders()', () => {
        afterEach(async () => {
            await Folder.deleteMany();
            await File.deleteMany(); // NOTE: Why was this left out?
        });

        it('Throw error if no shelf was passed', async () => {
            assert.isRejected(retrieveFilesFolders())
        });

        it('Throw error if shelf root directory was not found', async () => {
            assert.isRejected(retrieveFilesFolders(unknownShelf));
        });

        it('Find the new nodes from the book shelf in MongoDB', async () => {
            await retrieveFilesFolders(bookShelf);

            // Retrieve the folder count
            const count = await Folder.find().countDocuments().exec();
            assert.equal(count, 1);

            // Retrieve the folder that was created
            const sampleFolder = await Folder.findOne({ 
                name: 'Samples', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'Samples'] 
            }).exec();
            assert.isObject(sampleFolder, 'Unable to find sampleFolder');
            assert.equal(sampleFolder.name, 'Samples');
            assert.equal(pathArrayToString(sampleFolder.path), 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Books/Samples');

            // Count the files that were created
            const fileCount = await File.find({}).countDocuments().exec();
            assert.equal(fileCount, 2);

            // Check the sample pdf file
            const samplePdf = await File.findOne({ 
                name: 'sample', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'Samples', 'sample.pdf']
            }).exec();
            assert.isObject(samplePdf, 'Unable to find samplePdf');
            assert.equal(samplePdf.type, 'book');
            assert.equal(samplePdf.name, 'sample');
            assert.isArray(samplePdf.path);
            assert.isArray(samplePdf.cover);
            assert.isFalse(samplePdf.didRead);

            // Check the another sample pdf file
            const anotherPdf = await File.findOne({ 
                name: 'another-sample', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'Samples', 'another-sample.pdf']
            }).exec();
            assert.isObject(anotherPdf, 'Unable to find anotherPdf');
            assert.equal(anotherPdf.type, 'book');
            assert.equal(anotherPdf.name, 'another-sample');
            assert.isArray(anotherPdf.path);
            assert.isArray(anotherPdf.cover);
            assert.isFalse(anotherPdf.didRead);

            // TODO: Figure out how to check how many times createFolderToMongoDB and createFileToMongoDB were called.
        });
    });

    describe('createFolderToMongoDB()', () => {
        afterEach(async () => {
            // Remove any of the folders created from here
            await Folder.deleteMany();
        });

        it('Throw an error because it is missing node', async () => {
            assert.isRejected(createFolderToMongoDB());
        });

        it('Throw an error because it is missing node path', async () => {
            assert.isRejected(createFolderToMongoDB('foo/bar'));
        });

        it('Throw an error if folder does not exist in server', async () => {
            const node = 'FooBar';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);
            assert.isRejected(createFolderToMongoDB(node, nodePath));
        });

        it('Return back the Folder MongoDB document', async () => {
            const node = 'Samples';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);

            const response = await createFolderToMongoDB(node, nodePath);

            assert.isObject(response);
            assert.equal(response.name, node);
            assert.isArray(response.path);
        });

        it('Prevent duplicated folders from being created', async () => {
            const node = 'Samples';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);

            await createFolderToMongoDB(node, nodePath);
            await createFolderToMongoDB(node, nodePath); // This should be prevented

            const count = await Folder.find().countDocuments().exec();
            assert.equal(count, 1);
        });
    });

    describe('createFileToMongoDB()', () => {
        afterEach(async () => {
            // Remove any of the files created here
            await File.deleteMany();
        });

        it('Throw an error because it is missing node', async () => {
            assert.isRejected(createFileToMongoDB());
        });

        it('Throw an error because it is missing node path', async () => {
            assert.isRejected(createFileToMongoDB('foo/bar'));
        });

        it('Throw an error if file does not exist in server', async () => {
            const node = 'Samples/foobar.pdf';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);
            assert.isRejected(createFolderToMongoDB(node, nodePath));
        });

        it('Return back the File MongoDB document', async () => {
            const node = 'Samples/sample.pdf';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);

            const response = await createFileToMongoDB(node, nodePath);

            assert.isObject(response);
            assert.equal(response.type, 'book');
            assert.equal(response.name, 'sample');
            assert.isArray(response.path);
            assert.isArray(response.cover);
            assert.isFalse(response.didRead);
        });

        it('Prevent duplicated files from being created', async () => {
            const node = 'Samples/sample.pdf';
            const rootStringPath = pathArrayToString(bookShelf.root);
            const nodePath = path.join(rootStringPath, node);

            await createFileToMongoDB(node, nodePath);
            await createFileToMongoDB(node, nodePath); // This should not create the file

            const count = await File.find().countDocuments().exec();
            assert.equal(count, 1);
        });
    });
});