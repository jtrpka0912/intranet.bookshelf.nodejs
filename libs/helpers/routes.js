const separator = '/';

/**
 * @function pathStringToArray
 * @summary Convert a string path to an array for MongoDB.
 * @description Take the string path, to the folder or file, and convert it to an array. This will allow MongoDB to fetch folders, and files easily.
 * @param { string } pathString
 * @returns { string[] }
 */
const pathStringToArray = (pathString) => {
    // Will need to remove the first '/' that starts the path.
    if(pathString.indexOf(separator) === 0) {
        pathString = pathString.substr(1);
    }
    
    return pathString.split(separator);
};

/**
 * @function pathArrayToString
 * @summary Convert an array path, from MongoDB, to a string.
 * @description Take the string array path, from MongoDB, and convert it back to a string path for easier programmable operations to fetch files and folders.
 * @param { string[] } pathArray
 * @returns { string }
 */
const pathArrayToString = (pathArray) => {
    return pathArray.join(separator);
};

/**
 * @function foundMongoError
 * @summary Check if any errors from MongoDB.
 * @description If a mongo error was detected, send an error response back to the client.
 * @param { MongooseError } mongoError Mongo error response
 * @param { ServerResponse } res Express response object
 * @returns { boolean }
 */
const foundMongoError = (mongoError, res) => {
    if(mongoError) {
        res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            // TODO: There is a better error message in mongoError, but needs to be parsed.
            // mongoError.reason needs to be parsed
            errorMessage: mongoError.message // This will do for now.
        });

        return true;
    }

    return false;
};

/**
 * @function shelfNotFound
 * @summary Shelf not found error response
 * @description Send a response that MongoDB was unable to find a shelf by its id.
 * @param { string } shelfId 
 * @param { ServerResponse } res 
 * @returns { object }
 */
const shelfNotFound = (shelfId, res) => {
    return res.status(404).json({
        errorCode: 404,
        errorCodeMessage: 'Not Found',
        errorMessage: `Unable to find shelf with id: ${shelfId}.`
    });
};

/**
 * @function folderNotFound
 * @summary Folder not found error response
 * @description Send a response that MongoDB was unable to find a folder by its id.
 * @param { string } folderId
 * @param { ServerResponse } res
 * @returns { object }
 */
const folderNotFound = (folderId, res) => {
    return res.status(404).json({
        errorCode: 404,
        errorCodeMessage: 'Not Found',
        errorMessage: `Unable to find folder with id: ${folderId}.`
    });
};

module.exports = {
    foundMongoError,
    pathArrayToString,
    pathStringToArray,
    shelfNotFound,
    folderNotFound
};