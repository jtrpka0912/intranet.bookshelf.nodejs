// Packages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shelfSchema = new Schema({
    // It will add primary key field automatically
    name: {
        type: String, // What vartype is it
        required: true, // Is it required
        unique: false, // Can only one value exist
        trim: true, // Whitespace trimming
        minlength: 3 // Minimum string length validation
    },
    root: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        minlength: 0
    },
    showDirectories: {
        type: Boolean,
        required: false,
        default: true, // Default value for a field?
        unique: false,
    },
    multiFile: {
        type: Boolean,
        required: false,
        default: false,
        unique: false
    }
}, {
    timestamps: true // Add created and modified fields
});

const Shelf = mongoose.model('Shelf', shelfSchema);
module.exports = Shelf;