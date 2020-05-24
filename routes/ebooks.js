// Packages
const router = require('express').Router();

// Models
let File = require('../models/file.model');
let Folder = require('../models/folder.model');

/**
 * @summary Retrieve files and folders from base shelf directory
 */