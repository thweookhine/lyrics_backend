
const express = require('express');
const { authenticateUser } = require('../middleware/authenticateUser');
const { addToCollection, addToGroup, removeFromGroup, getLyricsByGroup, getCollectionOverview, checkHasInGroup, getGroupsByLyric } = require('../controllers/collectionController');
const { validateCollection } = require('../middleware/collectionValidation');
const checkRole = require('../middleware/checkRole');
const collectionRouter = express.Router();

collectionRouter.post('/addToCollection', validateCollection, authenticateUser, addToCollection)
collectionRouter.post('/addToGroup', authenticateUser, checkRole(['premium-user', 'admin']),  addToGroup)
collectionRouter.put('/removeFromGroup', authenticateUser, removeFromGroup)
collectionRouter.get('/getLyricsByGroup', authenticateUser, getLyricsByGroup)
collectionRouter.get('/getCollectionOverview', authenticateUser, getCollectionOverview);
// collectionRouter.get('/checkHasInGroup/:id', authenticateUser, checkHasInGroup)
collectionRouter.get('/getGroupsByLyric/:id', authenticateUser, getGroupsByLyric)

module.exports = collectionRouter