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

const retrieveFilesFolders = async (shelf) => {
    try{
        if(!shelf) {
            // TODO: Please use this method, and refactor code from other parts of app. Start using the V8 Error object and just let Express handle HTTP codes.
            throw new Error('Shelf was missing in call');
        }

        const rootStringPath = Shelf.convertRootToString(shelf.root);

        const nodes = await fs.promises.readdir(rootStringPath);
    } catch(err) {
        // TODO: Please use this method, and refactor code from other parts of app.
        return err;
    }
}

module.exports = {
    retrieveFilesFolders
};