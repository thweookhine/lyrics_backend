const mongoose = require('mongoose')
const validator = require('validator')

const LyricsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required!']
    },
    artist: {
        type: String,
        required: [true, 'Artist is required!']
    },
    featureArtist: {
        type: String
    },
    writer: {
        type: String,
        required: [true, 'Writer is required!']
    },
    majorKey: {
        type: String,
        required: [true, 'Major Key is required!']
    },
    viewCount: {
        type: Number,
        default: 0
    },
    lyricsPhoto: { 
        type: Buffer, 
        required: true }, 
}, {timestamps: true});

const Lyrics = mongoose.model('Lyrics', LyricsSchema);

module.exports = Lyrics
