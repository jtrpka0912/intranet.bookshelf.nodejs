// Models
const Shelf = require('../../models/shelf.model');
const Folder = require('../../models/folder.model');
const File = require('../../models/file.model');

// Helpers
const { pathStringToArray, pathArrayToString } = require('../helpers/routes');
const { getShelfArrayElementExpression } = require('../shelf/mongodb');

// Packages
const fs = require('fs');
const path = require('path');

// Need to use the ES5 build due to lack of ReadableStream functionaliy with Node.js
const pdfjs = require('pdfjs-dist/es5/build/pdf');

/**
 * @async
 * @function removeFilesFolders
 * @description Go through the shelf's folders and files and check if they exist otherwise remove from Mongodb.
 * @author J.T.
 * @param { object } shelf
 */
const removeFilesFolders = async (shelf) => {
    try {
        if(!shelf) throw new Error('Shelf was missing in call');

        let rootStringPath = pathArrayToString(shelf.root);

        await fs.promises.readdir(rootStringPath);

        // Retrieve the folders
        const query = {
            $and: getShelfArrayElementExpression(shelf)
        };

        const folders = await Folder.find(query);
        const files = await File.find(query);

        // Check if folders still exist, if not then remove.
        for(let folder of folders) {
            const pathToString = pathArrayToString(folder.path);
            try {
                // If it does not find the folder; it throws an exception.
                await fs.promises.access(pathToString, fs.constants.F_OK);
            } catch (notFound) {
                // Catch the thrown exceptions from fs.promises.access
                folder.deleteOne();
            }
        }

        // Check if files still exist, if not then remove.
        for(let file of files) {
            const pathToString = pathArrayToString(file.path);
            try {
                // If it does not find the file; it throws an exception.
                await fs.promises.access(pathToString, fs.constants.F_OK);
            } catch (notFound) {
                // Catch the thrown exceptions from fs.promises.access
                // TODO: Remove the cover image affiliated first
                file.deleteOne();
            }
        }
    } catch (err) {
        throw err;
    }
}

/**
 * @async
 * @function retrieveFilesFolders
 * @description Recursively go through each folder and file and create a MongoDB document for each of them
 * @param { object } shelf 
 * @param { string } previousNode
 */
const retrieveFilesFolders = async (shelf, previousNode) => {
    try {
        if(!shelf) throw new Error('Shelf was missing in call');

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
                    const createdFile = await createFileToMongoDB(node, nodePath);
                    await retrieveCoverImage(createdFile);
                } else {
                    // TODO: Should I throw error?
                    console.warn('Unknown Node');
                }
            }
        }
    } catch(err) {
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

/**
 * @async
 * @function retrieveCoverImage
 * @description Retrieve the cover image from the PDF file
 * @author J.T.
 * @uses pdfjs
 * @param { File } file 
 */
const retrieveCoverImage = async (file) => {
    console.info('Hi', file);
    try {
        if(!file) throw new Error('Missing file argument');
        
        const fullFileName = file.path[file.path.length - 1];
        const stringPath = pathArrayToString(file.path);
        // console.info('Filename', fullFileName);
        // console.info('String path', stringPath);

        // Retrieve the extension and then act accordingly
        const fileExtension = path.extname(fullFileName);
        switch(fileExtension) {
            case '.pdf':
                const pdfLoadingTask = pdfjs.getDocument(stringPath);

                const pdf = await pdfLoadingTask.promise;
                // console.info('PDF', pdf);
                const pageOne = await pdf.getPage(1);
                // console.info('Page One', pageOne);

                const scale = 1.0;
                const viewport = pageOne.getViewport({ scale: scale, });
                console.info('Viewport', viewport);

                break;
            // TODO: Retrieve the first page for these files.
            case '.mobi':
            case '.epub':
            default:
                break;
        }

    } catch(err) {
        throw err;
    }
}

module.exports = {
    removeFilesFolders,
    retrieveFilesFolders,
    createFolderToMongoDB,
    createFileToMongoDB,
    retrieveCoverImage
};