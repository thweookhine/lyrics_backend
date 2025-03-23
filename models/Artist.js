const { default: mongoose } = require("mongoose");

const ArtistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!']
    },
    bio: {
        type: String,
    },
    photoLink: {
        type: String
    },
    searchCount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['artist', 'writer', 'both'],
        default: 'artist'
    },
    lyrics: [
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Lyric'}
    ]
}, {
    timestamps: true
})

const Artist = mongoose.model('Artist', ArtistSchema);

module.exports = Artist