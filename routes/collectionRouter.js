
const express = require('express');
const { authenticateUser } = require('../middleware/authenticateUser');
const { addToCollection } = require('../controllers/collectionController');
const { validateCollection } = require('../middleware/collectionValidation');
const collectionRouter = express.Router();

collectionRouter.post('/addToCollection', validateCollection, authenticateUser, addToCollection)

module.exports = collectionRouter