
const express = require('express');
const { createArtist, updateArtist, deleteArtistById, getAllArtists, getTopArtists, searchArtists, addSearchCount, getArtistById } = require('../controllers/ArtistController');
const { validateArtist } = require('../middleware/artistValidation');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');

const artistRouter = express.Router();

artistRouter.post('/createArtist', validateArtist, authenticateUser, checkRole(['admin']), createArtist)
artistRouter.put('/updateArtist/:id', validateArtist, authenticateUser, checkRole(['admin']), updateArtist)
artistRouter.delete('/deleteArtist/:id', validateArtist, authenticateUser, checkRole(['admin']), deleteArtistById)
artistRouter.get('/search', searchArtists);
artistRouter.get('/addSearchCount/:id', addSearchCount)
artistRouter.get('/getArtistById/:id', getArtistById)

artistRouter.get('/getTopArtists', getTopArtists)
module.exports = artistRouter