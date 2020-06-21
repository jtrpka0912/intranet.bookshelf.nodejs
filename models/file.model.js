// Packages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    // It will add the primary key field automatically
    type: {
        type: String,
        required: true,
        unique: false,
        enum: ['book', 'magazine', 'comicbook'],
        default: 'book'
    },
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
    },
    cover: {
        type: [String], // Each folder will be an array item
        required: false,
        unique: false, // Would prefer to be true, but some might not have a cover.
        trim: true,
        minlength: 0
    },
    didRead: {
        type: Boolean,
        required: false,
        unique: false,
        default: false
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
fileSchema.statics.convertPathToString = function(path, separator = '/') {
    return path.join(separator);
}

/**
 * @static
 * @function convertPathToArray
 * @description Convert string path to an array path
 * @todo Need to do some testing
 * @param { string } path 
 * @param { string } separator (default to /)
 * @returns { string[] }
 */
fileSchema.statics.convertPathToArray = function(path, separator = '/') {
    return path.split(separator);
}

const File = mongoose.model('File', fileSchema);
module.exports = File;