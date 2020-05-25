// Packages
const router = require('express').Router();

// Models
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

/**
 * @summary Retrieve files and folders from base shelf directory
 */
router.route('/shelf/:shelfId').get((req, res) => {
});

module.exports = router;