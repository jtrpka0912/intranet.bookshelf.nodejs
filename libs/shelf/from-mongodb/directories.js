// Models
const Folder = require('../../../models/folder.model');

/**
 * @function retrieveFolders
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @returns { object[] }
 */
const retrieveFolders = async(shelf) => {
    try {
        if(!shelf) {
            return [];
        }

        // console.info('Shelf', shelf);

        // TODO: Will have to add with current folder later.
        const sizeOfPath = shelf.root.length; // 1 for [books]

        // Will need to make an array for the $and expressions
        let andExpressionsForPaths = [];
        
        // Add the shelf root path to andExpression array
        shelf.root.forEach((folder, index) => {
            // Queries need to be in the form of objects
            let partialExpression = {};
            
            // Dynamically add a property with a variable
            partialExpression[`path.${index}`] = {
                $eq: folder
            };

            andExpressionsForPaths.push(partialExpression);
        });

        // For the current folder; add the shelf root length to the index with its forEach looper

        // const query = `{ $and: [${ andExpressionsForPaths.join(', ') }] }`;
        const query = {
            $and: andExpressionsForPaths
        };

        // Exec will make the Mongo query return a full Promise.
        const folders = await Folder.find(query).exec();

        // console.info('Folders', folders);

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