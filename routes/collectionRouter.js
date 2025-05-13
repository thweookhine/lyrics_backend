
const express = require('express');
const { authenticateUser } = require('../middleware/authenticateUser');
const { addToCollection, addToGroup, removeFromGroup } = require('../controllers/collectionController');
const { validateCollection } = require('../middleware/collectionValidation');
const checkRole = require('../middleware/checkRole');
const collectionRouter = express.Router();

collectionRouter.post('/addToCollection', validateCollection, authenticateUser, addToCollection)
collectionRouter.post('/addToGroup', authenticateUser, checkRole(['premium-user', 'admin']),  addToGroup)
collectionRouter.post('/removeFromGroup', authenticateUser, checkRole(['premium-user', 'admin']), removeFromGroup)
module.exports = collectionRouter