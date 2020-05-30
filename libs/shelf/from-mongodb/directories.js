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
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf was missing in call.'
            };
        }

        // TODO: Need to make sure that the shelf and current folder share a common path.

        // SHELF: [books]
        // FOLDER: [books, foo] (OK)

        // SHELF [books]
        // FOLDER [magazines, foo] (X)

        // console.info('Shelf', shelf);

        let query = {}; // By default, return all.

        if(shelf.showDirectories) {
            // Find the number of directories, plus one
            let sizeOfPath = currentFolder ? currentFolder.path.length + 1 : shelf.root.length + 1;
            const sizeExpression = { path: { $size: sizeOfPath } }; // Add expression to find sizes

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

            // Optionally add the current folder
            if(currentFolder) {
                // Instead of using a forEach; just use a for loop for better control of the iterator.
                for(let x = shelf.root.length; x < currentFolder.path.length; x++) {
                    // Queries need to be in the form of objects
                    let partialExpression = {};
    
                    // Dynamically add a property with a variable
                    partialExpression[`path.${x}`] = {
                        $eq: currentFolder.path[x]
                    };

                    andExpressionsForPaths.push(partialExpression);
                }
            }

            query = {
                $and: andExpressionsForPaths
            };
        } else {
            // something?
        }

        // console.info('Query', query);
        // query['$and'].forEach((subquery) => console.info('Inside Query', subquery));

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