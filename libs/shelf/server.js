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
                    const folder = await createFolderToMongoDB(node, nodePath);
                } else if(nodeDetails.isFile()) {
                    console.log('Its a file');
                } else {
                    console.warn('Unknown Node');
                }
            }
        }
    } catch(err) {
        return err;
    }
}

/**
 * @async
 * @function createFolderToMongoDB
 * @description Create a folder document for MongoDB
 * @param { string } node - Name of folder
 * @param { string } nodePath - Path of Folder
 * @returns { object } 
 */
const createFolderToMongoDB = async (node, nodePath) => {
    try {
        // Throw an error if any are false
        if(!node) throw new Error('Missing node argument');
        if(!nodePath) throw new Error('Missing node path argument');

        // Check if folder exists in server
        await fs.promises.access(nodePath, fs.constants.F_OK);

        const query = {
            name: node,
            path: Folder.convertPathToArray(nodePath, '\\')
        };

        // Then check if the folder already exists
        const doesItExist = await Folder.findOne(query).exec();
        
        if(!doesItExist) { 
            // Create it
            const folderMongoDB = new Folder(query);
            await folderMongoDB.save();
            return folderMongoDB;
        } else {
            // We still return it, but not create it
            return doesItExist;
        }
    } catch(err) {
        return err;
    }
}

/**
 * @async
 * @function createFolderToMongoDB
 * @description Create a file document for MongoDB
 * @param { string } node - Name of folder
 * @param { string } nodePath - Path of Folder
 * @returns { object } 
 */
const createFileToMongoDB = async (node, nodePath) => {
    try {
        // Throw an error if any are false
        if(!node) throw new Error('Missing node argument');
        if(!nodePath) throw new Error('Missing node path argument');

        // Check if file exists in server
        await fs.promises.access(nodePath, fs.constants.F_OK);

        // Create the file with just these properties to check if it already exists in MongoDB
        const query = {
            name: node,
            path: File.convertPathToArray(nodePath, '\\'),
        }; // Add any other properties; like cover, after creation.

        // Then check if the file already exists
        const doesItExist = await File.findOne(query).exec();

        if(!doesItExist) {
            // Create new file
            const folderMongoDB = new File(query);
            await folderMongoDB.save();

            // TODO: Any other properties like cover

            return folderMongoDB;
        } else {
            // Return it, but do not create it.
            return doesItExist;
        }
        
    } catch(err) {
        return err;
    }
}

module.exports = {
    retrieveFilesFolders,
    createFolderToMongoDB,
    createFileToMongoDB
};