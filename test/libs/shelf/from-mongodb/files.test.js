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
const File = require('../../../../models/file.model');

// Libs
const { retrieveFiles } = require('../../../../libs/shelf/from-mongodb/files');

// Global Variables
let mongoServer;

describe('Files from MongoDB', () => {
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
        const error = await retrieveFiles();
        assert.isString(error.errorMessage);
        assert.containIgnoreCase(error.errorMessage, 'Shelf was missing in call.');
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

            // Create some folders
            // ===================
            novelLiterature = new Shelf({
                name: 'Romance',
                path: ['library', 'books', 'novels', 'literature']
            });

            novelDrama = new Shelf({
                name: 'Drama',
                path: ['library', 'books', 'novels', 'drama']
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

            await novelShelf.save();
            await novelLiterature.save();
            await novelDrama.save();
            await threeKingdoms.save();
            await journeyToWest.save();
            await huckeberryFinn.save();
        });

        after(async () => {
            Shelf.deleteMany({});
            Folder.deleteMany({});
            File.deleteMany({});
        });
    });

    describe('Find files when not showing directories', () => {

    });
});