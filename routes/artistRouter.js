
const express = require('express');
const { createArtist, updateArtist, deleteArtistById, getAllArtists, getTopArtists, searchArtists, addSearchCount, getArtistById, getArtistsByType, getArtistOverview, checkArtistExists } = require('../controllers/artistController');
const { validateArtist } = require('../middleware/artistValidation');
const { authenticateUser, optionalAuthMiddleware } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');

const artistRouter = express.Router();

artistRouter.post('/createArtist', validateArtist, authenticateUser, checkRole(['admin']), createArtist)
artistRouter.put('/updateArtist/:id', authenticateUser, checkRole(['admin']), updateArtist)
artistRouter.delete('/deleteArtist/:id', authenticateUser, checkRole(['admin']), deleteArtistById)

artistRouter.get('/search', searchArtists);
artistRouter.get('/getArtistById/:id', optionalAuthMiddleware, getArtistById)
artistRouter.get('/getTopArtists', getTopArtists)
artistRouter.get('/getArtistsByType', getArtistsByType)
artistRouter.get('/getArtistOverview', authenticateUser, checkRole(['admin']), getArtistOverview);
artistRouter.get('/checkArtistExist', authenticateUser, checkRole(['admin']), checkArtistExists);
module.exports = artistRouter