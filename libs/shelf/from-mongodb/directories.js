// Models
const Folder = require('../../../models/folder.model');

/**
 * @function retrieveFolders
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @param { object } currentFolder - Folder Schema
 * @returns { object[] }
 */
const retrieveFolders = async (shelf, currentFolder) => {
    try {
        if(!shelf) {
            // TODO: Should this throw an empty array or an error message
            return [];
        }

        // TODO: Need to make sure that the shelf and current folder share a common path.

        // SHELF: [books]
        // FOLDER: [books, foo] (OK)

        // SHELF [books]
        // FOLDER [magazines, foo] (X)

        // console.info('Shelf', shelf);

        let query = {}; // By default, return all.

        if(shelf.showDirectories) {
            let sizeOfPath = shelf.root.length + 1; // Find the number of directories, plus one, that the shelf root has.

            const sizeExpression = { path: { $size: sizeOfPath } };

            // Will need to make an array for the $and expressions
            let andExpressionsForPaths = [sizeExpression];
            
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

            // console.info('Current Folder', currentFolder);

            // Optionally add the current folder
            if(currentFolder) {
                currentFolder.path.forEach((folder, index) => {
                    // Add the index to the shelf root length to match path index progression
                    index + shelf.root.length;
    
                    // TODO: This can be DRY'd up.
    
                    // Queries need to be in the form of objects
                    let partialExpression = {};
    
                    // Dynamically add a property with a variable
                    partialExpression[`path.${index}`] = {
                        $eq: folder
                    };
    
                    andExpressionsForPaths.push(partialExpression);
                });
            }

            query = {
                $and: andExpressionsForPaths
            };
        } else {
            // something?
        }

        // console.info('Query', query);

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