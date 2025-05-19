const express = require('express');
const { validateLyrics, validateUpdateLyrics } = require('../middleware/lyricsValidation');
const { authenticateUser, optionalAuthMiddleware } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { createLyrics, updateLyricsById, getLyricsId, addViewCount, getAllLyrics, deleteLyrics, searchLyrics, getLyricsOverview, getTopLyrics, getLyricsCountByArtist, getLyricsByArtist, disableLyrics, getDisableLyrics, getEnableLyrics, searchLyricsByAdmin, getLyricsByArtistByAdmin, enableLyrics, changeEnableFlag } = require('../controllers/lyricsController');
const { upload } = require('../config/upload');
const lyricsRouter = express.Router();

lyricsRouter.post('/createLyrics', upload.single('lyricsPhoto'), validateLyrics, authenticateUser, checkRole(['admin']), createLyrics);
lyricsRouter.put('/updateLyrics/:id', upload.single('lyricsPhoto'), validateUpdateLyrics, authenticateUser, checkRole(['admin']), updateLyricsById)
lyricsRouter.get('/getLyricsOverview', authenticateUser, checkRole(['admin']), getLyricsOverview)
lyricsRouter.get('/changeEnableFlag/:id', authenticateUser, checkRole(['admin']), changeEnableFlag)
lyricsRouter.get('/getLyricsById/:id', optionalAuthMiddleware, getLyricsId)
lyricsRouter.get('/getTopLyrics', optionalAuthMiddleware, getTopLyrics)
lyricsRouter.get('/getLyricsByArtist', optionalAuthMiddleware, getLyricsByArtist)
lyricsRouter.get('/getLyricsByArtistByAdmin', authenticateUser, checkRole(['admin']), getLyricsByArtistByAdmin )
lyricsRouter.delete('/deleteLyrics/:id',authenticateUser, checkRole(['admin']), deleteLyrics)
lyricsRouter.get('/searchLyrics', optionalAuthMiddleware, searchLyrics)
lyricsRouter.get('/getAllLyrics', authenticateUser, checkRole(['admin']), getAllLyrics)
lyricsRouter.get('/searchLyricsByAdmin', authenticateUser, checkRole(['admin']), searchLyricsByAdmin)
lyricsRouter.get('/getLyricsCountByArtist', getLyricsCountByArtist)


// lyricsRouter.get('/getLyricsCountByArtist',authenticateUser, checkRole(['admin']), getLyricsCountByArtist)
module.exports = lyricsRouter