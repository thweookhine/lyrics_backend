const { query } = require('express');
const Collection = require('../models/Collection')
const Lyrics = require('../models/Lyrics')

const addToCollection = async (req,res) => {
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

      const checkCount = await Collection.countDocuments({
        $and: [
          {userId: user._id},
          {lyricsId: lyricsId}
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

const removeFromGroup = async (req, res) => {
  const {lyricsId, group} = req.body
  const user = req.user;
  try {
    const query = {
    userId: user._id,
    lyricsId, group
    }
    const collection = await Collection.find()

    if(!collection) {
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
    const lyrics = await Lyrics.find(query).skip(skip).limit(limit);
    const totalCount = await Lyrics.countDocuments(query);

    return res.status(200).json({
      lyrics,
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

module.exports = {addToCollection, addToGroup, removeFromGroup, getLyricsByGroup, getCollectionOverview}
 

