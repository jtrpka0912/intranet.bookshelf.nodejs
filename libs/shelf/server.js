// Models
const Shelf = require('../../models/shelf.model');
const Folder = require('../../models/folder.model');
const File = require('../../models/file.model');

// Helpers
const { pathStringToArray, pathArrayToString } = require('../helpers/routes');

// Packages
const fs = require('fs');
const path = require('path');

/**
 * @async
 * @function retrieveFilesFolders
 * @description Recursively go through each folder and file and create a MongoDB document for each of them
 * @param { object } shelf 
 * @param { string } previousNode
 */
const retrieveFilesFolders = async (shelf, previousNode) => {
    try {
        if(!shelf) {
            throw new Error('Shelf was missing in call');
        }

        let rootStringPath = pathArrayToString(shelf.root);
        
        if(previousNode) {
            rootStringPath = path.join(rootStringPath, previousNode);
        }

        const nodes = await fs.promises.readdir(rootStringPath);

        if(nodes.length > 0) {
            // Loop through the files and folders
            for(const node of nodes) {
                const nodePath = path.join(rootStringPath, node);
                const nodeDetails = await fs.promises.stat(nodePath);

                if(nodeDetails.isDirectory()) {
                    await createFolderToMongoDB(node, nodePath);

                    // Need to advance the node path for the next iteration.
                    const nextNode = previousNode ? path.join(previousNode, node) : node;

                    // Recursively call this function again.
                    await retrieveFilesFolders(shelf, nextNode);
                } else if(nodeDetails.isFile()) {
                    await createFileToMongoDB(node, nodePath);
                } else {
                    // TODO: Should I throw error?
                    console.warn('Unknown Node');
                }
            }
        }
    } catch(err) {
        // if(previousNode) throw err;
        throw err;
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
            // Need to replace any back slashes with forward slashes
            path: pathStringToArray(nodePath.replace(/\\/g, '/'))
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
        throw err;
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

        // Remove the extension from the node
        const name = path.parse(node).name;

        // Create the file with just these properties to check if it already exists in MongoDB
        const query = {
            name: name,
            // Need to replace any back slashes with forward slashes
            path: pathStringToArray(nodePath.replace(/\\/g, '/')),
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
        throw err;
    }
}

module.exports = {
    retrieveFilesFolders,
    createFolderToMongoDB,
    createFileToMongoDB
};