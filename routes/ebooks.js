// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

// Libraries
const { retrieveDirectories, retrieveFiles } = require('../libs/shelf/mongodb');

// Helpers
const { foundMongoError, shelfNotFound } = require('../libs/helpers/routes');

/**
 * @description Throw an error since this is a dead endpoint.
 * @note Is this best practice?
 * @todo How to approach this with OpenAPI?
 */
router.route('/shelf').all((req, res) => {
    res.status(404).json({
        errorCode: 404,
        errorCodeMessage: 'Not Found',
        errorMessage: 'Missing Shelf ID.'
    });
});

/**
 * @summary Retrieve files and folders from base shelf directory
 */
router.route('/shelf/:shelfId').get((req, res) => {
    const shelfId = req.params.shelfId;

    // First, find the shelf if it exists.
    Shelf.findById(shelfId, async (mongoError, mongoShelfResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoShelfResponse) {
            // console.info('Shelf Response', mongoShelfResponse);

            // First check if there are files and folders inside the directory
            // ===============================================================

            let breadcrumbs = [];
            let directories = [];
            let files = [];

            try {
                directories = await retrieveDirectories(mongoShelfResponse);
                files = await retrieveFiles(mongoShelfResponse);

                // TODO: Implement breadcrumbs later.
            } catch(err) {
                console.error('Error: ', err);
            }

            res.status(200).json({
                breadcrumbs,
                directories,
                files
            });
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

module.exports = router;