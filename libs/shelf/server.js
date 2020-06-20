// Models
const Shelf = require('../../models/shelf.model');
const Folder = require('../../models/folder.model');
const File = require('../../models/file.model');

// Packages
const fs = require('fs');
const path = require('path');

/*
Directory and File Creation
===========================

retrieveFilesFolders(shelf.root)

FUNC retrieveFilesFolders (directory)
    RETRIEVE FILES AND FOLDERS FROM directory
    filesFolders FOR LOOP
        IF FILE
            createFileToMongoDB(file)
        IF DIRECTORY
            createFolderToMongoDB(folder)
            retrieveFilesFolders(folder)
            
FUNC createFileToMongoDB(file)
    DO MONGODB STUFF HERE
    
FUNC createFolderToMongoDB(folder)
    DO MONGODB STUFF HERE
*/

/**
 * @async
 * @function retrieveFilesFolders
 * @description Recursively go through each folder and file and create a MongoDB document for each of them
 * @param { object } shelf 
 */
const retrieveFilesFolders = async (shelf) => {
    try{
        if(!shelf) {
            // TODO: Please use this method, and refactor code from other parts of app. Start using the V8 Error object and just let Express handle HTTP codes.
            throw new Error('Shelf was missing in call');
        }

        const rootStringPath = Shelf.convertRootToString(shelf.root);

        const nodes = await fs.promises.readdir(rootStringPath);

        if(nodes.length > 0) {
            // Loop through the files and folders
            for(const node of nodes) {
                const nodePath = path.join(rootStringPath, node);
                const nodeDetails = await fs.promises.stat(nodePath);

                if(nodeDetails.isDirectory()) {
                    const folder = createFolderToMongoDB(node, nodePath);
                } else if(nodeDetails.isFile()) {
                    console.log('Its a file');
                } else {
                    console.warn('Unknown Node');
                }
            }
        }
    } catch(err) {
        // TODO: Please use this method, and refactor code from other parts of app.
        return err;
    }
}

/**
 * @async
 * @function createFolderToMongoDB
 * @description Create a folder document for MongoDB
 * @param { string } node - Name of folder
 * @param { string } nodePath - Path of Folder
 */
const createFolderToMongoDB = async (node, nodePath) => {
    try {
        // Throw an error if any are false
        if(!node) throw new Error('Missing node argument');
        if(!nodePath) throw new Error('Missing node path argument');

        // Check if folder exists
        await fs.promises.access(nodePath, fs.constants.F_OK);
    } catch(err) {
        return err;
    }
}

module.exports = {
    retrieveFilesFolders,
    createFolderToMongoDB
};