const { default: mongoose } = require("mongoose");

const CollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'userId is required!']
  },
  lyricsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lyrics',
    require: [true, 'lyricsId is required!']
  },
  group: {
    type: String,
    default: 'Default'
  }
},{timestamps: true})

const Collection = mongoose.model('Collection', CollectionSchema);

module.exports = Collection