// Models
const Files = require('../../../models/file.model');

/**
 * @function retrieveFiles
 * @description Retrieve files from the shelf's collection with an optional folder.
 * @param { object } shelf 
 * @param { object } currentFolder
 * @returns { object[] }
 */
const retrieveFiles = (shelf, currentFolder) => {
    try {
        if(!shelf) {
            // Need to throw it in an object with message for the try/catch to get the message. Little hacky.
            throw {
                message: 'Shelf was missing in call.'
            };
        }
    } catch(err) {
        // TODO: How to handle with express?
        return {
            errorCode: 500,
            errorCodeMessage: 'Internal Server Error',
            errorMessage: err.message
        };
    }
}

module.exports = {
    retrieveFiles
};