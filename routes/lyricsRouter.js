const express = require('express');
const { validateLyrics, validateUpdateLyrics } = require('../middleware/lyricsValidation');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { createLyrics, updateLyricsById, getLyricsId, addViewCount, getAllLyrics, deleteLyrics, searchLyrics, getLyricsOverview, getTopLyrics, getLyricsCountByArtist, getLyricsByArtist, disableLyrics } = require('../controllers/lyricsController');
const { upload } = require('../config/upload');
const lyricsRouter = express.Router();

lyricsRouter.post('/createLyrics', upload.single('lyricsPhoto'), validateLyrics, authenticateUser, checkRole(['admin']),createLyrics);
lyricsRouter.put('/updateLyrics/:id', upload.single('lyricsPhoto'), validateLyrics, authenticateUser, checkRole(['admin']), updateLyricsById)
lyricsRouter.delete('/deleteLyrics/:id',authenticateUser, checkRole(['admin']), deleteLyrics)
lyricsRouter.get('/getLyricsOverview', authenticateUser, checkRole(['admin']), getLyricsOverview)
lyricsRouter.get('/disableLyrics/:id', authenticateUser, checkRole(['admin']), disableLyrics)

lyricsRouter.get('/getLyricsById/:id', getLyricsId)
lyricsRouter.get('/getTopLyrics', getTopLyrics)
lyricsRouter.get('/getLyricsCountByArtist',authenticateUser, checkRole(['admin']), getLyricsCountByArtist)
lyricsRouter.get('/getLyricsByArtist', getLyricsByArtist)
lyricsRouter.get('/searchLyrics', searchLyrics)
module.exports = lyricsRouter