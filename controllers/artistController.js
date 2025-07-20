const { default: mongoose } = require("mongoose");
const Artist = require("../models/Artist");
const Lyrics = require("../models/Lyrics");
const User = require("../models/User");
const { normalizeEmail } = require("validator");

const createArtist = async(req,res) => {
    const {name, bio, photoLink, type} = req.body;
    
    try {
        const artist = new Artist({
            name, bio, photoLink, type
        })
    
        await artist.save();
        return res.status(201).json({artist})
    } catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const updateArtist = async(req,res) => {
    const {name, bio, photoLink, type} = req.body;
    const id = req.params.id;
    if(!id) {
        return res.status(400).json({errors: [
                {message: "ID is required to update artist!"}]})
    }
    try {
        const updatedArtist = await Artist.findByIdAndUpdate(id,{name, bio,photoLink,type},{new: true})
        if(!updatedArtist) {
            return res.status(400).json({errors: [
                {message: "No Artist Found"}]})
        }

        return res.status(200).json({artist: updatedArtist})

    } catch(err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const deleteArtistById = async(req,res) => {
    const id = req.params.id;
    if(!id) {
        return res.status(400).json({errors: [
                {message: "ID is required to delete artist"}]})
    }

    try {
        const existingArtist = await Artist.findById(id);
        if(!existingArtist) {
            return res.status(400).json({errors: [
                {message: "No Artist Found"}]})
        }

        const query = {
            $or:[
                {singers: id},
                {featureArtists: id},
                {writers: id}
            ]
        }

        const lyricsCount = await Lyrics.countDocuments(query)

        if(lyricsCount > 0) {
            return res.status(400).json({errors: [
                {message: "Can't Delete this Artist!"}]})
        }

        await Artist.findByIdAndDelete(id)
        return res.status(200).json({message: "Successfully Deleted!"});

    }catch(err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const getArtistById = async (req,res) => {
    const id = req.params.id;

    try {
        let artist =  await Artist.findById(id);
        if(!artist) {
            return res.status(400).json({errors: [
                {message: "No Artist Found!"}]})
        }

        const user = await User.findById(req.user?.id);
        if (!user || user.role !== 'admin') {
            artist.searchCount += 1;
            await artist.save();
        }

        return res.status(200).json(artist)
    } catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const searchArtists = async (req, res) => {

    const {keyword, type} = req.query

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'name';
    // ascending order
    const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
        
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortingOrder;

    let query = {}

    if(keyword) {
        query.name = { $regex: keyword, $options: "i" };
    } 

    // if(type) {
    //     query.type =  { $in: [type, "both"] }
    // }

      if(type) {
        query.type =  { $in: [type] }
    }

    try {
        const artists = await Artist.find(query)
                    .collation({ locale: 'en', strength: 1 })
                    .sort(sortOptions)        
                    .skip(skip).limit(limit);
        const totalCount = await Artist.countDocuments(query);
        const totalArtistCount = await Artist.countDocuments({...query, type: 'singer'})
        const totalWrtierCount = await Artist.countDocuments({...query, type: 'writer'})
        const totalBothCount = await Artist.countDocuments({...query, type: 'both'})

        return res.status(200).json({
            artists,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount, totalArtistCount, totalWrtierCount, totalBothCount
        })
    } catch(err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const getTopArtists = async (req,res) => {
    try{
        const topArtists = await Artist.find({searchCount: { $gt: 0 } }).sort({searchCount: -1}).limit(10);
        return res.status(200).json({topArtists});
    } catch(err) {
            return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const getArtistsByType = async (req,res) => {
    try {
        const type = req.query.type;
        const sortBy = req.query.sortBy || 'name';
        // ascending order
        const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
            
        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortingOrder;

        const artists = await Artist.find({})
                            .collation({ locale: 'en', strength: 1 })
                            .sort(sortOptions)
                            .select('name')
                            .select('type');
        return res.status(200).json({artists})
    } catch (err) {
        return res.status(500).json({errors: [
            {message: err.message}]})
    }
}

// const getArtistsByType = async (req,res) => {
//     try {
//         const type = req.query.type;
//         const sortBy = req.query.sortBy || 'name';
//         // ascending order
//         const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
            
//         // Build sort object
//         const sortOptions = {};
//         sortOptions[sortBy] = sortingOrder;

//         const query = { type: { $in: [type] } };
//         const artists = await Artist.find(query)
//                             .collation({ locale: 'en', strength: 1 })
//                             .sort(sortOptions)
//                             .select('name')
//                             .select('type');
//         return res.status(200).json({artists})
//     } catch (err) {
//         return res.status(500).json({errors: [
//             {message: err.message}]})
//     }
// }

const getArtistOverview = async(req, res) => {
    try {
        const totalCount = await Artist.countDocuments();
        const totalSingerCount = await Artist.countDocuments({type: 'singer'})
        const totalWriterCount = await Artist.countDocuments({type: 'writer'})
        const totalBothCount = await Artist.countDocuments({type: 'both'})

        const now = new Date();

        // Getting count of previous month
        const lastPrevDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const prevCount = await Artist.countDocuments({
            createdAt: {$lt: lastPrevDay}
        })

        const countDiff = totalCount - prevCount;

        return res.status(200).json({
            totalCount, totalSingerCount,
            totalWriterCount, totalBothCount,
            countDiff
        })

    } catch (err) {
        res.status(500).json({errors: [
            {message: err.message }]});
    }
}

const checkArtistExists = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ errors: [{ message: "Name is required!" }] });
        }

        const normalizeKeyword = keyword.replace(/\s+/g, '').toLowerCase();

        const existingArtist = await Artist.aggregate([
            {
                $addFields: {
                    normalizeName: { 
                        $toLower: {
                            $replaceAll: {
                                input: '$name',
                                find: " ",
                                replacement: ""
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    normalizeName: normalizeKeyword
                }
            },
            {
                $limit: 1
            }
        ])
        if (existingArtist.length > 0) {
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
    createArtist, updateArtist, 
    deleteArtistById, searchArtists, 
    getArtistById, getTopArtists, 
    getArtistsByType, getArtistOverview,
    checkArtistExists
}