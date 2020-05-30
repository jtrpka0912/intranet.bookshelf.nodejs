// Models
const Folder = require('../../../models/folder.model');

/**
 * @function retrieveFolders
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @returns { object[] }
 */
const retrieveFolders = async(shelf) => {
    // console.info('Shelf', shelf);

    // Exec will make the Mongo query return a full Promise.
    try {
        const folders = await Folder.find('hello').exec();

        console.info('Folders', folders);

        return folders;
    } catch (err) {
        console.error(err);
    }
    
}

module.exports = {
    retrieveFolders
};