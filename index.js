const settings = require('./settings.js');

//const vindexer = require('./vi.js');
const vindexer = require("video-indexer");

const fs = require('fs');
const path = require('path');
const Promise = require("bluebird");

if(!settings.vindexerKey) {
    console.log('You must create a settings.js file and declare vindexerKey');
    process.exit();
}

const Vindexer = new vindexer(settings.vindexerKey);

findLocalFiles();

function findLocalFiles() {
    var allFiles = fs.readdirSync('.');
    var matched = [];

    for(let i=0;i<allFiles.length;i++) {
        var ext = path.extname(allFiles[i]);
        if(ext === '.wav') {
            matched.push(allFiles[i]);
        }
    }

    if(matched.length === 0) {
        console.error('No processable files found, exiting.');
        process.exit();
    }

    let promises = [];
    matched.forEach(function(match) {
        promises.push(processFile(match));
    });
    
    Promise.all(promises).then(function() {
        console.log('All files processed!');
    });
}

function processFile(fileName) {
    console.log(`Processing ${fileName}`);

    return Vindexer.uploadVideo({
        privacy: 'Private', 
        language: 'English', 
        externalId: 'customvideoid',
        description: 'Temporary File for Generating Subtitles',
        partition: 'subtitles',
        streamData: fs.createReadStream(fileName),
        fileName: fileName
    })
    .then( function(result){
        let videoId = result.body;
        //trim quotes
        videoId = videoId.substring(1, videoId.length - 1);

        console.log('Video uploaded, assigned ID: ' + videoId);
        return videoId;
    })
    .then(Vindexer.waitForProcessing)
    .then(Vindexer.getVttUrl)
    .then(function (result) {
            return Vindexer.downloadVtt(result.body.substring(1, result.body.length - 1)); 
    })
    .then(function (result) {
        return writeVttFile(fileName, result.body);
    })
    .then(function() { console.log(`${videoId} complete!`) });
}

function writeVttFile(fileName, vttContents) {
    return new Promise(function(resolve) {
        var vttName = path.basename(fileName, path.extname(fileName)) + '.vtt';
        fs.writeFile(vttName, vttContents, 'utf8', function() {
            console.log(`Subtitles written to ${vttName}`);
            resolve(fileName);
        });
    });
}