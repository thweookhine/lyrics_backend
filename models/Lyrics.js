const mongoose = require('mongoose')
const validator = require('validator')

const LyricsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required!']
    },
    artist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: [true, 'Artist is required!']
    }],
    featureArtist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],
    writer: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: [true, 'Writer is required!']
    }],
    majorKey: {
        type: String,
        enum: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
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
        enum: [
          'Pop', 'Rock', 'Hip-Hop', 'Classical', 'Jazz', 'Electronic', 'R&B', 'Country', 'Reggae', 'Blues'
        ],
        required: [true, 'Genre is required!']
      },
}, {timestamps: true});

const Lyrics = mongoose.model('Lyrics', LyricsSchema);

module.exports = Lyrics
