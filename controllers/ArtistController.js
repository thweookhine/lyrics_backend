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

}

const getAllArtists = async(req,res) => {
    try {
        const artistList = await Artist.find().sort({searchCount: -1});
        return res.status(200).json({artistList})
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

module.exports = {createArtist, updateArtist, deleteArtistById, getAllArtists, getTopArtists}