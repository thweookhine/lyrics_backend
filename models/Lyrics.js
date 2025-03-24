const mongoose = require('mongoose')
const validator = require('validator');
const { genreArray, keyList, genreList } = require('../utils/Constants');

const LyricsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required!']
    },
    artists: [{
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
        required: [true, 'Writer is required!']
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
}, {timestamps: true});

const Lyrics = mongoose.model('Lyrics', LyricsSchema);

module.exports = Lyrics
