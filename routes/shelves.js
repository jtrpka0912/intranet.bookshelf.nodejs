// Packages
const router = require('express').Router();
let Shelf = require('../models/shelf.model');

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
        // Maybe return id
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
    
    // Check if shelf id was found.
    if(!shelfId) {
        // Might never happen, but good to have in here.
        return res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'Required param, shelfid, was not found.'
        });
    }

    Shelf.findById(shelfId, (mongoError, mongoResponse) => {
        // Check if any errors from MongoDB
        if(mongoError) {
            return res.status(400).json({
                errorCode: 400,
                errorCodeMessage: 'Bad Request',
                // TODO: There is a better error message in mongoError, but needs to be parsed.
                // mongoError.reason needs to be parsed
                errorMessage: mongoError.message // This will do for now.
            });
        }

        // Check if any responses from MongoDB
        if(mongoResponse) {
            res.status(200).json(mongoResponse);
        } else {
            return res.status(404).json({
                errorCode: 404,
                errorCodeMessage: 'Not Found',
                errorMessage: `Unable to find shelf with id: ${shelfId}.`
            });
        }
    });
});

module.exports = router;