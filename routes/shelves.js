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
    console.info('Body', req.body);
    const shelfName             = req.body.name;
    const shelfRoot             = req.body.root;
    const shelfShowDirectories  = req.body.showDirectories;
    const shelfMultiFile        = req.body.multiFile;

    // Might want to add some validation here

    // Not showing directories and using multifile will conflict
    if(!shelfShowDirectories && shelfMultiFile) {
        // TODO: THIS STILL WILL PROCEED WITH REST OF CODE
        // Send error as response
        res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'You can not hide directories while using multi-file enabled.'
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
        res.json('Successful'); // Need to do better response.
    }).catch(err => {
        res.status(400).json({
            errorCode: 400,
            errorCodeMessage: 'Bad Request',
            errorMessage: 'Invalid input given to create shelf.'
        });
    });
});

module.exports = router;