// Packages
// ========
// Chai
const chai = require('chai');
const chaiString = require('chai-string'); // Chai String Plugin
chai.use(chaiString); // Allow Chai to use Chai String plugin.
const assert = chai.assert; // Assert Style

/**
 * @function recognizeThePath
 * @summary Check if route exists
 * @description A reusable test to check if testing recognizes the route exists.
 * @todo Create a testing helper and export it to other future route test files.
 * @param { object } request
 */
const recognizeThePath = (request) => {
    request.end((err, res) => {
        assert.isNumber(res.status);
        assert.notEqual(res.status, 404);
    });
};

/**
 * @function recognize200
 * @summary Check if OK Request (200)
 * @description A reusable test to simply check the actual status of the response if its OK (200).
 * @param { * } res 
 */
const recognize200 = (res) => {
    assert.isNumber(res.status);
    assert.equal(res.status, 200);
}

/**
 * @function recognize400
 * @summary Check if Bad Request (400)
 * @description A reusable assertion test to see if route had a 400 Bad Request.
 * @todo Create a testing helper and export it to other future route test files.
 * @param { * } res 
 */
const recognize400 = (res) => {
    assert.isNumber(res.status);
    assert.equal(res.status, 400);
    assert.isNumber(res.body.errorCode);
    assert.equal(res.body.errorCode, 400);
    assert.isString(res.body.errorCodeMessage);
    assert.equal(res.body.errorCodeMessage, 'Bad Request');
}

/**
 * @function recognize404
 * @summary Check if Not Found (404)
 * @description A reusable assertion test to check if route had a 404 Not Found.
 * @param { * } res 
 */
const recognize404 = (res) => {
    assert.isNumber(res.status);
    assert.equal(res.status, 404);
    assert.isNumber(res.body.errorCode);
    assert.equal(res.body.errorCode, 404);
    assert.isString(res.body.errorCodeMessage);
    assert.equal(res.body.errorCodeMessage, 'Not Found');
};

/**
 * @function recognize500
 * @summary Check if Internal Server Error (500)
 * @description A reusable assertion test to check if route had an Internal Server Error (500).
 * @param { * } res 
 */
const recognize500 = (res) => {
    assert.isNumber(res.status);
    assert.equal(res.status, 500);
    assert.isNumber(res.body.errorCode);
    assert.equal(res.body.errorCode, 500);
    assert.isString(res.body.errorCodeMessage);
    assert.equal(res.body.errorCodeMessage, 'Internal Server Error');
}

/**
 * @function recognizeErrorMessage
 * @summary Check for contents of error message.
 * @description A reusable assertion test to check for a sub-string of the error message.
 * @param { * } res 
 * @param { string } partialMessage 
 */
const recognizeErrorMessage = (res, partialMessage) => {
    assert.isString(res.body.errorMessage);
    assert.containIgnoreCase(res.body.errorMessage, partialMessage);
};

module.exports = {
    recognizeThePath: recognizeThePath,
    recognize200: recognize200,
    recognize400: recognize400,
    recognize404: recognize404,
    recognize500: recognize500,
    recognizeErrorMessage: recognizeErrorMessage
};