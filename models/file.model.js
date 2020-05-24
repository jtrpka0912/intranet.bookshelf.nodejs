// Packages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    // It will add the primary key field automatically
    type: {
        type: String,
        required: true,
        unique: false,
        enum: ['book', 'magazine', 'comicbook'], // Default should be book
    },
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
        unique: true, // There should be no eBook with the same path
        trim: true,
        minlength: 0
    },
    cover: {
        type: String,
        required: false,
        unique: false, // Would prefer to be true, but some might not have a cover.
        trim: true,
        minlength: 0
    },
    didRead: {
        type: Boolean,
        required: false,
        unique: false
    }
}, {
    timestamps: true // Added created and modified fields
});

const File = mongoose.model('File', fileSchema);
module.exports = File;