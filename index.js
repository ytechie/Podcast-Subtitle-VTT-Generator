require('./settings.js');

//const vindexer = require('./vi.js');
const vindexer = require("video-indexer");

const fs = require('fs');
const path = require('path');

if(!vindexerKey) {
    console.log('You must create a settings.js file and declare vindexerKey');
    process.exit();
}

const Vindexer = new vindexer(vindexerKey);

//processingComplete('50cb0d3072');

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

    processFile(matched[0]);
}

function processFile(fileName) {
    console.log(`Found ${fileName}`);

    Vindexer.uploadVideo({
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
    })//.then(function(videoId) { downloadSubtitles(videoId) })
    .then( function(videoId) {
        checkProcessingStatus(videoId);
    });
}

function checkProcessingStatus(videoId, previousPercent) {
    Vindexer.getProcessingState(videoId).then(function (result) {
        //console.log(result.body);
        //console.log('checking status for '+ videoId);
        //console.log('Prev percent: ' + previousPercent);

        //console.log('I got ' + previousPercent);
        
        let percent = 0;

        if(!previousPercent && previousPercent !== 0) {
            previousPercent = -1;
        }
        if(result) {
            //first call
            var resultObj = JSON.parse(result.body);
            //console.log(result.body);
            let percentString = resultObj.progress;

            if(resultObj.state === 'Processed') {
                percent = 100;
            } else if(resultObj.ErrorType) {
                //Occasionally the service isn't fast enough to reply after uploading
                console.log(`Server reported error, assuming 0% processed. Error: ${resultObj.ErrorType}`)
                percent = 0;
            } else if(percentString.length > 0) {
                percent = parseInt(percentString.substring(0, percentString.length - 1));
            }
        }        
        
        //console.log(percentString);

        //console.log(percent + '% ' + previousPercent + '(prev)');
        if(percent !== previousPercent) {
            console.log(percent + '% Complete');
        }
        
        if(percent === 100) {
            processingComplete(videoId);
        } else {
            //console.log('Calling with percent ' + percent);
            setTimeout(function() { checkProcessingStatus(videoId, percent); }, 3000);
        }
    });
}


function processingComplete(videoId) {
    Vindexer.getVttUrl(videoId).then(function (result) {
        return Vindexer.downloadVtt(result.body.substring(1, result.body.length - 1)); 
        //console.log(result.body);
    }).then(function(vtt) {
        fs.writeFileSync('subtitles.vtt', vtt.body, 'utf8');
        console.log('Subtitles Complete!');
    });
    //.then(Vindexer.deleteBreakdown(videoId).then(function() { console.log('Remote file deleted'); });
    //})
}

/*
function downloadSubtitles(videoId) {
    console.log('Retrieving subtitles for video ID ' + videoId);
    Vindexer.getVttUrl(videoId)
        .then( function(result){ console.log ('VTT:' + result.body) } );
}
*/


