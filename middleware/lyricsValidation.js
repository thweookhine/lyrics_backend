const {body, param, validationResult} = require('express-validator')

const validateLyrics = [
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