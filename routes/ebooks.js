// Packages
const router = require('express').Router();

const { pathArrayToString } = require('../libs/helpers/routes');
// Models
const File = require('../models/file.model');

// NOTE: https://stackoverflow.com/questions/7288814/download-a-file-from-nodejs-server-using-express
// Basically, an endpoint to retrieve a file, from the server

router.route('/:fileId/did-read').patch(async (req, res) => {
    try {
        const fileId = req.params.fileId;

        try {
            const mongoFileResponse = await File.findById(fileId);

            // Check if it found the file
            if(!mongoFileResponse) {
                return res.status(404).json({
                    errorCode: 404,
                    errorCodeMessage: 'Not Found',
                    errorMessage: 'Unable to find shelf with id.'
                });
            }

            const { didRead } = req.body;

            // Check if the didRead is a proper value type
            if(typeof didRead !== 'boolean') {
                return res.status(400).json({
                    errorCode: 400,
                    errorCodeMessage: 'Bad Request',
                    errorMessage: 'didRead is not a boolean value.'
                })
            }

            mongoFileResponse.didRead = didRead;

            await File.updateOne({ _id: mongoFileResponse._id }, { didRead });

            const jsonFile = mongoFileResponse.toObject();
            jsonFile.path = pathArrayToString(mongoFileResponse.path);
            jsonFile.cover = pathArrayToString(mongoFileResponse.cover);

            return res.status(200).json(jsonFile);

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