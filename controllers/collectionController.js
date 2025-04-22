const { Collection } = require("mongoose");
const Lyrics = require("../models/Lyrics");

const addToCollection = async (req,res) => {
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
    if(count >= 20) {
      return res.status(400).json({errors: [
        {
          message: 'You can add only 20 collections'
        }
      ]})
    }
  }

  //successfully add to collection
  const collection = new Collection({
    userId: user._id,
    lyricsId: lyricsId
  })

  await collection.save();

  res.status(200).json({collection})
}

module.exports = {addToCollection}
 

