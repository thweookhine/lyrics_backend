const Collection = require('../models/Collection')
const Lyrics = require('../models/Lyrics')

const addToCollection = async (req,res) => {
  try {
      // Get userId and lyricsId from req
      const {lyricsId} = req.body;
      const user = req.user

      // Find lyrics by ID
      const lyrics = await Lyrics.findById(lyricsId);

      // Check whether lyrics exists or not
      if (!lyrics) {
        return res.status(400).json({errors: [
            {message: `Lyrics not found!` }]});
      }

      // 1. If user type is free-user, need to check count of existing collections
      if(user.role == 'free-user') {
        const count = await Collection.countDocuments({userId: user._id});
        // 1.1. If count is 20, send response with 400 status code
        if(count > 20) {
          return res.status(400).json({errors: [
            {
              message: 'You can add only 20 collections'
            }
          ]})
        }
      }

      const checkCount = await Collection.countDocuments({
        userId: user._id,
        lyricsId: lyrics.id
      })

      if(checkCount > 0) {
        return res.status(400).json({errors: [
          {message: `Already added to your Collection.` }]});
      }

      //successfully add to collection
      const collection = new Collection({
        userId: user._id,
        lyricsId: lyrics.id
      })

      await collection.save();

      res.status(200).json({collection})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

const addToGroup = async (req, res) => {
  // Only Premium User can access this api
  // Get lyricsId and groupname from req body
  // Get user from req.user
  // search Lyrics by lyricsId 
  // If lyrics not found, response error
  // search Collection by lyricsId and group name
  // If collection not found, response error 
  // 
}

const removeFromCollection = async (req, res) => {
  try { 
    

  }catch (err) {

  }
}

module.exports = {addToCollection, addToGroup, removeFromCollection}
 

