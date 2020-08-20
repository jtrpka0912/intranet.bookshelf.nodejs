// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

// Libraries
const { retrieveDirectories, retrieveFiles } = require('../libs/shelf/mongodb');

// Helpers
const { foundMongoError, shelfNotFound, folderNotFound } = require('../libs/helpers/routes');

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

router.route('/shelf/:shelfId/folder').all((req, res) => {
    res.status(404).json({
        errorCode: 404,
        errorCodeMessage: 'Not Found',
        errorMessage: 'Missing Folder ID.'
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
            let breadcrumbs = []; // Keep it consistent though none should be made
            let directories = [];
            let files = [];

            try {
                directories = await retrieveDirectories(mongoShelfResponse);
                files = await retrieveFiles(mongoShelfResponse);
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

/**
 * @summary Retrieve files and folders from shelf and current folder.
 */
router.route('/shelf/:shelfId/folder/:folderId').get((req, res) => {
    const shelfId = req.params.shelfId;
    const folderId = req.params.folderId;

    Folder.findById(folderId, async (mongoError, mongoFolderResponse) => {
        console.info('Folder', mongoFolderResponse);
        if(foundMongoError(mongoError, res)) return;

        if(mongoFolderResponse) {

        } else {
            return folderNotFound(shelfId, res);
        }
    });
});

module.exports = router;