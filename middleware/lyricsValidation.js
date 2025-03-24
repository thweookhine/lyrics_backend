const {body, param, validationResult} = require('express-validator')
const {genreList, keyList} = require('../utils/Constants')

const validateLyrics = [
  body('title').notEmpty().withMessage('title is required!'),
  body('artists').isArray({min: 1}).withMessage('Artists must be a non-empty array'),
  body('artists.*').isMongoId().withMessage('Invalid Artist ID in artists'),
  body('writers').isArray({min: 1}).withMessage('Writers must be a non-empty array'),
  body('writers.*').isMongoId().withMessage('Invalid Artist ID in artists'),
  body('majorKey').isIn(keyList).withMessage("Major key must be valid key!"),
  body('genre').isIn(genreList).withMessage("Genre must be valid key!"),
  body('featureArtists.*').isMongoId().withMessage('Invalid Artist Id in feature artists'),
  body('lyricsPhoto')
  .custom((value, { req }) => {
    if (req.file) {
      return true;
    } else {
      throw new Error('Lyrics Photo must be entered.');
    }
  }),
  (req, res, next) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
          return res.status(400).json({errors: errors.array()});
      }
       // Validate file type
       const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
       if (!allowedTypes.includes(req.file.mimetype)) {
           return res.status(400).json({ message: "Only PNG, JPG, and JPEG files are allowed" });
       }
      next();
  }
]

const validateLyricsBK = [
    body('title').notEmpty().withMessage('title is required!'),
    body('artist').notEmpty().withMessage('title is required!'),
    body('featureArtist').notEmpty().withMessage('title is required!'),
    body('writer').notEmpty().withMessage('title is required!'),
    body('majorKey').notEmpty().withMessage('title is required!'),
    body('lyricsPhoto')
    .custom((value, { req }) => {
      if (req.file) {
        return true;
      } else {
        throw new Error('Lyrics Photo must be entered.');
      }
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
         // Validate file type
         const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
         if (!allowedTypes.includes(req.file.mimetype)) {
             return res.status(400).json({ message: "Only PNG, JPG, and JPEG files are allowed" });
         }
        next();
    }
]

module.exports = { validateLyrics }