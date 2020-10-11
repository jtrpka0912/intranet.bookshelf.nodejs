// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');
const Folder = require('../models/folder.model');

// Libraries
const { retrieveDirectories, retrieveFiles, retrieveBreadcrumbs } = require('../libs/shelf/mongodb');

// Helpers
const { foundMongoError, shelfNotFound, folderNotFound, pathArrayToString } = require('../libs/helpers/routes');

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
            let directories = [];
            let files = [];

            try {
                directories = await retrieveDirectories(mongoShelfResponse);

                // TODO: Need to do this when fetching with active folder
                const updatedDirectories = directories.map((directory) => {
                    // Convert to a JavaScript Object
                    directory = directory.toObject();
                    directory.path = pathArrayToString(directory.path);

                    return directory;
                });

                files = await retrieveFiles(mongoShelfResponse);
                const updatedFiles = files.map((file) => {
                    // Convert to a JavaScript Object
                    file = file.toObject();
                    file.path = pathArrayToString(file.path);

                    return file;
                });

                res.status(200).json({
                    breadcrumbs: [], // We are at the root of the shelf
                    directories: updatedDirectories,
                    files: updatedFiles
                });
            } catch(err) {
                return res.status(500).json({
                    errorCode: 500,
                    errorCodeMessage: 'Internal Server Error',
                    errorMessage: err.message
                });
            }
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

    // First retrieve the folder
    Folder.findById(folderId, (mongoError, mongoFolderResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoFolderResponse) {
            // Then retrieve the shelf
            Shelf.findById(shelfId, async (mongoError, mongoShelfResponse) => {
                if(foundMongoError(mongoError, res)) return;

                if(mongoShelfResponse) {
                    let breadcrumbs = [];
                    let directories = [];
                    let files = [];

                    try{
                        directories = await retrieveDirectories(mongoShelfResponse, mongoFolderResponse);
                        breadcrumbs = await retrieveBreadcrumbs(mongoShelfResponse, mongoFolderResponse);
                        files = await retrieveFiles(mongoShelfResponse, mongoFolderResponse);

                    } catch(err) {
                        return res.status(500).json({
                            errorCode: 500,
                            errorCodeMessage: 'Internal Server Error',
                            errorMessage: err.message
                        });
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
        } else {
            return folderNotFound(shelfId, res);
        }
    });
});

module.exports = router;