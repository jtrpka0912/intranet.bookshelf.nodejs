// Models
const Folder = require('../../models/folder.model');
const File = require('../../models/file.model');

/**
 * @function retrieveDirectories
 * @description Retrieve folders (documents) from the MongoDB database.
 * @param { object } shelf - Shelf Schema
 * @param { object } currentFolder - Folder Schema
 * @returns { object[] }
 */
const retrieveDirectories = async (shelf, currentFolder) => {
    try {
        if(!shelf) {
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf was missing in call.'
            };
        }

        if(isCurrentFolderCompatible(shelf, currentFolder) === false) {
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf and current folder are not compatible.'
            };
        }

        let query = {}; // By default, return all.

        if(shelf.showDirectories) {
            const sizeExpression = getSizeExpression(shelf, currentFolder);

            // Will need to make an array for the $and expressions
            let andExpressionsForPaths = [sizeExpression];
            
            // Add the shelf root path to andExpression array
            andExpressionsForPaths = andExpressionsForPaths.concat(
                getShelfArrayElementExpression(shelf)
            );

            // Optionally add the current folder
            if(currentFolder) {
                andExpressionsForPaths = andExpressionsForPaths.concat(
                    getCurrentFolderArrayElementExpression(currentFolder, shelf.root.length)
                );
            }
            
            query = {
                $and: andExpressionsForPaths
            };
        } else {
            // If we are not going to show directories; then return an empty array, or maybe null.
            return [];
        }

        // Exec will make the Mongo query return a full Promise.
        const directories = await Folder.find(query).exec();

        return directories;
    } catch (err) {
        // TODO: How to handle with express?
        return {
            errorCode: 500,
            errorCodeMessage: 'Internal Server Error',
            errorMessage: err.message
        };
    }
}

/**
 * @function retrieveFiles
 * @description Retrieve files from the shelf's collection with an optional folder.
 * @param { object } shelf 
 * @param { object } currentFolder
 * @returns { object[] }
 */
const retrieveFiles = async (shelf, currentFolder) => {
    try {
        if(!shelf) {
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf was missing in call.'
            };
        }

        if(isCurrentFolderCompatible(shelf, currentFolder) === false) {
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf and current folder are not compatible.'
            };
        }

        let query = {}; // By default, return all.

        if(shelf.showDirectories) {
            const sizeExpression = getSizeExpression(shelf, currentFolder);

            // Will need to make an array for the $and expressions
            let andExpressionsForPaths = [sizeExpression];
            
            // Add the shelf root path to andExpression array
            andExpressionsForPaths = andExpressionsForPaths.concat(
                getShelfArrayElementExpression(shelf)
            );

            // Optionally add the current folder
            if(currentFolder) {
                andExpressionsForPaths = andExpressionsForPaths.concat(
                    getCurrentFolderArrayElementExpression(currentFolder, shelf.root.length)
                );
            }
            
            query = {
                $and: andExpressionsForPaths
            };
        } else {
            // Need only to check each file if it matches the first set of directories to the shelf
            query = {
                $and: getShelfArrayElementExpression(shelf)
            }
        }

        // Exec will make the Mongo query return a full Promise.
        const files = await File.find(query).exec();

        return files;
    } catch(err) {
        // TODO: How to handle with express?
        return {
            errorCode: 500,
            errorCodeMessage: 'Internal Server Error',
            errorMessage: err.message
        };
    }
}

/**
 * @private
 * @function isCurrentFolderCompatible
 * @description Check if the current folder has the same path as the shelf's root path.
 * @param { object } shelf 
 * @param { object } currentFolder 
 * @returns { boolean }
 */
const isCurrentFolderCompatible = (shelf, currentFolder) => {
    if(!shelf) {
        return false;
    }
    
    if(currentFolder) {
        // Flag the check as true at start
        let compatible = true;
        shelf.root.forEach((folder, index) => {
            if(compatible && currentFolder.path[index] !== folder) {
                compatible = false;
            }
        });

        return compatible;
    }
    
    return true;
}

/**
 * @private
 * @function getSizeExpression
 * @summary Array size expression
 * @description Construct the expression to check the size of the array of the path.
 * @param { object } shelf 
 * @param { object } currentFolder 
 * @returns { object }
 */
const getSizeExpression = (shelf, currentFolder) => {
    let sizeOfPath; // Initialize sizeOfPath

    // Check if shelf was passed
    if(!shelf) {
        // Return 0 when shelf was not passed
        sizeOfPath = 0;
    } else {
        // Find the number of directories, plus one
        sizeOfPath = currentFolder ? currentFolder.path.length + 1 : shelf.root.length + 1;
    }

    // Add expression to find sizes
    return { path: { $size: sizeOfPath } };
};

/**
 * @private
 * @function getShelfArrayElementExpression
 * @summary Array element check by index
 * @description Construct the expressions to check each element, of the path, if it matches.
 * @param { object } shelf
 * @returns { object[] }
 */
const getShelfArrayElementExpression = (shelf) => {
    // Initialize an array to return
    let expressions = [];

    shelf.root.forEach((folder, index) => {
        // Queries need to be in the form of objects
        let partialExpression = {};
        
        // Dynamically add a property with a variable
        partialExpression[`path.${index}`] = {
            $eq: folder
        };

        expressions.push(partialExpression);    
    });

    return expressions;
};

/**
 * @private
 * @function getCurrentFolderArrayElementExpression
 * @summary Array element check by index
 * @description Construct the expressions to check each element, of the path, if it matches.
 * @param { object } currentFolder
 * @returns { object[] }
 */
const getCurrentFolderArrayElementExpression = (currentFolder, shelfLength) => {
    // Initialize an array to return
    let expressions = [];

    // Instead of using a forEach; just use a for loop for better control of the iterator.
    for(let x = shelfLength; x < currentFolder.path.length; x++) {
        // Queries need to be in the form of objects
        let partialExpression = {};

        // Dynamically add a property with a variable
        partialExpression[`path.${x}`] = {
            $eq: currentFolder.path[x]
        };

        expressions.push(partialExpression);
    }

    return expressions;
}

// TODO: Figure out a way to test the helper functions without exporting.
module.exports = {
    retrieveDirectories,
    retrieveFiles,
    // Only for testing purposes
    isCurrentFolderCompatible,
    getSizeExpression
};