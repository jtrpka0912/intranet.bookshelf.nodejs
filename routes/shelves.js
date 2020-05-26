// Packages
const router = require('express').Router();

// Models
const Shelf = require('../models/shelf.model');

// Helpers
const { foundMongoError, shelfNotFound } = require('../libs/routes');

/**
 * @summary Retrieve all shelves
 */
router.route('/').get((req, res) => {
    // TODO: Do some validation if no shelves were found.
    Shelf.find().then(shelves => {
        res.json(shelves);
    }).catch(err => {
        res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'Something bad happened retrieving all shelves.'
        });
    });
});

/**
 * @summary Create new shelf
 */
router.route('/').post((req, res) => {
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

    // Create a new Shelf
    const newShelf = new Shelf({
        name: shelfName,
        root: shelfRoot,
        showDirectories: shelfShowDirectories,
        multiFile: shelfMultiFile
    });

    newShelf.save().then(() => {
        // TODO: Figure out a better response. Record on OpenAPI.
        return res.json('Successful'); // Need to do better response.
    }).catch(err => {
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: err.message
        });
    });
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

    // Need to check if there any values in req.body
    
    if(Object.keys(req.body).length > 0) {
        // Retrieve the request from the front-end
        shelfUpdate = req.body;
    } else {
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: `You did not send any information to update shelf: ${shelfId}`
        });
    }

    // Retrieve the existing Shelf and update
    Shelf.findByIdAndUpdate(shelfId, shelfUpdate, {
        new: true // Send the updated shelf data instead of original
    }, (mongoError, mongoResponse) => {
        if(foundMongoError(mongoError, res)) return;

        // Check if any responses from MongoDB
        if(mongoResponse) {
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
            // TODO: Figure out a better response. 
            // TODO: Record on OpenAPI.
            res.status(200).send('Cue the funeral dance meme!');
        } else {
            return shelfNotFound(shelfId, res);
        }
    });
});

module.exports = router;