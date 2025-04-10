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
    const {title, artists, featureArtists, writers, majorKey, albumName, lyricsPhoto, genre} = req.body;

    // Collect all unique artist IDs
    let allArtists;
    if(featureArtists) {
      allArtists = [...new Set([...writers, ...artists, ...featureArtists])];
    }else {
      allArtists = [...new Set([...writers, ...artists])];
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
      title, artists, featureArtists, writers, majorKey, albumName, genre,
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

    const {title, artists, featureArtists, writers, majorKey, albumName, genre} = req.body;
    
    // Collect all unique artist IDs
    let allArtists;
    if(featureArtists) {
      allArtists = [...new Set([...writers, ...artists, ...featureArtists])];
    }else {
      allArtists = [...new Set([...writers, ...artists])];
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
      {title, artists, featureArtists, writers, majorKey, albumName, lyricsPhoto: req.file.path, genre},
      {new: true}
    )

    if(!updatedLyrics) {
      return res.status(400).json({errors: [
        {message: "Fail to update Lyrics!"}]})
    }

    const existingPublicID = getPublicIdFromUrl(existingLyrics.lyricsPhoto)
    await cloudinary.uploader.destroy(existingPublicID);

    return res.status(200).json({artist: updatedLyrics})
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

const addViewCount = async (req,res) => {
  const id = req.params.id;
  if(!id) {
    return res.status(400).json({error: "ID is required!"})
  }

  try{
    const lyrics = await Lyrics.findById(id);

    if(!lyrics) {
      return res.status(400).json({error: "Lyrics Not Found!"})
    }
  
    lyrics.viewCount = lyrics.viewCount + 1;
  
    await lyrics.save();
  
    return res.status(200).json({message: "Successfully added view count!"})
  }catch(err) {
    return res.status(500).json({error: err.msg})
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

  try {
    if(type == "lyrics") {
      // Search with Lyrics
      const {lyricsId} = req.query
      if(lyricsId) {
        query._id = lyricsId
      }
    } else if (type == "artist") {
      // Search with artist
      const {artistId} = req.query
      if(artistId) {
        query = {
          $or: [
            {artists: new mongoose.Types.ObjectId(artistId) },
            {featureArtists: new mongoose.Types.ObjectId(artistId)}
          ]
        }
        await addSearchCount(artistId)
      }
    } else if(type == "writer") {
      // Search with writer
      const {writerId} = req.query
      if(writerId) {
        query.writers = new mongoose.Types.ObjectId(writerId);
      }

      await addSearchCount(writerId)

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
    console.log(err)
  }
}

module.exports = {createLyrics, updateLyricsById, addViewCount, getLyricsId, getAllLyrics, deleteLyrics, searchLyrics}