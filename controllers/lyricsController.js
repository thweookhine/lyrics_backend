const { cloudinary } = require("../config/cloudinaryStorage");
const Lyrics = require("../models/Lyrics");

function getPublicIdFromUrl(url) {
  return url.split('/').slice(-2).join('/').split('.')[0]; // Adjust if needed
}

const createLyrics = async (req,res) => {
  try{
    const {title, artist, featureArtist, writer, majorKey} = req.body;

    const newLyrics = new Lyrics({
      title,artist,featureArtist,writer,majorKey,
      lyricsPhoto: req.file.path
  });

  await newLyrics.save();
  res.status(200).json({message: "Uploaded Lyrics Successfully!"})

  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.msg})
  }

}

const updateLyricsById = async (req,res) => {
  try {
    const id = req.params.id;

    if(!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const {title, artist, featureArtist, writer, majorKey} = req.body;
    const existingLyrics = await Lyrics.findById(id);

    if(!existingLyrics) {
      return res.status(400).json({error: "Lyrics not found!"})
    }

    const existingPublicID = getPublicIdFromUrl(existingLyrics.lyricsPhoto)

    existingLyrics.title = title;
    existingLyrics.artist = artist;
    existingLyrics.featureArtist = featureArtist;
    existingLyrics.writer = writer;
    existingLyrics.majorKey = majorKey;
    existingLyrics.lyricsPhoto = req.file.path

    await existingLyrics.save()

    await cloudinary.uploader.destroy(existingPublicID);

    return res.status(200).json({message: "Lyrics updated successfully."})
  } catch(err) {
    return res.status(500).json({error: err.msg})
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
      return res.status(400).json({ error: "ID is required" });
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

const deleteLyrics = async (req,res) => {
  const id = req.params.id;

  if(!id) {
    return res.status(400).json({error: "ID is required!"})
  }

  try {
    const lyrics = await Lyrics.findById(id);

    if(!lyrics) {
      return res.status(400).json({error: "Lyrics not found!"})
    }

    // Get public ID from lyricsPhoto of Lyrics
    const publicID = getPublicIdFromUrl(lyrics.lyricsPhoto);

    await Lyrics.findByIdAndDelete(lyrics.id)

    await cloudinary.uploader.destroy(publicID);

    return res.status(200).json({message: "Lyrics deleted successfully!"})
  }catch (err) {
    return res.status(500).json({error: err.msg}) 
  }
}

module.exports = {createLyrics, updateLyricsById, addViewCount, getLyricsId, getAllLyrics, deleteLyrics}