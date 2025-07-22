const { cloudinary } = require("../config/cloudinaryStorage");
const Lyrics = require("../models/Lyrics");
const Artist = require("../models/Artist");
const Collection = require('../models/Collection');
const { default: mongoose } = require("mongoose");
const User = require("../models/User");
const { getCurrentUser } = require("./userController");

function getPublicIdFromUrl(url) {
  return url.split('/').slice(-2).join('/').split('.')[0]; // Adjust if needed
}

const searchQuery = async (basicFilter = {}, keyword, sortOptions, skip, limit) => {
  const pipeLine = [
    {
      // Lookup for singers
      $lookup: {
        from: 'artists',
        localField: 'singers',
        foreignField: '_id',
        as: 'singers'
      }
    },
    {
      // Lookup for writers
      $lookup: {
        from: 'artists',
        localField: 'writers',
        foreignField: '_id',
        as: 'writers'
      }
    },
    {
      // Lookup for featureArtists
      $lookup: {
        from: 'artists',
        localField: 'featureArtists',
        foreignField: '_id',
        as: 'featureArtists'
      }
    },
    {
      $match: {
        ...basicFilter,
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { albumName: { $regex: keyword, $options: "i" } },
          { 'singers.name': { $regex: keyword, $options: "i" } },
          { 'writers.name': { $regex: keyword, $options: "i" } },
          { 'featureArtists.name': { $regex: keyword, $options: "i" } }
        ]
      }
    }
  ];


  // Only add sort, skip, and limit if they are needed
  if (Object.keys(sortOptions).length > 0) {
    pipeLine.push({ $sort: sortOptions });
  }

  if (skip > 0) {
    pipeLine.push({ $skip: skip });
  }

  if (limit > 0) {
    pipeLine.push({ $limit: limit });
  }

  return pipeLine;
}

const searchQueryForAdmin = async (query, keyword, type) => {
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
          throw new Error('Artist Not Found!');
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
    const {title, singers, featureArtists, writers, majorKey, albumName, lyricsPhoto, genre, youTubeLink, tier} = req.body;

    // Collect all unique artist IDs
    let allArtists = [
      ...(Array.isArray(writers) ? writers : []),
      ...(Array.isArray(singers) ? singers : []),
      ...(Array.isArray(featureArtists) ? featureArtists : [])
    ];
    
    allArtists = [...new Set(allArtists)];
    
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
      youTubeLink, tier
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

    let {title, singers, featureArtists, writers, majorKey, albumName, genre, youTubeLink, tier} = req.body;

    // Collect all unique artist IDs
    let allArtists = [
      ...(Array.isArray(writers) ? writers : []),
      ...(Array.isArray(singers) ? singers : []),
      ...(Array.isArray(featureArtists) ? featureArtists : [])
    ];
    
    allArtists = [...new Set(allArtists)];
    
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
      return res.status(404).json({ errors: [{ message: "No Lyrics Found" }] });
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

    if(!featureArtists) {
       featureArtists = []
    }

    if(!writers) {
      writers = []
    }

    const updatedLyrics = await Lyrics.findByIdAndUpdate(id, 
      {title, singers, featureArtists, writers, majorKey, albumName, lyricsPhoto: lyricsPhoto, genre, youTubeLink, tier},
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


const changeEnableFlag = async (req, res) => {
  const id = req.params.id;

  try {
    const lyrics = await Lyrics.findById(id);

    if(!lyrics) {
      return res.status(404).json({ errors: [{ message: "No Lyrics Found" }] });
    }

    lyrics.isEnable = !lyrics.isEnable
    await lyrics.save();

    return res.status(200).json({lyrics: lyrics})
  }catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}]}) 
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

    let lyrics = await Lyrics.findById(id).populate('singers').populate('writers').populate('featureArtists');
    if(!lyrics) {
      return res.status(400).json({error: "Lyrics Not Found"})
    }

    if(!lyrics.isEnable) {
      return res.status(400).json({error: "This Lyrics has been disabled!"})
    }

    const user = await User.findById(req.user?.id);
    if (!user || user.role !== 'admin') {
      lyrics.viewCount += 1;
      await lyrics.save();
    }

    let collections = [];
    if(req.user) {
      collections = await Collection.find({
        lyricsId: lyrics._id,
        userId: req.user.id
      })
    }

    lyrics = lyrics.toObject()
    if(collections.length > 0) {
      lyrics.isFavourite = true;
    } else {
      lyrics.isFavourite = false;
    }

    return res.status(200).json({
      lyrics
    })
  }catch (err) {
    res.status(500).json({error: err.message})
  }
}


