// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

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
    Shelf.findById(shelfId, (mongoError, mongoShelfResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoShelfResponse) {
            console.info('Shelf Response', mongoShelfResponse);

            // First check if there are files and folders inside the directory
            // ===============================================================

            let breadcrumbs = [];
            let directories = [];
            let files = [];

            if(mongoShelfResponse.showDirectories) {

                /**
                If showDirectories is true, then we need to only find folders and files that has one more directory above the current directory
            
                Ex:
                /books - Shelf
                /books/foo - Directory (true)
                /books/foo/bar - Directory (false) [Too much descendents]
                /books/foobar.pdf - File (true)
                /books/foo/bar.pdf - File (false) [Inside a descendent]

                You may need to split (/) the root path of the Shelf to act as a counter plus one.

                Ex.
                /books/rosebooks - Shelf (2) [Found two '/']
                /books/rosebooks/something - Directory (3) (true)
                /books/rosebooks/something.pdf - File (3) (true)
                /books/rosebooks/blah/something.pdf - File (4) (false) [Inside a descendent]
                /books/rosebooks/blah/flibble - Directory (4) (false) [Too many descendents]
                /books/tulips/blah - Directory (3) (false) [Not inside the root path]
                */
            } else {
                // Else if showDirectories is false then we grab all files that has a path that starts with the shelf

                // Ex.
                // /books - Shelf
                // /books/foo/bar/flibble.pdf - File (true)
                // /magazine/foo/bar/issue-001.pdf - File (false) [Not in /books]
                // /books/foobar.pdf - File (true)
            }

            // TODO: Implement multiFile later.

            // TODO: Implement breadcrumbs later.

            // If none from the first check (no files and no folders), then go through the directory in the server. This is where it will go through all of the files starting from the root shelf path and recursively find all files and folders and add them to MongoDB.
            // =================================================================================

            // After it inserts new documents to MongoDB, then check if any were found at all (files and folders) then repeat above.

            // If none, then show an empty response message (maybe status 204 - No Content).

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