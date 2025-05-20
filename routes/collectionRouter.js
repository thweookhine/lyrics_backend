
const express = require('express');
const { authenticateUser } = require('../middleware/authenticateUser');
const { addToCollection, addToGroup, removeFromGroup, getLyricsByGroup, getCollectionOverview, checkHasInGroup } = require('../controllers/collectionController');
const { validateCollection } = require('../middleware/collectionValidation');
const checkRole = require('../middleware/checkRole');
const collectionRouter = express.Router();

collectionRouter.post('/addToCollection', validateCollection, authenticateUser, addToCollection)
collectionRouter.post('/addToGroup', authenticateUser, checkRole(['premium-user', 'admin']),  addToGroup)
collectionRouter.put('/removeFromGroup', authenticateUser, removeFromGroup)
collectionRouter.get('/getLyricsByGroup', authenticateUser, checkRole(['premium-user', 'admin']), getLyricsByGroup)
collectionRouter.get('/getCollectionOverview', authenticateUser, getCollectionOverview);
collectionRouter.get('/checkHasInGroup/:id', authenticateUser, checkHasInGroup)

module.exports = collectionRouter