const searchLyrics = async (req,res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  let basicFilter = {};
  basicFilter.isEnable = true;
      
  // Build sort object
  let sortOptions = {};
  sortOptions = await generateSortOption();

  const {keyword} = req.query

  try {
    
    const pipeLine = await searchQuery(basicFilter, keyword, sortOptions, skip, limit)
    const countPipeLine = await searchQuery(basicFilter, keyword, {}, 0, 0);
    const lyrics = await Lyrics.aggregate(pipeLine)
    const countResults = await Lyrics.aggregate([
      ...countPipeLine,
      { $count: "total" }
    ])

    const totalCount = countResults[0]?.total || 0;

    let lyricsList = []

    let currentUser;
    if(req.user) {
      currentUser = await User.findById(req.user.id);
      if(currentUser && (currentUser.role == 'premium-user' || currentUser.role == 'admin') ) {
      for(let lyricsData of lyrics) {
        // lyricsData = lyricsData.toObject();
        let collection = await Collection.find({
          lyricsId: lyricsData._id,
          userId: req.user.id
        })
        if(collection.length > 0) {
          lyricsData.isFavourite = true
        } else {
          lyricsData.isFavourite = false
        }

        lyricsList.push(lyricsData)
      }
      } else if (currentUser && currentUser.role == 'free-user') {
        for(let lyricsData of lyrics) {
          let collection = await Collection.find({
            lyricsId: lyricsData._id,
            userId: req.user.id,
            group: "Default"
          })

          if(collection.length > 0) {
            lyricsData.isFavourite = true
          } else {
            lyricsData.isFavourite = false
          }

          lyricsList.push(lyricsData)
        }
      } 
    } else {
      lyricsList = lyrics.map(lyricsData => (
        {
          // ...lyricsData.toObject(),
          ...lyricsData,
          isFavourite: false
        }
      ))
    }

    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
      lyrics: lyricsList
    })
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message }]})
  }
}

const searchLyrics_WithTypes_BK = async (req,res) => {
  const {type} = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  let query = { isEnable: true };

  const sortBy = req.query.sortBy || 'viewCount';
  
  let sortingOrder;
  sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
      
  // Build sort object
  const sortOptions = {};
  sortOptions[sortBy] = sortingOrder;

  const allowdTypes = ['lyrics','singer','writer','key','all'];

  if(!allowdTypes.includes(type)) {
    return res.status(400).json({errors: [
      {message: 'Type not allowed!' }]})
  }

  const {keyword} = req.query

  try {
    
    query = await searchQuery(query, keyword, type)

    if(type == 'writer' || type == 'singer') {
      await addSearchCount(keyword)
    }
    const lyrics = await Lyrics.find(query).sort(sortOptions).skip(skip).limit(limit).populate('singers').populate('writers').populate('featureArtists');
    const totalCount = await Lyrics.countDocuments(query)

    let lyricsList = []
    if(req.user) {
      for(let lyricsData of lyrics) {
        lyricsData = lyricsData.toObject();
        let collection = await Collection.find({
          lyricsId: lyricsData._id,
          userId: req.user.id
        })
        if(collection.length > 0) {
          lyricsData.isFavourite = true
        } else {
          lyricsData.isFavourite = false
        }

        lyricsList.push(lyricsData)
      }
    } else {
      lyricsList = lyrics.map(lyricsData => (
        {
          ...lyricsData.toObject(),
          isFavourite: false
        }
      ))
    }

    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
      lyrics: lyricsList
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
    const countForPremiumTier = await Lyrics.countDocuments({tier: 2})
    const countForFreeTier = await Lyrics.countDocuments({tier: 1})
    const countForGuestTier = await Lyrics.countDocuments({tier: 0}) 

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
      enabledCount,
      countForPremiumTier,
      countForFreeTier,
      countForGuestTier
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

    let lyricsList = [];
    if(req.user) {
      for(let lyricsData of topLyrics) {
        lyricsData = lyricsData.toObject();
        let collection = await Collection.find({
          lyricsId: lyricsData._id,
          userId: req.user.id
        })
        if(collection.length > 0) {
          lyricsData.isFavourite = true
        } else {
          lyricsData.isFavourite = false
        }
        lyricsList.push(lyricsData)
      }
    } else {
      lyricsList = topLyrics.map(lyricsData => (
        {
          ...lyricsData.toObject(),
          isFavourite: false
        }
      ))
    }

    return res.status(200).json({topLyrics: lyricsList})
  } catch (err) {
    return res.status(500).json({errors: [
      {message: err.message}
    ]})
  }
}


