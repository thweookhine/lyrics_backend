const { cloudinary } = require("../config/cloudinaryStorage");
const Lyrics = require("../models/Lyrics");
const Artist = require("../models/Artist");
const { default: mongoose } = require("mongoose");

function getPublicIdFromUrl(url) {
  return url.split('/').slice(-2).join('/').split('.')[0]; // Adjust if needed
}

const addSearchCount = async (id) => {
  const artist = await Artist.findById(id);
  await Artist.findByIdAndUpdate(id, {searchCount: artist.searchCount+1})
}

const createLyrics = async (req,res) => {

  try{
    const {title, singers, featureArtists, writers, majorKey, albumName, lyricsPhoto, genre} = req.body;

    // Collect all unique artist IDs
    let allArtists;
    if(featureArtists) {
      allArtists = [...new Set([...writers, ...singers, ...featureArtists])];
    }else {
      allArtists = [...new Set([...writers, ...singers])];
    }
    
    // Validate each artist ID
    for (const artistId of allArtists) {
      const foundArtist = await Artist.findById(artistId);
      if (!foundArtist) {
        return res.status(400).json({errors: [
      {message: `Artist ID ${artistId} is invalid.` }]});
      }
    }

    const newLyric = new Lyrics({
      title, singers, featureArtists, writers, majorKey, albumName, genre,
      lyricsPhoto: req.file.path
    });

    await newLyric.save();
    res.status(200).json({lyric: newLyric})

  } catch (err) {
    console.error(err);
    res.status(500).json({errors: [
      {message: err.msg}]})
  }
}

const updateLyricsById = async (req,res) => {

  try {
    const id = req.params.id;

    if(!id) {
      return res.status(400).json({errors: [
                {message: "ID is required" }]});
    }

    const {title, singers, featureArtists, writers, majorKey, albumName, genre} = req.body;
    
    // Collect all unique artist IDs
    let allArtists;
    if(featureArtists) {
      allArtists = [...new Set([...writers, ...singers, ...featureArtists])];
    }else {
      allArtists = [...new Set([...writers, ...singers])];
    }
    
    // Validate each artist ID
    for (const artistId of allArtists) {
      const foundArtist = await Artist.findById(artistId);
      if (!foundArtist) {
        return res.status(400).json({errors: [
      {message: `Artist ID ${artistId} is invalid.` }]});
      }
    }

    const existingLyrics = await Lyrics.findById(id);

    if (!existingLyrics) {
      return res.status(400).json({ errors: [{ message: "No Lyrics Found" }] });
    }

    const updatedLyrics = await Lyrics.findByIdAndUpdate(id, 
      {title, singers, featureArtists, writers, majorKey, albumName, lyricsPhoto: req.file.path, genre},
      {new: true}
    )

    if(!updatedLyrics) {
      return res.status(400).json({errors: [
        {message: "Fail to update Lyrics!"}]})
    }

    const existingPublicID = getPublicIdFromUrl(existingLyrics.lyricsPhoto)
    await cloudinary.uploader.destroy(existingPublicID);

    return res.status(200).json({lyrics: updatedLyrics})
  } catch(err) {
    return res.status(500).json({errors: [
      {message: err.msg}]})
  }
}

const deleteLyrics = async (req,res) => {
  const id = req.params.id;

  if(!id) {
    return res.status(400).json({errors: [
        {message: "ID is required!"}]})
  }

  try {
    const lyrics = await Lyrics.findById(id);

    if(!lyrics) {
      return res.status(400).json({errors: [
        {message: "Lyrics not found!"}]})
    }

    // Get public ID from lyricsPhoto of Lyrics
    const publicID = getPublicIdFromUrl(lyrics.lyricsPhoto);

    await Lyrics.findByIdAndDelete(lyrics.id)

    await cloudinary.uploader.destroy(publicID);

    return res.status(200).json({message: "Lyrics deleted successfully!"})
  }catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  }
}

