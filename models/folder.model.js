// Packages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const folderSchema = new Schema({
    // It will add the primary key field automatically
    name: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        minlength: 3
    },
    path: {
        type: [String], // Each folder will be an array item
        required: true,
        unique: false,
        trim: true,
        minlength: 0
    }
}, {
    timestamps: true // Added created and modified fields
});

/**
 * @static
 * @function convertPathToString
 * @description Convert array path to a string path
 * @todo Need to do some testing
 * @param { string[] } path
 * @param { string } separator (default to /)
 * @returns { string }
 */
folderSchema.statics.convertRootToString = function(path, separator = '/') {
    return path.join(separator);
}

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;