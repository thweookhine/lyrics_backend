const { cloudinary } = require("../config/cloudinaryStorage");
const Lyrics = require("../models/Lyrics");
const Artist = require("../models/Artist");
const Collection = require('../models/Collection');
const { default: mongoose } = require("mongoose");

function getPublicIdFromUrl(url) {
  return url.split('/').slice(-2).join('/').split('.')[0]; // Adjust if needed
}

const addSearchCount = async (id) => {
  const artist = await Artist.findById(id);
  await Artist.findByIdAndUpdate(id, {searchCount: artist.searchCount+1})
}

const searchQuery = async (query, keyword, type) => {
    if(type == "lyrics") {
      if(keyword) {
        query = {
          $and: [
            query,
            {
              $or: [
                {title: {$regex: keyword, $options: 'i'}},
                {albumName: {$regex: keyword, $options: 'i'}}
              ]
            }
        ]
      }
    }
    } else if (type == "singer" || type == 'writer') {
      // Search with artist
      if(keyword) {
        const artist = await Artist.findById(keyword);
        if(!artist) {
          return res.status(400).json({errors: [
            {message: 'Artist Not Found!' }]})
        }

        if(type == 'singer') {
          query = {
            $and: [
              query,
              {
                $or: [
                  {singers: new mongoose.Types.ObjectId(keyword) },
                  {featureArtists: new mongoose.Types.ObjectId(keyword)}
                ]
              }
            ]
            
          }
        } else {
          query = {
            $and: [
              query,
              {writers: new mongoose.Types.ObjectId(keyword)}
            ]
          }
        }      
      }
    } else if(type == "key") {
      // Search with key
      if(keyword) {
        query = {
          $and: [
            query,
            {majorKey: keyword}
          ]
        }
      }
    } else if(type == "all") {
      if(keyword) {
        query = {
          $and: [
            query,
            {
              $or: [
                {title: {$regex: keyword, $options: "i"}},
                {albumName: {$regex: keyword, $options: "i"}}
              ]
            }
          ]
        }
      }
    }

    return query;
}


const createLyrics = async (req,res) => {

  let cloudinaryResult = null;
  let cloudinaryPublicId = null;

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

    // Upload photo to Cloudinary
    if (req.file) {
      cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'lyrics' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        );
        
        uploadStream.end(req.file.buffer);
      });

      // Store the public_id from Cloudinary to delete the image if needed
      cloudinaryPublicId = cloudinaryResult.public_id;
    }

    const newLyric = new Lyrics({
      title, singers, featureArtists, writers, majorKey, albumName, genre,
      lyricsPhoto: cloudinaryResult ? cloudinaryResult.secure_url : null,
    });

    await newLyric.save();
    res.status(200).json({lyric: newLyric})

  } catch (err) {
    // If any error occurs during the process, delete the image from Cloudinary
    if (cloudinaryPublicId) {
      await cloudinary.uploader.destroy(cloudinaryPublicId)
        .catch(deleteError => console.error('Failed to delete image from Cloudinary:', deleteError));
    }
    return res.status(500).json({errors: [
      {message: err.msg}]})
  }
}

const updateLyricsById = async (req,res) => {

  let cloudinaryResult = null;
  let cloudinaryPublicId = null;
  let lyricsPhoto = null;

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

    if(!existingLyrics.isEnable) {
      return res.status(400).json({ errors: [{ message: "Lyrics has been disabled!" }] });
    }

    // Upload photo to Cloudinary
    if (req.file) {
      cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'lyrics' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        );
        
        uploadStream.end(req.file.buffer);
      });

      // Store the public_id from Cloudinary to delete the image if needed
      cloudinaryPublicId = cloudinaryResult.public_id;
      lyricsPhoto = cloudinaryResult ? cloudinaryResult.secure_url : null
    } else {
      lyricsPhoto = existingLyrics.lyricsPhoto
    }

    const updatedLyrics = await Lyrics.findByIdAndUpdate(id, 
      {title, singers, featureArtists, writers, majorKey, albumName, lyricsPhoto: lyricsPhoto, genre},
      {new: true}
    )

    if(!updatedLyrics) {
      throw new Error({message: "Fail to update Lyrics"});
    }

    const existingPublicID = getPublicIdFromUrl(existingLyrics.lyricsPhoto)
    await cloudinary.uploader.destroy(existingPublicID);

    return res.status(200).json({lyrics: updatedLyrics})
  } catch(err) {
    // If any error occurs during the process, delete the image from Cloudinary
    if (cloudinaryPublicId) {
      await cloudinary.uploader.destroy(cloudinaryPublicId)
        .catch(deleteError => console.error('Failed to delete image from Cloudinary:', deleteError));
    }
    return res.status(500).json({errors: [
      {message: err.msg}]})
  }
}

const disableLyrics = async (req, res) => {
  const id = req.params.id;
  if(!id) {
    return res.status(400).json({errors: [
        {message: "ID is required!"}]})
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Collection.deleteMany({lyricsId: id}, {session})
    const updatedLyrics = await Lyrics.findByIdAndUpdate(id, {
      isEnable: false
    }, {
      new: true
    })

    // Commit transaction
    await session.commitTransaction();

    return res.status(200).json({lyrics: updatedLyrics})
  }catch (err) {
    await session.abortTransaction();
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  } finally {
    session.endSession();
  }
}

