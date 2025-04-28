const { default: mongoose } = require("mongoose");
const Artist = require("../models/Artist");
const Lyrics = require("../models/Lyrics");

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
        const artist = await Artist.findById(id);
        if(!artist) {
            return res.status(400).json({errors: [
                {message: "No Artist Found!"}]})
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

    let query = {}

    if(keyword) {
        query.name = { $regex: keyword, $options: "i" };
    } 

    if(type) {
        query.type =  { $in: [type, "both"] }
    }

    try {
        const artists = await Artist.find(query).skip(skip).limit(limit);
        const totalCount = await Artist.countDocuments(query);
        const totalArtistCount = await Artist.countDocuments({...query, type: 'artist'})
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

// const getArtistIdAndNames = async (req,res) => {
//     try{
//         const artists = await Artist.find().select('name');
//         return res.status(200).json({artists});
//     } catch(err) {
//         return res.status(500).json({errors: [
//                 {message: err.message}]})
//     }
// }

const getArtistsByType = async (req,res) => {
    try {
        const type = req.query.type;
        const query = { type: { $in: [type, "both"] } };
        const artists = await Artist.find(query).select('name').select('type');
        return res.status(200).json({artists})
    } catch (err) {
        return res.status(500).json({errors: [
            {message: err.message}]})
    }
}

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

module.exports = {createArtist, updateArtist, deleteArtistById, searchArtists, getArtistById, getTopArtists, getArtistsByType, getArtistOverview}