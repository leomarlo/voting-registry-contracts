

let durations = {
    "snap": 180,  // 3 minutes
    "short": 1800,  // 30 minutes
    "medium": 86400,  // 1 day
    "long": 432000,  // 5 days
    "veryLong": 1209600  // 14 days (2 weeks)
}


let types :{ [key: string]: { [key: string]: string | number | boolean }  }  = {
    "changeMetaParameters": {
        "security": "secure",
        "duration": durations.long,
        "badgeWeightedVote": true}, 
    "changeAssignedContract": {
        "security": "secure",
        "duration": durations.medium,
        "badgeWeightedVote": true}, 
    "setMainBadge":{
        "security": "secure",
        "duration": durations.veryLong,
        "badgeWeightedVote": true}, 
    "setMinXpToStartAnything":{
        "security": "secure",
        "duration": durations.long,
        "badgeWeightedVote": true}, 
    "setMinXpToStartThisFunction":{
        "security": "secure",
        "duration": durations.long,
        "badgeWeightedVote": true}, 
    "setEnableTradingThreshold":{
        "security": "secure",
        "duration": durations.long,
        "badgeWeightedVote": true},  
    "setTradingEnabledGlobally":{
        "security": "secure",
        "duration": durations.long,
        "badgeWeightedVote": true}, 
    "setAcceptingNFTs":{
        "security": "open",
        "duration": durations.long,
        "badgeWeightedVote": true},
    "changeCounter":{
        "security": "open",
        "duration": durations.snap,
        "badgeWeightedVote": true},
    "changeOperation": {
        "security": "open",
        "duration": durations.medium,
        "badgeWeightedVote": false},
    "newIncumbent": {
        "security": "open",
        "duration": durations.medium,
        "badgeWeightedVote": true},
    "deployNewBadge": {
        "security": "open",
        "duration": durations.medium,
        "badgeWeightedVote": true},
    "deployNewContract": {
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": false},
    "sendNFT": {
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": true},
    "sendERC20Token":{
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": true},
    "approveNFT": {
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": true},
    "approveERC20Token": {
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": true},
    "wildCard": {
        "security": "open",
        "duration": durations.short,
        "badgeWeightedVote": true},
    }

export {
    durations,
    types,
}
    