const deleteLyrics = async (req,res) => {
  const id = req.params.id;

  if(!id) {
    return res.status(400).json({errors: [
        {message: "ID is required!"}]})
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lyrics = await Lyrics.findById(id);

    if(!lyrics) {
      return res.status(400).json({errors: [
        {message: "Lyrics not found!"}]})
    }

    await Collection.deleteMany({ lyricsId: lyrics.id }, {session});
    // Get public ID from lyricsPhoto of Lyrics
    const publicID = getPublicIdFromUrl(lyrics.lyricsPhoto);

    await Lyrics.findByIdAndDelete(lyrics.id, {session})

    await cloudinary.uploader.destroy(publicID);

    // Commit transaction
    await session.commitTransaction();

    return res.status(200).json({message: "Lyrics deleted successfully!"})
  }catch (err) {
    // Rollback transaction
    await session.abortTransaction();
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  } finally {
    session.endSession();
  }
}

const getLyricsId = async (req, res) => {
  try {
    const id = req.params.id;

    if(!id) {
      return res.status(400).json({errors: [
                {message: "ID is required" }]});
    }

    const lyrics = await Lyrics.findById(id).populate('singers').populate('writers').populate('featureArtists');
    if(!lyrics) {
      return res.status(400).json({error: "Lyrics Not Found"})
    }

    if(!lyrics.isEnable) {
      return res.status(400).json({error: "This Lyrics has been disabled!"})
    }

    lyrics.viewCount = lyrics.viewCount + 1;
  
    await lyrics.save();

    return res.status(200).json(lyrics)
  }catch (err) {
    res.status(500).json({error: err.message})
  }
}

const searchLyrics = async (req,res) => {
  const {type} = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  let query = { isEnable: true };

  const allowdTypes = ['lyrics','singer','writer','key','all'];

  if(!allowdTypes.includes(type)) {
    return res.status(400).json({errors: [
      {message: 'Type not allowed!' }]})
  }

  const {keyword} = req.query

  try {
    
    query = await searchQuery(query, keyword, type)

    const lyrics = await Lyrics.find(query).sort({viewCount: -1}).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
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
    const disabledCount = await Lyrics.countDocuments({isEnable: false})
    const enabledCount = await Lyrics.countDocuments({isEnable: true})

    const now = new Date();

    const lastPrevDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevCount = await Lyrics.countDocuments({
      createdAt: {$lt: lastPrevDay}
    })

    const countDiff = totalCount - prevCount;

    return res.status(200).json({
      totalCount,
      countDiff,
      disabledCount,
      enabledCount
    })
    } catch (err) {
      return res.status(500).json({errors: [
        {message: err.message }]})
    }
}

const getTopLyrics = async (req, res) => {
  try {
    const topLyrics = await Lyrics.find({
      isEnable: true,
      viewCount: { $gt: 0 }
      })
        .sort({viewCount: -1})
        .limit(10)
        .populate('singers')
        .populate('writers')
        .populate('featureArtists');
    return res.status(200).json({topLyrics})
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
      $and: [
        {isEnable: true},
        {
          $or: [
            {singers: artistId},
            {writers: artistId},
            {featureArtists: artistId}
          ]
        }
      ]
    }
    const lyrics = await Lyrics.find(query).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
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


const getLyricsByArtistByAdmin = async (req, res) => {
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
    const lyrics = await Lyrics.find(query).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
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

const getAllLyrics = async (req,res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  try {
    const lyrics = await Lyrics.find().skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
    const totalCount = await Lyrics.countDocuments()
    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount, lyrics
    })
  } catch (err) {
    return res.status(500).json({error: err.msg})
  }
}

const searchLyricsByAdmin = async (req, res) => {
  const {type} = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  const isEnable = req.query.isEnable;
  let query = {}
  if(isEnable) {
    query = {isEnable: isEnable}
  }

  const allowdTypes = ['lyrics','singer','writer','key','all'];

  if(!allowdTypes.includes(type)) {
    return res.status(400).json({errors: [
      {message: 'Type not allowed!' }]})
  }

  const {keyword} = req.query
  try {
    query = await searchQuery(query, keyword, type)

    const lyrics = await Lyrics.find(query).sort({viewCount: -1}).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
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

const getLyricsCountByArtist = async (req, res) => {
  const {artistId} = req.query;
  try {

    const artist = await Artist.findById(artistId);
    if(!artist) {
      return res.status(400).json({errors: [
        {message: `Artist ID ${artistId} is invalid.` }]});
    }
    
    const lyricsCount = await Lyrics.countDocuments({
      $or: [
        {singers: new mongoose.Types.ObjectId(artistId)},
        {featureArtists: new mongoose.Types.ObjectId(artistId)},
        {writers: new mongoose.Types.ObjectId(artistId)}
      ]
    })
    return res.status(200).json({
      lyricsCount
    })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]})
  }

}

module.exports = {
  createLyrics, updateLyricsById, 
  disableLyrics, getLyricsOverview,
  getLyricsId, 
  deleteLyrics, searchLyrics, 
  getTopLyrics,
  getLyricsByArtist, getLyricsByArtistByAdmin, getAllLyrics,
  searchLyricsByAdmin, getLyricsCountByArtist
}