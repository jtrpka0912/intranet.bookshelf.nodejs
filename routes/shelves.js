// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');

// Libs
const shelfLibrary = require('../libs/shelf/server');

// Helpers
const { foundMongoError, pathArrayToString, pathStringToArray, shelfNotFound } = require('../libs/helpers/routes');

/**
 * @summary Retrieve all shelves
 */
router.route('/').get(async (req, res) => {
    try {
        const shelves = await Shelf.find({});
        
        const updatedShelves = shelves.map((shelf) => {
            // Convert to a JavaScript Object
            shelf = shelf.toObject();
            shelf.root = pathArrayToString(shelf.root);

            return shelf;
        });

        res.json(updatedShelves);
    } catch (err) {
        res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'Something bad happened retrieving all shelves.'
        });
    }
});

/**
 * @summary Create new shelf
 */
router.route('/').post(async (req, res) => {
    // Retrieve the request from the front-end
    const shelfName             = req.body.name;
    const shelfRoot             = req.body.root;
    const shelfShowDirectories  = req.body.showDirectories;
    const shelfMultiFile        = req.body.multiFile;

    // Validation

    // Not showing directories and using multifile will conflict
    if(!shelfShowDirectories && shelfMultiFile) {
        // Send error as response
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'You can not use multi-file directories if you are hiding directories at the same time.'
        });
    }

    // Need to convert to array for MongoDB
    let convertedRoot = [];
    if(shelfRoot) {
        convertedRoot = pathStringToArray(shelfRoot);
    }

    // Create a new Shelf
    const newShelf = new Shelf({
        name: shelfName,
        root: convertedRoot, 
        showDirectories: shelfShowDirectories,
        multiFile: shelfMultiFile
    });

    try {
        const newShelfMongo = await newShelf.save();

        try {
            // Retrieve the files and folders for the newly created shelf.
            await shelfLibrary.retrieveFilesFolders(newShelfMongo);

            // Convert from Mongo Object to JavaScript Object
            newShelfJson = newShelfMongo.toObject();

            // Convert to a string path.
            newShelfJson.root = pathArrayToString(newShelfJson.root);

            return res.status(201).json(newShelfJson);
        } catch(err) {
            console.error(err);
            return res.status(500).json({
                errorCode: 500,
                errorCodeMessage: 'Internal Server Error',
                errorMessage: err.message
            });
        }
    } catch(err) {
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: err.message
        });
    }
});

/**
 * @summary Retrieve a single shelf
 */
router.route('/:shelfId').get((req, res) => {
    // Retrieve the shelfId parameter.
    const shelfId = req.params.shelfId;

    Shelf.findById(shelfId, (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        // Check if any responses from MongoDB
        if(mongoResponse) {
            mongoResponse = mongoResponse.toObject();

            mongoResponse.root = pathArrayToString(mongoResponse.root);

            res.status(200).json(mongoResponse);
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

/**
 * @summary Update a single shelf
 */
router.route('/:shelfId').put((req, res) => {
    // Retrieve the ShelfID
    const shelfId = req.params.shelfId;

    // Initialize shelf variables
    let shelfUpdate;

    // Check if there any values in req.body
    if(Object.keys(req.body).length > 0) {
        // Retrieve the request from the front-end
        shelfUpdate = req.body;

        // Check if update body contains root
        if(shelfUpdate.root) {
            shelfUpdate.root = pathStringToArray(shelfUpdate.root);
        }
        
    } else {
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: `You did not send any information to update shelf: ${shelfId}`
        });
    }

    // Retrieve the existing Shelf and update
    // TODO: Refresh the MongoDB
    Shelf.findByIdAndUpdate(shelfId, shelfUpdate, {
        new: true // Send the updated shelf data instead of original
    }, (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        // Check if any responses from MongoDB
        if(mongoResponse) {
            mongoResponse = mongoResponse.toObject();
            mongoResponse.root = pathArrayToString(mongoResponse.root);

            res.status(200).json(mongoResponse);
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

/**
 * @summary Delete a single shelf
 */
router.route('/:shelfId').delete((req, res) => {
    // Retrieve the shelfId parameter.
    const shelfId = req.params.shelfId;

    // findByIdAndRemove would be using findAndModify which might take a bit longer
    Shelf.findByIdAndDelete(shelfId, (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        // Check if any responses from MongoDB
        if(mongoResponse) {
            // Responds back with the deleted shelf.
            res.status(204).send();
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

/**
 * @summary Refresh a single shelf
 */
router.route('/:shelfId/refresh').get((req, res) => {
    // Retrieve the shelfId parameter.
    const shelfId = req.params.shelfId;

    Shelf.findById(shelfId, async (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        if(mongoResponse) {
            try {
                await shelfLibrary.removeFilesFolders(mongoResponse);
                await shelfLibrary.retrieveFilesFolders(mongoResponse);
                // No content
                res.sendStatus(204);
            } catch(err) {
                return res.status(500).json({
                    errorCode: 500,
                    errorCodeMessage: 'Internal Server Error',
                    errorMessage: err.message
                });
            }
        } else {
            shelfNotFound(shelfId, res);
        }
        
    });
})

module.exports = router;