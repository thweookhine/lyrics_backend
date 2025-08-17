
const genreList = [
    'Pop', 'Rock', 'Hip-Hop', 'Classical', 'Jazz', 'Electronic', 'R&B', 
    'Country', 'Reggae', 'Blues', 'Rock N Roll', 'None'
]

// const keyList = ["A","B","C","D","E","F","G","Ab","Bb","Db","Eb","Gb","Am","Bm","Cm","Dm","Em","Fm","Gm","Abm","Bbm","Dbm","Ebm","Gbm"]
// const keyList = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const keyList = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#",
    "Ab", "Bb", "Db", "Eb", "Gb", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Abm", 
    "Bbm", "Dbm", "Ebm", "Gbm", "None"]

const tierList = [0,1,2]

const paymentTypes = ['KPay', 'AYAPay', 'WaveMoney']

const PREMIUM_DURATION_DEFAULT = 3; 

module.exports = {genreList, keyList, 
    tierList, PREMIUM_DURATION_DEFAULT,
    paymentTypes}