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
const Shelf = require('../../../models/shelf.model');
const Folder = require('../../../models/folder.model');
const File = require('../../../models/file.model');

// Libs
const { 
    retrieveFiles, 
    retrieveDirectories,
    isCurrentFolderCompatible, // Really shouldn't be exported, but doing it for testing reasons.
    getSizeExpression // Really shouldn't be exported, but doing it for testing reasons.
} = require('../../../libs/shelf/mongodb');

// TODO: Maybe figure out a way to allow not exporting some of those functions above.

// Global Variables
let mongoServer;

describe('Retrieve Files and Folders from MongoDB', () => {
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
        // Disconnect mongoose and stop the mock database.
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('Retrieve Folders from MongoDB', () => {
        let bookShelf;
        let magazineShelf;
        let comicShelf;

        let bookExample;
        let magazineExample;
        let bookFoobar;
        let rootExample;
        let magazineExampleIssues;

        before(async () => {
            // Create some shelves
            // ===================
            // Use this for fetching multiple folders at root
            bookShelf = new Shelf({
                name: 'Book Shelf',
                root: ['books'],
                showDirectories: true,
                multiFile: false
            });

            // Use this for finding grandchildren folders
            magazineShelf = new Shelf({
                name: 'Magazine Shelf',
                root: ['magazines'],
                showDirectories: true,
                multiFile: false
            });

            // Use this for NOT showing directories.
            comicShelf = new Shelf({
                name: 'Comicbook Shelf',
                root: ['comicbooks'],
                showDirectories: false,
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

            // Use this to test negative against any other shelf
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
            await comicShelf.save();

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

        describe('retrieveDirectories()', () => {
            it('Throw an error because its missing a shelf', async () => {
                const error = await retrieveDirectories();
                // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
                // assert.isObject(error); // TODO: typeof identifies it as object, but fails
                assert.containIgnoreCase(error.message, 'Shelf was missing in call.');
            });
    
            it('Find the one folder from magazine shelf root directory.', async () => {
                const folders = await retrieveDirectories(magazineShelf);
                assert.isArray(folders);
                assert.lengthOf(folders, 1);

                assert.equal(folders[0].name, 'Magazine Example');
            });
    
            it('Find the two folders in the books shelf', async () => {
                const folders = await retrieveDirectories(bookShelf);
                assert.isArray(folders);
                assert.lengthOf(folders, 2);
            });
    
            it('Find the magazine example issues', async () => {
                const folders = await retrieveDirectories(magazineShelf, magazineExample);
                assert.isArray(folders);
                assert.lengthOf(folders, 1);
                assert.equal(folders[0].name, 'Issues');
            });
    
            it('Return an error message that shelf and folder do not belong to each other', async () => {
                const error = await retrieveDirectories(magazineShelf, rootExample);
                // TODO: Should try to add more error testing; prove that error is an error, or something was thrown.
                // assert.isObject(error); // TODO: typeof identifies it as object, but fails
                assert.containIgnoreCase(error.message, 'Shelf and current folder are not compatible.');
            });
    
            it('Return nothing back if we are not going to show directories', async () => {
                const folders = await retrieveDirectories(comicShelf);
                assert.isArray(folders);
                assert.lengthOf(folders, 0);
                assert.isEmpty(folders);
            });
        });

        describe('isCurrentFolderCompatible()', () => {
            it('Return false if no argument supplied', () => {
                const answer = isCurrentFolderCompatible();
                assert.isFalse(answer);
            });

            it('Return true since it is just a shelf', () => {
                const answer = isCurrentFolderCompatible(magazineShelf);
                assert.isTrue(answer);
            });

            it('Return false with a non-compatible current folder', () => {
                const answer = isCurrentFolderCompatible(magazineShelf, rootExample);
                assert.isFalse(answer);
            });

            it('Returns true with a compatible current folder', () => {
                const answer = isCurrentFolderCompatible(magazineShelf, magazineExample);
                assert.isTrue(answer);
            });

            it('Returns true with another compatible current folder, but have grand-children', () => {
                const answer = isCurrentFolderCompatible(magazineShelf, magazineExampleIssues);
                assert.isTrue(answer);
            });
        });

        describe('getSizeExpression()', () => {
            it('Return zero (0) with size of path', () => {
                const expression = getSizeExpression();
                assertGetSizeExpressionTests(expression, 0);
            });

            it('Return two (2) with a shelf', () => {
                const expression = getSizeExpression(magazineShelf);
                assertGetSizeExpressionTests(expression, 2);
            });

            it('Return three (3) with a shelf and current folder', () => {
                const expression = getSizeExpression(magazineShelf, magazineExample);
                assertGetSizeExpressionTests(expression, 3);
            });

            it('Return four (4) with a shelf and a current folder with grand-children', () => {
                const expression = getSizeExpression(magazineShelf, magazineExampleIssues);
                assertGetSizeExpressionTests(expression, 4);
            });
        });
    });

    describe('Retrieve Files from MongoDB', () => {
        before(async () => {
            // Create some folders
            // ===================
            novelLiterature = new Folder({
                name: 'Romance',
                path: ['library', 'books', 'novels', 'literature']
            });

            novelDrama = new Folder({
                name: 'Drama',
                path: ['library', 'books', 'novels', 'drama']
            });

            // Use to test against shelf compatibility.
            blahFolder = new Folder({
                name: 'Blah',
                path: ['library', 'blah']
            });

            // Create some files
            // =================
            threeKingdoms = new File({
                type: 'book',
                name: 'Romance of the Three Kingdoms',
                path: ['library', 'books', 'novels', 'drama', 'threekingdoms.pdf'],
                cover: ['covers', 'library', 'books', 'novels', 'drama', 'threekingdoms.jpg'],
                didRead: false
            });

            journeyToWest = new File({
                type: 'book',
                name: 'Journey to the West',
                path: ['library', 'books', 'novels', 'literature', 'journeytothewest.pdf'],
                cover: ['covers', 'library', 'books', 'novels', 'literature', 'journeytothewest.jpg'],
                didRead: true
            });

            huckeberryFinn = new File({
                type: 'book',
                name: 'Adventures of Huckleberry Finn',
                path: ['library', 'books', 'novels', 'literature', 'huckberryfinn.pdf'],
                cover: ['covers', 'library', 'books', 'novels', 'literature', 'huckberryfinn.jpg'],
                didRead: false
            });

            // Used to test against retrieving all books.
            theArtDeal = new File({
                type: 'book',
                name: 'The Art of the Deal',
                path: ['library', 'trash'],
                cover: [],
                didRead: false
            });

            await novelLiterature.save();
            await novelDrama.save();
            await blahFolder.save();
            await threeKingdoms.save();
            await journeyToWest.save();
            await huckeberryFinn.save();
            await theArtDeal.save();
        });

        after(async () => {
            Folder.deleteMany({});
            File.deleteMany({});
        });

        describe('Find files when showing directories', () => {
            let novelShelf;

            before(async () => {
                // Create some shelves
                // ===================
                novelShelf = new Shelf({
                    name: 'Book Shelf',
                    root: ['library', 'books', 'novels'],
                    showDirectories: true,
                    multiFile: false
                });
            });
            after(async () => {
                await Shelf.deleteMany({});
            });
    
            it('Retrieve no files from the shelf root', async () => {
                const files = await retrieveFiles(novelShelf);
                assert.isArray(files);
                assert.lengthOf(files, 0);
            });

            it('Retrieve one drama book', async () => {
                const files = await retrieveFiles(novelShelf, novelDrama);
                assert.isArray(files);
                assert.lengthOf(files, 1);
            });

            it('Retrieve two literature books', async () => {
                const files = await retrieveFiles(novelShelf, novelLiterature);
                assert.isArray(files);
                assert.lengthOf(files, 2);
            });

            it('Throw error with folder being incompatible with shelf', async () => {
                const error = await retrieveFiles(novelShelf, blahFolder);
                assert.isObject(error);
                assert.containIgnoreCase(error.errorMessage, 'Shelf and current folder are not compatible.');
            });
        });

        describe('Find files when not showing directories', () => {
            let novelShelf;
            
            before(async () => {
                // Create some shelves
                // ===================
                novelShelf = new Shelf({
                    name: 'Book Shelf',
                    root: ['library', 'books', 'novels'],
                    showDirectories: false,
                    multiFile: false
                });

                await novelShelf.save();
            });

            after(async () => {
                await Shelf.deleteMany({});
            });

            it('Retrieve all three books with the novel shelf', async () => {
                const files = await retrieveFiles(novelShelf);
                assert.isArray(files);
                assert.lengthOf(files, 3);
            });
        });
    });
});

/**
 * @summary Test the getSizeEpxression return value
 * @description Test the get size expressions with this test. It will test if expression is an object, $size is a number, and the value of the number expected.
 * @param { object } expression 
 * @param { number } expectedValue
 */
const assertGetSizeExpressionTests = (expression, expectedValue) => {
    assert.isObject(expression);
    assert.isNumber(expression.path.$size);
    assert.equal(expression.path.$size, expectedValue);
}