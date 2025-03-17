const express = require('express');
const { validateLyrics } = require('../middleware/lyricsValidation');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { createLyrics, updateLyricsById, getLyricsId, addViewCount, getAllLyrics, deleteLyrics } = require('../controllers/lyricsController');
const { upload } = require('../config/upload');
const lyricsRouter = express.Router();

lyricsRouter.post('/createLyrics', upload.single('lyricsPhoto'), validateLyrics, authenticateUser, checkRole(['admin']),createLyrics);
lyricsRouter.put('/updateLyrics:id', upload.single('lyricsPhoto'), validateLyrics, authenticateUser, checkRole(['admin']), updateLyricsById)
lyricsRouter.get('/addViewCount/:id', authenticateUser, addViewCount)
lyricsRouter.get('/getLyricsById/:id',authenticateUser, getLyricsId)
lyricsRouter.get('/',authenticateUser, getAllLyrics)
lyricsRouter.delete('/deleteLyrics/:id',authenticateUser, checkRole(['admin']), deleteLyrics)

module.exports = lyricsRouter

