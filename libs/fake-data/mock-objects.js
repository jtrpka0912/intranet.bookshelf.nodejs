// Helpers
const { pathArrayToString } = require('../helpers/routes');

const bookShelfArray = {
    name: 'Book Shelf',
    root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books'],
    showDirectories: true,
    multiFile: true
};

const bookShelfString = bookShelfArray;
bookShelfString.root = pathArrayToString(bookShelfString.root);

const magazineShelfArray = {
    name: 'Magazine Shelf',
    root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Magazines'],
    showDirectories: true,
    multiFile: false
};

const magazineShelfString = magazineShelfArray;
magazineShelfString.root = pathArrayToString(magazineShelfString.root);

module.exports = {
    bookShelfArray,
    bookShelfString,
    magazineShelfArray,
    magazineShelfString,
};