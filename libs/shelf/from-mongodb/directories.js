// Models
const Folder = require('../../../models/folder.model');

/**
 * @function retrieveFolders
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @returns { object[] }
 */
const retrieveFolders = async(shelf) => {
    if(!shelf) {
        return [];
    }

    try {
        console.info('Shelf', shelf);
        
        // Shelf has /books
        // With just /books and show directories at true:
        // Find any directories with just /books/*; nothing beyond /books/*/*

        // Refer to this:
        // https://docs.mongodb.com/manual/tutorial/query-arrays/
        // db.inventory.find( { "root.1": { $eq: foo } } ) // Find value, in array, by index

        // Exec will make the Mongo query return a full Promise.
        const folders = await Folder.find({}).exec();

        console.info('Folders', folders);

        return folders;
    } catch (err) {
        console.error('Error: ', err);

        return {
            errorCode: 500,
            errorCodeMessage: 'Internal Server Error',
            errorMessage: err.message
        };
    }
}

module.exports = {
    retrieveFolders
};