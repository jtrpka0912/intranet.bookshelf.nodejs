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
            throw new Error('Shelf was missing in call.');
        }

        if(isCurrentFolderCompatible(shelf, currentFolder) === false) {
            throw new Error('Shelf and current folder are not compatible.');
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
        throw err;
    }
}

/**
 * @function retrieveBreadcrumbs
 * @description Retrieve the folders that led from the shelf to the current folder
 * @author J.T.
 * @param { object } shelf 
 * @param { object } currentFolder 
 * @returns { object[] }
 */
const retrieveBreadcrumbs = async (shelf, currentFolder) => {
    // console.log('*************************');
    try {
        if(!shelf) throw new Error('Shelf was missing in call.');

        if(isCurrentFolderCompatible(shelf, currentFolder) === false) {
            throw new Error('Shelf and current folder are not compatible.');
        }

        if(currentFolder) {
            // Start the breadcrumbs with the shelf.
            // let breadcrumbs = [shelf];
            let breadcrumbs = [];

            // console.info('Paths', shelf.root, currentFolder.path);
            const lengthOfShelfRoot = shelf.root.length;
            const lengthOfCurrentFolder = currentFolder.path.length;
            const lengthDifference = lengthOfCurrentFolder - lengthOfShelfRoot;

            // console.info('Shelf Path', shelf.root);
            // console.info('Lengths', lengthOfShelfRoot, lengthOfCurrentFolder, lengthDifference);

            if(lengthDifference > 1) {
                // Loop through the path of the current folder
                // Start where the root would start
                //     but do not count the last item of the path.
                for(let x = lengthOfShelfRoot; x < lengthOfCurrentFolder - 1; x++) {
                    // console.info('X', x);
                    // Need to copy the array so the currentFolder.path doesn't get tampered.
                    const currentPath = currentFolder.path.slice();
                    // console.info('Current Path', currentPath);

                    // Remove parts of the path by "popping" more items with each iteration
                    const iteratedFolderPath = currentPath.splice(0, x + 1);
                    // console.info('Iterated Folder Path', iteratedFolderPath);

                    // Start constructing the MongoDB query
                    const sizeExpression = {
                        path: { $size: iteratedFolderPath.length }
                    }

                    // Will need to make an array for the $and expressions
                    let andExpressionsForPaths = [sizeExpression];

                    /**
                     * @function getIteratedFolderArrayElementExpression
                     * @description Loop through the iterated folder path to create a MongoDB query
                     * @author J.T.
                     * @todo Would rather if this was an anonomous function inside the concat
                     * @param { string[] } iteratedFolderPath 
                     * @returns { object }
                     */
                    const getIteratedFolderArrayElementExpression = (iteratedFolderPath) => {
                        let expressions = [];

                        iteratedFolderPath.forEach((folder, index) => {
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

                    // Then construct the iterated path index query
                    andExpressionsForPaths = andExpressionsForPaths.concat(
                        getIteratedFolderArrayElementExpression(iteratedFolderPath)
                    );
                    
                    query = {
                        $and: andExpressionsForPaths
                    };

                    // console.info('Query', andExpressionsForPaths);

                    // Finally, find the folder with the same path, and then push it into the breadcrumbs.
                    const directory = await Folder.findOne(query).exec(); // Should only get one folder

                    // console.info('Found directory', directory);

                    breadcrumbs.push(directory);
                }
            } // Otherwise, do not add the current folder to the breadcrumbs

            return breadcrumbs;
        } else {
            // Since no current folder; just return an empty array;
            return [];
        }
    } catch(err) {
        throw err;
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
            // TODO: Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf was missing in call.'
            };
        }

        if(isCurrentFolderCompatible(shelf, currentFolder) === false) {
            // TODO: Need to throw it in an object with message for the try/catch to get the message. Little hacky.
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
        throw err;
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
    retrieveBreadcrumbs,
    retrieveFiles,
    getShelfArrayElementExpression,
    // Only for testing purposes
    isCurrentFolderCompatible,
    getSizeExpression
};