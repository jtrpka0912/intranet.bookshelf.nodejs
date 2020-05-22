// Packages
const router = require('express').Router();
let Shelf = require('../models/shelf.model');

/**
 * @description Retrieve all shelves
 */
router.route('/').get((req, res) => {
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
 * @description Create new Shelf
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

module.exports = router;