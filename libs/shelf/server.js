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
const { pdf2png } = require('./pdf2png');

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

        // Prepend with a slash to signify the root directory
        await fs.promises.readdir('/' + rootStringPath);

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

        // Prepend with a slash to signal root directory
        const nodes = await fs.promises.readdir('/' + rootStringPath);

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
    try {
        if(!file) throw new Error('Missing file argument');
        const projectRoot = process.env.PWD;

        // Check if file exists in server and have it ready for conversion
        const fileStringPath = pathArrayToString(file.path); // /path/to/foo.bar
        await fs.promises.access(fileStringPath, fs.constants.F_OK);

        // Check if cover already exists
        let isCoverValid = false; // State that the cover is not valid
        if(file.cover.length > 0) {
            try {
                // If it does not exist then it throws an error
                // NOTE: Should I use try/catch to handle a falsey at this level?
                await fs.promises.access(projectRoot + pathArrayToString(file.cover), fs.constants.F_OK);
                isCoverValid; // Cover is valid and exists
            } catch (err) {
                // Cover no longer exists; reset the cover property.
                file.cover = [];
                file = await file.save();
                // Resume the cover process. Do not throw error!
            }
        }

        if(!isCoverValid) {
            // Retrieve the filename information from the file path
            const fullFileName = file.path[file.path.length - 1]; // foo.bar
            const fileExtension = path.extname(fullFileName); // .bar
            
            // Create the directories for the new image in the following steps
            const relativeCoverArrayPath = []; // Need to reconstruct it item by item
            for(const item of file.path) {
                relativeCoverArrayPath.push(item);
            }

            // Step One: Remove the last item from the file array path (filename)
            const poppedFile = relativeCoverArrayPath.pop(); // foo.bar

            // Step Two: Check if : is in the first directory from file path (Windows)
            if(relativeCoverArrayPath[0].includes(':')) {
                relativeCoverArrayPath[0] = relativeCoverArrayPath[0].replace(':', ''); // Remove the colon
            }

            // Step Three: Create the public and static paths
            // public: The file path where the image will reside in the backend
            // static: The url path to find the image for the frontend (/public/images/covers -> /covers)
            const publicCoverArrayPath = ['public', 'images', 'covers'].concat(relativeCoverArrayPath);
            // TODO: Adjust the covers for testing
            const staticCoverArrayPath = ['covers'].concat(relativeCoverArrayPath);
            // NOTE: Possible DRY method for making a public and static directory paths?

            // Step Four: Check if directories already exists. If not create it.
            // Get the string version, but make sure it is relative.
            const directoryPath = projectRoot + pathArrayToString(publicCoverArrayPath);
            try {
                // If it does not exist then it throws an error
                // NOTE: Should I use try/catch to handle a falsey at this level?
                await fs.promises.access(directoryPath, fs.constants.F_OK);
            } catch (err) {
                // Create the directories
                await fs.promises.mkdir(directoryPath, {
                    recursive: true
                }, (err) => {
                    if(err) console.error('retrieveCoverImage error:', err);
                });
                // Resume the cover process. Do not throw error!
            }

            // Finally, lets create the image

            // Add the file to the cover array path with image extension
            const imageExtension = '.jpg';
            const imageFilename = path.basename(poppedFile, fileExtension); // foo.png

            // Add the file name after creating directories
            publicCoverArrayPath.push(imageFilename + imageExtension);
            staticCoverArrayPath.push(imageFilename + imageExtension);
            
            switch(fileExtension) {
                case '.pdf':
                    // Update the MongoDB document with the new cover array path
                    file.cover = staticCoverArrayPath; // The URL relative path
                    await file.save();

                    // Allow the PDF first page to be converted to an image.
                    await pdf2png(fileStringPath, projectRoot + pathArrayToString(publicCoverArrayPath));

                    break;
                // TODO: Retrieve the first page for these files.
                case '.mobi':
                case '.epub':
                default:
                    // Update the MongoDB document with a placeholder cover
                    file.cover = ['covers', '_placeholder', '_placeholder.png'];
                    await file.save();

                    break;
            }
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
