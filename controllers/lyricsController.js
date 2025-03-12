const Lyrics = require("../models/Lyrics");

const createLyrics = async (req,res) => {
  try{
    const {title, artist, featureArtist, writer, majorKey} = req.body;

    const newLyrics = new Lyrics({
      title,artist,featureArtist,writer,majorKey,
      lyricsPhoto: req.file.buffer
  });

  await newLyrics.save();
  res.status(200).json({message: "Uploaded Lyrics Successfully!"})

  } catch (error) {
    console.error(error);
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

    // existingLyrics = {
    //   title,artist, featureArtist, writer, majorKey, lyricsPhoto: req.file.buffer
    // }

    existingLyrics.title = title;
    existingLyrics.artist = artist;
    existingLyrics.featureArtist = featureArtist;
    existingLyrics.writer = writer;
    existingLyrics.majorKey = majorKey;
    existingLyrics.lyricsPhoto = req.file.buffer

    await existingLyrics.save()

    return res.status(200).json({message: "Lyrics updated successfully."})
  } catch(err) {
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

    const imageBase64 = lyrics.lyricsPhoto? lyrics.lyricsPhoto.toString('base64') : null; 

    const lyricsPhotoResponse = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

    return res.status(200).json({
      title: lyrics.title,
      artist: lyrics.artist,
      featureArtist: lyrics.featureArtist,
      writer: lyrics.writer,
      majorKey: lyrics.majorKey,
      viewCount: lyrics.viewCount,
      lyricsPhoto: lyricsPhotoResponse
    })
  }catch (err) {
    res.status(500).json({error: err.msg})
  }
}

module.exports = {createLyrics, updateLyricsById, getLyricsId}