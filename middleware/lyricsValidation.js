const {body, param, validationResult} = require('express-validator')
const {genreList, keyList, tierList} = require('../utils/Constants')

const validateLyrics = [
  body('title').notEmpty().withMessage('title is required!'),
  body('singers').isArray({min: 1}).withMessage('Singers must be a non-empty array'),
  body('singers.*').isMongoId().withMessage('Invalid Artist ID in singers'),
  body('writers.*').isMongoId().withMessage('Invalid Artist ID in writers'),
  body('majorKey').isIn(keyList).withMessage("Major key must be valid key!"),
  body('genre').isIn(genreList).withMessage("Genre must be valid key!"),
  body('tier').isIn(tierList).withMessage("Tier must be valid number!"),
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
        return res.status(400).json({ errors: errors.array().map(err => ({ message: err.msg })) });
      }

      // Validate the file type (only after validation passed)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (req.file && !allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ errors: [{ message: "Only PNG, JPG, and JPEG files are allowed" }] });
      }
      next();
  }
]

const validateUpdateLyrics = [
  body('title').notEmpty().withMessage('title is required!'),
  body('singers').isArray({min: 1}).withMessage('Singers must be a non-empty array'),
  body('singers.*').isMongoId().withMessage('Invalid Artist ID in singers'),
  body('writers.*').isMongoId().withMessage('Invalid Artist ID in writers'),
  body('majorKey').isIn(keyList).withMessage("Major key must be valid key!"),
  body('genre').isIn(genreList).withMessage("Genre must be valid key!"),
  body('tier').isIn(tierList).withMessage("Tier must be valid number!"),
  body('featureArtists.*').isMongoId().withMessage('Invalid Artist Id in feature artists'),
  (req, res, next) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(err => ({ message: err.msg })) });
      }
       // Validate file type
       const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
       if (req.file && !allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ errors: [
          {message:"Only PNG, JPG, and JPEG files are allowed"}
        ]});
       }
      next();
  }
]

module.exports = { validateLyrics, validateUpdateLyrics}