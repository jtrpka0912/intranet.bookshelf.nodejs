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
const { removeFilesFolders, retrieveFilesFolders, createFolderToMongoDB, createFileToMongoDB, retrieveCoverImage } = require('../../../libs/shelf/server');
const { pathArrayToString, pathStringToArray } = require('../../../libs/helpers/routes');

describe('(server.test.js) Create and Retrieve Files and Folders through Server to MongoDB', () => {
    let unknownShelf, bookShelf;

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

        // TODO: Add magazine shelf

        await unknownShelf.save();
        await bookShelf.save();
    });

    after(async () => {
        // Remove documents from collections
        await Shelf.deleteMany({});

        await setup.mongoooseTestDisconnection();
    });

    describe('removeFilesFolders()', () => {
        let deleteShelf;
        let deleteOneFolder, deleteTwoFolder, deleteOneIchiFolder;
        let deleteFile, deleteFileTwoYi, deleteFileTwoEr, deleteFileIchiYi;

        before(async () => {
            // Create the shelf
            deleteShelf = new Shelf({
                name: 'Delete Shelf',
                root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete'],
                showDirectories: true,
                multiFile: false
            });

            // Create the folders
            deleteOneFolder = new Folder({
                name: 'Delete Folder One',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder One']
            });

            deleteTwoFolder = new Folder({
                name: 'Delete Folder Two',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder Two']
            });

            deleteOneIchiFolder = new Folder({
                name: 'Delete Folder Ichi',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder One', 'Delete Folder Ichi']
            });

            // Create the files
            deleteFile = new File({
                name: 'Delete File',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete File.pdf']
            });

            deleteFileTwoYi = new File({
                name: 'Delete File Yi',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder Two', 'Delete File Yi.pdf']
            });

            deleteFileTwoEr = new File({
                name: 'Delete File Er',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder Two', 'Delete File Er.pdf']
            });

            deleteFileIchiYi = new File({
                name: 'Delete File Ichi Yi',
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Delete', 'Delete Folder One', 'Delete Folder Ichi', 'Delete File Ichi Yi.pdf']
            });

            // Save the shelf
            await deleteShelf.save();

            // Save the folders
            await deleteOneFolder.save();
            await deleteTwoFolder.save();
            await deleteOneIchiFolder.save();

            // Save the files
            await deleteFile.save();
            await deleteFileTwoYi.save();
            await deleteFileTwoEr.save();
            await deleteFileIchiYi.save();
        });

        after(async () => {
            // Remove documents from collections
            await Shelf.deleteMany({});
            await Folder.deleteMany({});
            await File.deleteMany({});
        });

        it('Throw error if no shelf was passed.', async () => {
            assert.isRejected(removeFilesFolders());
        });

        it('Throw error if shelf root directory was not found', async () => {
            assert.isRejected(retrieveFilesFolders(unknownShelf));
        });

        it('Remove all of the files and folders no longer found in the Delete shelf directory.', async () => {
            await removeFilesFolders(deleteShelf);

            const folders = await Folder.find({}).countDocuments().exec();
            const files = await File.find({}).countDocuments().exec();
            
            assert.isNumber(folders, 'Not a number.');
            assert.isNumber(files, 'Not a number.');
            assert.equal(folders, 0, 'There should be nothing left.');
            assert.equal(files, 0, 'There should be nothing left.');
        });
    });
    
    describe('retrieveFilesFolders()', () => {
        afterEach(async () => {
            await Folder.deleteMany();
            await File.deleteMany(); // NOTE: Why was this left out?
        });

        it('Throw error if no shelf was passed', async () => {
            assert.isRejected(retrieveFilesFolders());
        });

        it('Throw error if shelf root directory was not found', async () => {
            assert.isRejected(retrieveFilesFolders(unknownShelf));
        });

        it.skip('Find the new nodes from the book shelf in MongoDB', async () => {
            await retrieveFilesFolders(bookShelf);

            // Retrieve the folder count
            const count = await Folder.find().countDocuments().exec();
            assert.equal(count, 2);

            // Retrieve one of the folders that was created
            const sampleFolder = await Folder.findOne({ 
                name: 'Samples', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'Samples'] 
            }).exec();
            assert.isObject(sampleFolder, 'Unable to find sampleFolder');
            assert.equal(sampleFolder.name, 'Samples');
            assert.equal(pathArrayToString(sampleFolder.path), 'd:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Books/Samples');

            // Count the files that were created
            const fileCount = await File.find({}).countDocuments().exec();
            assert.equal(fileCount, 4);

            // Check one of the sample pdf file
            const samplePdf = await File.findOne({ 
                name: 'sample', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'Samples', 'sample.pdf']
            }).exec();
            assert.isObject(samplePdf, 'Unable to find samplePdf');
            assert.equal(samplePdf.type, 'book');
            assert.equal(samplePdf.name, 'sample');
            assert.isArray(samplePdf.path);
            assert.isArray(samplePdf.cover);
            assert.equal(samplePdf.cover[samplePdf.length -1], 'sample.jpg');
            assert.isFalse(samplePdf.didRead);

            // Check the another sample pdf file
            const moreMobi = await File.findOne({ 
                name: 'Random Mobi', 
                path: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books', 'More', 'Random Mobi.mobi']
            }).exec();
            assert.isObject(moreMobi, 'Unable to find the mobi one');
            assert.equal(moreMobi.type, 'book');
            assert.equal(moreMobi.name, 'Random Mobi');
            assert.isArray(moreMobi.path);
            assert.isArray(moreMobi.cover);
            // TODO: Special case for epubs/mobis
            assert.isFalse(moreMobi.didRead);
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

    describe('retrieveCoverImage', () => {
        afterEach(async () => {
            // TODO: Look through, and remove all folders and files from the public/images/cover folder

            // Remove any of the files created here
            await File.deleteMany();
        });

        it('Throw an error because it is missing the file', async () => {
            // FIXME: Without the thrown error; it still passes the test case even with error log messages stating it was expecting a rejected promise instead of being fulfilled.
            assert.isRejected(retrieveCoverImage());
        });

        it('Throw an error because the original file does not exist.', async () => {
            const runawayBook = new File({
                name: 'Does not exist',
                path: ['c:', 'not', 'here.pdf']
            });

            await runawayBook.save();
            assert.isRejected(retrieveCoverImage(runawayBook));
        });

        it('Return the expected file path for a PDF file.', async () => {
            // Create a sample file document
            const sampleBook = new File({
                name: 'Sample',
                path: bookShelf.root.concat(['Samples', 'sample.pdf'])
            });

            const sampleBookMongo = await sampleBook.save();

            await retrieveCoverImage(sampleBookMongo);

            const updatedSampleFile = await File.findOne({_id: sampleBookMongo._id});

            // 3 (public/images/cover) + 8 (d:/Backend/Nodejs/intranet.bookshelf.nodejs/test/sample-server/Books/Samples) + 1(sample.jpg)
            const expectedArrayLength = 12;

            assert.isArray(updatedSampleFile.cover);
            assert.lengthOf(updatedSampleFile.cover, expectedArrayLength);
            assert.equal(updatedSampleFile.cover[expectedArrayLength - 1], 'sample.png');
        });
    
        it('Return the expected file path when it had a fault cover path.', async () => {
            // Create a sample file document
            const badCoverBook = new File({
                name: 'Another Sample',
                path: bookShelf.root.concat(['Samples', 'another-sample.pdf']),
                cover: ['c:', 'does', 'not', 'exist.png']
            });

            const badCoverBookMongo = await badCoverBook.save();

            await retrieveCoverImage(badCoverBookMongo);

            const goodCoverBook = await File.findOne({_id: badCoverBookMongo._id});

            const expectedArrayLength = 12;

            assert.isArray(goodCoverBook.cover);
            assert.lengthOf(goodCoverBook.cover, expectedArrayLength);
            assert.equal(goodCoverBook.cover[expectedArrayLength - 1], 'another-sample.png');
        });
    });
});