const getLyricsId = async (req, res) => {
  try {
    const id = req.params.id;

    if(!id) {
      return res.status(400).json({errors: [
                {message: "ID is required" }]});
    }

    const lyrics = await Lyrics.findById(id);
    if(!lyrics) {
      return res.status(400).json({error: "Lyrics Not Found"})
    }

    lyrics.viewCount = lyrics.viewCount + 1;
  
    await lyrics.save();

    return res.status(200).json(lyrics)
  }catch (err) {
    res.status(500).json({error: err.msg})
  }
}

const getAllLyrics = async (req,res) => {
  try {
    const lyrics = await Lyrics.find();
    return res.status(200).json(lyrics)
  } catch (err) {
    return res.status(500).json({error: err.msg})
  }
}

const searchLyrics = async (req,res) => {
  const {type} = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  let query = {};

  if (type != 'all' && type != 'lyrics' && type != 'singer' && type != 'writer' && type != 'key') {
    return res.status(400).json({errors: [
      {message: 'Type not allowed!' }]})
  }

  try {
    if(type == "lyrics") {
      // Search with Lyrics
      const {lyricsId} = req.query
      if(lyricsId) {
        query._id = lyricsId
      }
    } else if (type == "singer" || type == 'writer') {
      // Search with artist
      const {artistId} = req.query
      if(!artistId) {
        return res.status(400).json({errors: [
          {message: 'artistId is required!' }]})
      }
      if(type == 'singer') {
        query = {
          $or: [
            {singers: new mongoose.Types.ObjectId(artistId) },
            {featureArtists: new mongoose.Types.ObjectId(artistId)}
          ]
        }
      } else if (type == 'writer') {
        query.writers = new mongoose.Types.ObjectId(artistId);
      }      
      await addSearchCount(artistId)

    } else if(type == "key") {
      // Search with key
      const {keyValue} = req.query;
      if(keyValue) {
        query.majorKey = keyValue;
      }
    } 

    const lyrics = await Lyrics.find(query).sort({viewCount: -1}).skip(skip).limit(limit);
    const totalCount = await Lyrics.countDocuments(query)

    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
      lyrics
    })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]})
  }
}

const getLyricsOverview = async (req, res) => {
  try {
    const totalCount = await Lyrics.countDocuments();

    const now = new Date();

    const lastPrevDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevCount = await Lyrics.countDocuments({
      createdAt: {$lt: lastPrevDay}
    })

    const countDiff = totalCount - prevCount;

    return res.status(200).json({
      totalCount,
      countDiff
    })
    } catch (err) {
      return res.status(500).json({errors: [
        {message: err.message }]})
    }
}

const getTopLyrics = async (req, res) => {
  try {
    const topLyrics = await Lyrics.find({viewCount: {$gt: 0}})
        .sort({viewCount: -1})
        .limit(10);
    return res.status(200).json({topLyrics})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}
    ]})
  }
}

const getLyricsCountByArtist = async (req, res) => {
  try {
    const {artistId} = req.query
    const query = {
      $or: [
        {singers: artistId},
        {writers: artistId},
        {featureArtists: artistId}
      ]
    }
   
    const lyricsCount = await Lyrics.countDocuments(query);
    return res.status(200).json({
      lyricsCount: lyricsCount
    })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}
    ]})
  }
}

const getLyricsByArtist = async (req, res) => {
  try {
    const {artistId} = req.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page -1) * limit;
    const query = {
      $or: [
        {singers: artistId},
        {writers: artistId},
        {featureArtists: artistId}
      ]
    }
    const lyrics = await Lyrics.find(query).skip(skip).limit(limit);
    const totalCount = await Lyrics.countDocuments(query)
    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount, lyrics
    })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}
    ]})
  }
}

module.exports = {
  createLyrics, updateLyricsById, 
  getLyricsId, getAllLyrics, 
  deleteLyrics, searchLyrics, 
  getLyricsOverview, getTopLyrics,
  getLyricsCountByArtist, getLyricsByArtist
}