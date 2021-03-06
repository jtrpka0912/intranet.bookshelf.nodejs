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
            let shelf = mongoShelfResponse.toObject();
            shelf.path = pathArrayToString(shelf.root);

            let directories = [];
            let updatedDirectories = [];
            let files = [];
            let updatedFiles = [];

            try {
                directories = await retrieveDirectories(mongoShelfResponse);
                updatedDirectories = directories.map((directory) => {
                    // Convert to a JavaScript Object
                    directory = directory.toObject();
                    directory.path = pathArrayToString(directory.path);

                    return directory;
                });

                files = await retrieveFiles(mongoShelfResponse);
                updatedFiles = files.map((file) => {
                    // Convert to a JavaScript Object
                    file = file.toObject();
                    file.path = pathArrayToString(file.path);
                    file.cover = pathArrayToString(file.cover);
                    file.download = pathArrayToString(file.download);

                    return file;
                });

                
            } catch(err) {
                return res.status(500).json({
                    errorCode: 500,
                    errorCodeMessage: 'Internal Server Error',
                    errorMessage: err.message
                });
            }

            res.status(200).json({
                shelf,
                breadcrumbs: [], // We are at the root of the shelf
                directories: updatedDirectories,
                files: updatedFiles
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

    // First retrieve the folder
    Folder.findById(folderId, (mongoError, mongoFolderResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoFolderResponse) {
            // Then retrieve the shelf
            Shelf.findById(shelfId, async (mongoError, mongoShelfResponse) => {
                if(foundMongoError(mongoError, res)) return;

                if(mongoShelfResponse) {
                    let shelf = mongoShelfResponse.toObject();
                    shelf.path = pathArrayToString(shelf.root);

                    let breadcrumbs = [];
                    let updatedBreadcrumbs = [];
                    let directories = [];
                    let updatedDirectories = [];
                    let files = [];
                    let updatedFiles = [];

                    try{
                        directories = await retrieveDirectories(mongoShelfResponse, mongoFolderResponse);
                        updatedDirectories = directories.map((directory) => {
                            // Convert to a JavaScript Object
                            directory = directory.toObject();
                            directory.path = pathArrayToString(directory.path);
        
                            return directory;
                        });

                        breadcrumbs = await retrieveBreadcrumbs(mongoShelfResponse, mongoFolderResponse);
                        updatedBreadcrumbs = breadcrumbs.map((breadcrumb) => {
                            // Convert to a JavaScript Object
                            breadcrumb = breadcrumb.toObject();
                            breadcrumb.path = pathArrayToString(breadcrumb.path);

                            return breadcrumb;
                        });
                        
                        files = await retrieveFiles(mongoShelfResponse, mongoFolderResponse);
                        updatedFiles = files.map((file) => {
                            // Convert to a JavaScript Object
                            file = file.toObject();
                            file.path = pathArrayToString(file.path);
                            file.download = pathArrayToString(file.download);
                            file.cover = pathArrayToString(file.cover);
        
                            return file;
                        });
                    } catch(err) {
                        return res.status(500).json({
                            errorCode: 500,
                            errorCodeMessage: 'Internal Server Error',
                            errorMessage: err.message
                        });
                    }

                    res.status(200).json({
                        shelf,
                        breadcrumbs: updatedBreadcrumbs,
                        directories: updatedDirectories,
                        files: updatedFiles
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