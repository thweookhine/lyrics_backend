const mongoose = require('mongoose')
const validator = require('validator');
const { genreArray, keyList, genreList, tierList } = require('../utils/Constants');

const LyricsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required!']
    },
    singers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: [true, 'Artist is required!']
    }],
    featureArtists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],
    writers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
    }],
    majorKey: {
        type: String,
        enum: keyList,
        required: [true, 'Major Key is required!']
    },
    viewCount: {
        type: Number,
        default: 0
    },
    albumName: {
        type: String
    },
    lyricsPhoto: { 
        type: String, 
        required: [true, 'LyricsPhoto is required!']
    },
    genre: {
        type: [String], 
        enum: genreList,
        required: [true, 'Genre is required!']
    },
    isEnable: {
        type: Boolean,
        default: true
    },
    youTubeLink: {
        type: String
    },
    tier: {
        type: String,
        enum: tierList,
        default: 2,
    },
}, {timestamps: true});

const Lyrics = mongoose.model('Lyrics', LyricsSchema);

module.exports = Lyrics
