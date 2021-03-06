const express = require('express');
const path = require('path')
const translate = require('translate');
const googleTrends = require('google-trends-api');
const databaseHandler = require('./utils/databaseHandler');
const {CONSTANTS} = require('./Constants');

if(process.argv[2] == 'production') {
    CONSTANTS.ISLOCALENVIRONMENT = false
} else {
    CONSTANTS.ISLOCALENVIRONMENT = true
}

const trackIP = true;
var IPtrackingInProgress = false;

const app = express();
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    next()
  });

app.use((req, res, next) => {
    //Logging
    console.log('Log');
    if(trackIP && !IPtrackingInProgress) {
        IPtrackingInProgress = true;
        databaseHandler.connectMongoClient(() => {
            databaseHandler.log.ip(req.ip, () => {
                trackIP = false;
                IPtrackingInProgress = false;
            });
        })
    }
    next();
})

const parentDirectoryPath = path.join(__dirname, '../src/views')
app.use(express.static(parentDirectoryPath))

app.get('', (req, res) => {
    console.log(__dirname);
    res.sendFile('./views/mainPage/', { root: __dirname });
})
app.set('etag', false)

app.get('/store', (req, res) => {
    //Fetch data from public database and store in the private database
    databaseHandler.connectMongoClient(() => {
        databaseHandler.tumblr.fetchTumblrDataForaTimeStamp(req.query, () => {
            res.send('success');
        })
        // databaseHandler.tumblr.fetchTumblrData(req.query.tag,req.query.days, () => {
        //     res.send('success');
        // });
    })
})

app.get('/searchFromPrivateData', (req, res) => {
    //Fetch data from private database
    databaseHandler.connectMongoClient(() => {
        databaseHandler.tumblr.searchTumblrData((data) => {
            res.send(data);
        });
    })
})

app.get('/clearData', (req, res) => {
    databaseHandler.connectMongoClient(() => {
        databaseHandler.tumblr.clearTumblrData(() => {
            res.send('success')
        })
    })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
    console.log('Server is up and running on '+port)
})

//Google trends module test
// googleTrends.interestOverTime({keyword: 'Women\'s march'})
// .then(function(results){
//   console.log('Results', JSON.stringify(results));
// })
// .catch(function(err){
//   console.error('Oh no there was an error', err);
// });