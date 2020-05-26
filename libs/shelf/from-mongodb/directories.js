// Models
const Folder = require('../../../models/folder.model');

/**
 * @function retrieveFolders
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @returns { object[] }
 */
const retrieveFolders = (shelf) => {
    // console.info('Shelf', shelf);
    Folder.find({}).then((response) => {
        console.info('Response', response);
        return response;
    }).catch((err) => {
        console.error('Error', err);
        return [];
    });
}

module.exports = {
    retrieveFolders
};