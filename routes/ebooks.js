// Packages
const router = require('express').Router();

// Models
const File = require('../models/file.model');

router.route('/:fileId/did-read').patch(async (req, res) => {
    try {
        const fileId = req.params.fileId;

        try {
            const mongoFileResponse = await File.findById(fileId);
            
            if(!mongoFileResponse) {
                return res.status(404).json({
                    errorCode: 404,
                    errorCodeMessage: 'Not Found',
                    errorMessage: 'Unable to find shelf with id.'
                });
            }

        } catch (err) {
            return res.status(400).json({
                errorCode: 400,
                errorCodeMessage: 'Bad Request',
                errorMessage: err.message
            });
        }
    } catch(err) {
        return res.status(500).json({
            errorCode: 500,
            errorCodeMessage: 'Internal Server Error',
            errorMessage: err.message
        });
    }
    
});

module.exports = router;