const getLyricsByArtist = async (req, res) => {
  try {
    const {artistId, keyword} = req.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page -1) * limit;
    const sortBy = req.query.sortBy || 'title';
    // ascending order
    const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
        
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortingOrder;
    let query = {
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
    if(keyword) {
      query.$and.push({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { albumName: { $regex: keyword, $options: "i" } }
        ]
      })
    }

    const lyrics = await Lyrics.find(query)
                          .collation({ locale: 'en', strength: 1 })
                          .sort(sortOptions)
                          .skip(skip).limit(limit)
                          .populate('singers').populate('writers')
                          .populate('featureArtists');
    const totalCount = await Lyrics.countDocuments(query)


    let lyricsList = [];
    if(req.user) {
      for(let lyricsData of lyrics) {
        lyricsData = lyricsData.toObject();
        let collection = await Collection.find({
          lyricsId: lyricsData._id,
          userId: req.user.id
        })
        if(collection.length > 0) {
          lyricsData.isFavourite = true
        } else {
          lyricsData.isFavourite = false
        }
        lyricsList.push(lyricsData)
      }
    } else {
      lyricsList = lyrics.map(lyricsData => (
        {
          ...lyricsData.toObject(),
          isFavourite: false
        }
      ))
    }

    return res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount, lyrics: lyricsList
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

    const sortBy = req.query.sortBy || 'title';
    // ascending order
    const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
            
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortingOrder;
    const query = {
      $or: [
        {singers: artistId},
        {writers: artistId},
        {featureArtists: artistId}
      ]
    }
    const lyrics = await Lyrics.find(query)
                            .collation({ locale: 'en', strength: 1 })
                            .sort(sortOptions)
                            .skip(skip).limit(limit).populate('singers')
                            .populate('writers').populate('featureArtists');
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

// const searchLyricsByAdmin = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page -1) * limit;
//   const sortBy = req.query.sortBy || 'viewCount';

//   // Build sort object
//   let sortOptions = {};
//   sortOptions = await generateSortOption(req.user);

//   const isEnable = req.query.isEnable;
//   let basicFilter = {}
//   if(isEnable != undefined) {
//     basicFilter.isEnable = (isEnable === 'true') ? true : false;
//   } 

//   const {keyword} = req.query
//   try {
//     const pipeLine = await searchQuery(basicFilter, keyword, sortOptions, skip, limit)

//     const countPipeLine = await searchQuery(basicFilter, keyword, {}, 0, 0);
//     const lyrics = await Lyrics.aggregate(pipeLine)
//     const countResults = await Lyrics.aggregate([
//       ...countPipeLine,
//       { $count: "total" }
//     ])

//     const totalCount = countResults[0]?.total || 0;

//     return res.status(200).json({
//       totalPages: Math.ceil(totalCount / limit),
//       currentPage: page,
//       totalCount,
//       lyrics
//     })
//   } catch (err) {
//     return res.status(500).json({errors: [
//       {message: err.message}]})
//   }
// }


const searchLyricsByAdmin = async (req, res) => {
  const {type} = req.query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page -1) * limit;
  const sortBy = req.query.sortBy || 'viewCount';
  // ascending order
  const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
      
  // Build sort object
  const sortOptions = {};
  sortOptions[sortBy] = sortingOrder;
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
    query = await searchQueryForAdmin(query, keyword, type)

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
      {message: err.message}]})
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

const generateSortOption = async () => {

  let sortOptions = {
      tier: 1,
      createdAt: -1 
    };

  return sortOptions;
}

const checkLyricsExist = async(req, res) => {
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ errors: [{ message: "Name is required!" }] });
  }

  try {
    const normalizeKeyword = keyword.replace(/\s+/g, '').toLowerCase();
    
    const existingLyrics = await Lyrics.aggregate([
        {
            $addFields: {
                normalizeTitle: { 
                    $toLower: {
                        $replaceAll: {
                            input: '$title',
                            find: " ",
                            replacement: ""
                        }
                    }
                }
            }
        },
        {
            $match: {
                normalizeTitle: normalizeKeyword
            }
        },
        {
            $limit: 1
        }
    ])
    if (existingLyrics.length > 0) {
        return res.status(200).json({ isExist: true });
    } else {
        return res.status(200).json({ isExist: false });
    }
} catch (err) {
    res.status(500).json({errors: [
        {message: err.message }]});
}
}

module.exports = {
  createLyrics, updateLyricsById, 
  changeEnableFlag,
  getLyricsOverview, getLyricsId, 
  deleteLyrics, searchLyrics, 
  getTopLyrics,
  getLyricsByArtist, getLyricsByArtistByAdmin, getAllLyrics,
  searchLyricsByAdmin, getLyricsCountByArtist,
  checkLyricsExist
}