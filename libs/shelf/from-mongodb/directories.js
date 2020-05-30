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

        // TODO: Check if Shelf shows directories or not.
        // The code below assumes it will show directories.

        let query = null; // This might retrieve all folders

        if(shelf.showDirectories) {
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

            query = {
                $and: andExpressionsForPaths
            };
        } else {
            // something?
        }

        

        // Exec will make the Mongo query return a full Promise.
        const folders = await Folder.find(query).exec();

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