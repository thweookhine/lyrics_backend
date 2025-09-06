
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

const PREMIUM_DURATION_0 = 0;

const APPROVE_SHEET_NAME = 'Approved';
const REJECT_SHEET_NAME = 'Rejected';

const ADMIN_ROLE = 'admin';

const LOGIN_REMEMBER_DAYS_30 = '30d'
const LOGIN_REMEMBER_DAYS_1 = '1d'

const FREE_USER_COLLECTION_LIMIT = 20;
const COLLECTION_COUNT_LIMIT = 20;
const LYRICS_PER_COLLECTION_LIMIT = 20;

module.exports = {genreList, keyList, 
    tierList, PREMIUM_DURATION_DEFAULT,
    paymentTypes, PREMIUM_DURATION_0,
    APPROVE_SHEET_NAME, REJECT_SHEET_NAME,
    ADMIN_ROLE, LOGIN_REMEMBER_DAYS_30,
    LOGIN_REMEMBER_DAYS_1,
    FREE_USER_COLLECTION_LIMIT,
    COLLECTION_COUNT_LIMIT,
    LYRICS_PER_COLLECTION_LIMIT
}