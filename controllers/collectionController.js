const Collection = require('../models/Collection')
const Lyrics = require('../models/Lyrics');
const {LYRICS_PER_COLLECTION_LIMIT, COLLECTION_COUNT_LIMIT, USER_ROLE_FREE, DEFAULT_COLLECTION_NAME } = require('../utils/Constants');

const addToDefaultCollection = async (req,res) => {
  try {
      // Get userId and lyricsId from req
      const {lyricsId} = req.body;
      const user = req.user

      // Find lyrics by ID
      const lyrics = await Lyrics.find({
        _id: lyricsId,
        isEnable: true
      });

      // Check whether lyrics exists or not
      if (!lyrics) {
        return res.status(400).json({errors: [
            {message: `Lyrics not found!` }]});
      }

      // 1. If user type is free-user, need to check count of existing collections
      if(user.role == USER_ROLE_FREE) {
        const count = await Collection.countDocuments({userId: user._id, group: DEFAULT_COLLECTION_NAME});
        // 1.1. If count is 20, send response with 400 status code
        if(count >= FREE_USER_LIMIT_DEFAULT_COLLECTION) {
          return res.status(400).json({errors: [
            {
              message: `You can add only ${FREE_USER_LIMIT_DEFAULT_COLLECTION} collections`
            }
          ]})
        }
      }

      const checkCount = await Collection.countDocuments({
        $and: [
          {userId: user._id},
          {lyricsId: lyricsId},
          {group: DEFAULT_COLLECTION_NAME}
        ]
      })

      if(checkCount > 0) {
        return res.status(400).json({errors: [
          {message: `Already added to your Collection.` }]});
      }

      //successfully add to collection
      const collection = new Collection({
        userId: user._id,
        lyricsId: lyricsId
      })

      await collection.save();

      return res.status(200).json({collection})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

const addToGroup = async (req, res) => {
  try {
    // Get collectionId and lyricsId and groupname from req body 
    const {lyricsId, group} = req.body;
    // Get user from req.user
    const user = req.user
    // search Lyrics by lyricsId 
    const lyrics = await Lyrics.findById(lyricsId);
    // If lyrics not found, response error
    if(!lyrics) {
      return res.status(400).json({errors: [
        {message: `Lyrics not found!` }]});
    }

    const countInGrp = await Collection.countDocuments({
      userId: user._id,
      group: group
    })

    if(countInGrp >= LYRICS_PER_COLLECTION_LIMIT) {
      return res.status(400).json({errors: [
        {message: `Collection Limit Reached in Group ${group}` }]});
    }

    const grpCount = await Collection.countDocuments({
      userId: user._id
    })

    if(grpCount >= COLLECTION_COUNT_LIMIT) {
      return res.status(400).json({errors: [
        {message: `Group Limit Reached` }]});
    }

    const existing = await Collection.find({
      userId: user._id,
      lyricsId: lyricsId,
      group: group
    })

    if(existing.length > 0) {
      return res.status(400).json({errors: [
        {message: `You have already added to group [${group}]!` }]});
    }

    //successfully add to collection
    const collection = new Collection({
      userId: user._id,
      lyricsId: lyrics.id,
      group: group
    })

    await collection.save();
    return res.status(200).json({collection})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

// const checkHasInGroup = async (req, res) => {
//   const id = req.params.id;
//   const userId = req.user.id;
//   const collections = await Collection.find({
//     $and: [
//       {lyricsId: id},
//       {userId: userId},
//       {group: {$ne: "Default"}}
//     ]
//   })

//   let hasInGp = false;
//   if(collections.length > 0) {
//     hasInGp = true;
//   }

//   return res.status(200).json({hasInGroup: hasInGp})
// }

const removeFromGroup = async (req, res) => {
  const {lyricsId, group} = req.body
  const user = req.user;
  try {
    const query = {
    userId: user._id,
    lyricsId, group
    }
  
    const collections = await Collection.find(query)

    if(collections.length <= 0) {
      return res.status(404).json({errors: [
          {message: `Collection is not found!` }]});
    }

    await Collection.deleteMany(query);
    return res.status(200).json({message: "Successfully Deleted"})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

const getLyricsByGroup = async (req, res) => {
  const {group} = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  try {
    const collections = await Collection.find({
      group, userId: req.user._id
    });

    if(collections.size == 0) {
      return res.status(404).json({errors: [
          {message: `There is no collections with Group Name [${group}]!` }]});
    }

    const lyricsIds = collections.map(collection => collection.lyricsId);
    let query = {
      _id: {$in: lyricsIds},
      isEnable: true
    }
    let lyrics = await Lyrics.find(query).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
    const totalCount = await Lyrics.countDocuments(query);

    let lyricsList = lyrics.map(lyric => {
      lyric = lyric.toObject();
      return {
        ...lyric,
        isFavourite: true
      }
    })

    return res.status(200).json({
      lyrics: lyricsList,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    })

  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

const getCollectionOverview = async (req, res) => {
  try {
    const collections = await Collection.aggregate([
      {
        $match: {
          userId: req.user._id
        }
      },
      {
        $group: {
          _id: "$group",
          count: {$sum: 1}
        }
      },
      {
        $project: {
          _id: 0,
          group: "$_id",
          count: 1
        }
      }
    ])

    const totalCount = await Collection.countDocuments({userId: req.user._id});

    return res.status(200).json({
      collections,
      totalCount
    })

  }catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }
}

const getGroupsByLyric = async (req, res) => {
  const lyricsId = req.params.id;
  const user = req.user;

  try {
    const collections = await Collection.find({
      userId: user._id,
      lyricsId: lyricsId,
    }, { group: 1, _id: 0 });

    return res.status(200).json({
        groups: collections,
        totalCount: collections.length
      })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]});
  }

  }
 
module.exports = { getGroupsByLyric, addToDefaultCollection, 
  // checkHasInGroup,
   addToGroup, removeFromGroup, getLyricsByGroup, getCollectionOverview}
 

