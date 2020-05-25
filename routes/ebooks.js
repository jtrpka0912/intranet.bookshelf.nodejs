// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

// Helpers
const { foundMongoError, shelfNotFound } = require('../helpers/routes');

/**
 * @description Throw an error since this is a dead endpoint.
 * @note Is this best practice?
 * @todo How to approach this with OpenAPI?
 */
router.route('/shelf').all((req, res) => {
    res.status(404).json({
        errorCode: 404,
        errorCodeMessage: 'Not Found',
        errorMessage: 'Missing ShelfId.'
    });
});

/**
 * @summary Retrieve files and folders from base shelf directory
 */
router.route('/shelf/:shelfId').get((req, res) => {
    const shelfId = req.params.shelfId;

    // First, find the shelf if it exists.
    Shelf.findById(shelfId, (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoResponse) {
            return res.status(200).json('Need moar!');
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

module.exports = router;