const { default: mongoose } = require("mongoose");

const ArtistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!']
    },
    photoLink: {
        type: String,
        required: [true, 'Photo Link is required!']
    },
    searchCount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['artist', 'writer', 'both'],
        default: 'artist'
    }
}, {
    timestamps: true
})

const Artist = mongoose.model('Artist', ArtistSchema);

module.exports = Artist