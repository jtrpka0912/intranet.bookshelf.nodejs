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
        type: String,
        required: true,
        unique: true, // There should be no folder with the same path
        trim: true,
        minlength: 0
    }
}, {
    timestamps: true // Added created and modified fields
});

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;