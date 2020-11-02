// Models
const File = require('../../models/file.model');
const Folder = require('../../models/folder.model');
const Shelf = require('../../models/shelf.model');

const bookShelf = new Shelf({
    name: 'Book Shelf',
    root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Books'],
    showDirectories: true,
    multiFile: true
});

const magazineShelf = new Shelf({
    name: 'Magazine Shelf',
    root: ['d:', 'Backend', 'Nodejs', 'intranet.bookshelf.nodejs', 'test', 'sample-server', 'Magazines'],
    showDirectories: true,
    multiFile: false
});

module.exports = [
    bookShelf,
    magazineShelf
];