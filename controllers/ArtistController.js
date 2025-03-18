const Artist = require("../models/Artist");

const createArtist = async(req,res) => {
    const {name, photoLink} = req.body;
    
    try {
        const artist = new Artist({
            name, photoLink
        })
    
        await artist.save();
        return res.status(201).json({artist})
    } catch (err) {
        return res.status(500).json({error: err.msg})
    }
}

const updateArtist = async(req,res) => {
    const {name, photoLink} = req.body;
    const id = req.params.id;
    if(!id) {
        return res.status(400).json({error: "ID is required to update artist!"})
    }
    try {
        const existingArtist = await Artist.findById(id);
        if(!existingArtist) {
            return res.status(400).json({error: "No Artist Found"})
        }

        existingArtist.name = name;
        existingArtist.photoLink = photoLink;

        await existingArtist.save();

        return res.status(200).json({existingArtist})

    } catch(err) {
        return res.status(500).json({error: err.msg})
    }
}

const deleteArtistById = async(req,res) => {
    const id = req.params.id;
    if(!id) {
        return res.status(400).json({error: "ID is required to delete artist"})
    }

    try {
        const existingArtist = await Artist.findById(id);
        if(!existingArtist) {
            return res.status(400).json({error: "No Artist Found"})
        }

        await Artist.findByIdAndDelete(id)

        return res.status(200).json({message: "Successfully Deleted!"});

    }catch(err) {
        return res.status(500).json({error: err.msg})
    }
}

const addSearchCount = async (req,res) => {
    const id = req.params.id;
    if(!id) {
        return res.status(400).json({error: "ID is required!"})
    }

    try {
        const artist = await Artist.findById(id);
        if(!artist) {
            return res.status(400).json({error: "No Artist found!"})
        }

        artist.searchCount = artist.searchCount + 1;
        await artist.save();
        return res.status(200).json({})
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const getArtistById = async (req,res) => {
    const id = req.params.id;

    try {
        const artist = await Artist.findById(id);
        if(!artist) {
            return res.status(400).json({error: "No Artist Found!"})
        }

        return res.status(200).json(artist)
    } catch (err) {
        return res.status(500).json({error: err.msg})
    }
}

const searchArtists = async (req, res) => {

    const keyword = req.query.keyword;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {}

    if(keyword) {
        query = {
            $or: [
                {name: {$regex: keyword, $options: "i"}}
            ]
        };
    } 

    try {
        const artists = await Artist.find(query).skip(skip).limit(limit);
        const totalCount = await Artist.countDocuments(query);

        return res.status(200).json({
            artists,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        })
    } catch(err) {
        return res.status(500).json({error: err.msg})
    }
}

const getTopArtists = async (req,res) => {
    try{
        const topArtists = await Artist.find.sort({searchCount: -1}).limit(10);
        return res.status(200).json({topArtists});
    }   catch(err) {
            return res.status(500).json({error: err.msg})
    }
}

module.exports = {createArtist, updateArtist, deleteArtistById, searchArtists, getArtistById, getTopArtists, addSearchCount}