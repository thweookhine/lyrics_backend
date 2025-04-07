
const express = require('express');
const { createArtist, updateArtist, deleteArtistById, getAllArtists, getTopArtists, searchArtists, addSearchCount, getArtistById, getArtistIdAndNames, getArtistCount, getCountDiff, getArtistsByType } = require('../controllers/ArtistController');
const { validateArtist } = require('../middleware/artistValidation');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');

const artistRouter = express.Router();

artistRouter.post('/createArtist', validateArtist, authenticateUser, checkRole(['admin']), createArtist)
artistRouter.put('/updateArtist/:id', validateArtist, authenticateUser, checkRole(['admin']), updateArtist)
artistRouter.delete('/deleteArtist/:id', validateArtist, authenticateUser, checkRole(['admin']), deleteArtistById)

// TODO delete this searchArtists if not required!
artistRouter.get('/search', searchArtists);
artistRouter.get('/getArtistById/:id', getArtistById)
artistRouter.get('/getTopArtists', getTopArtists)
artistRouter.get('/getArtistsByType', getArtistsByType)
artistRouter.get('/getCount', authenticateUser, checkRole(['admin']), getArtistCount);
artistRouter.get('/getCountDiff', authenticateUser, checkRole(['admin']), getCountDiff)

module.exports = artistRouter