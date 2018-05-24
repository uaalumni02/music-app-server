var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var cors = require('cors');
var url = require('url');
var app = express();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

var options = {
    host: 'us-cdbr-iron-east-05.cleardb.net',
    port: 3306,
    user: 'b58d5e528a794c',
    password: '53a65f7d',
    database: 'heroku_82bb795e42c0141',
    autoReconnect: true,// Whether or not to re-establish a database connection after a disconnect. 
    reconnectDelay: [
        500,// Time between each attempt in the first group of reconnection attempts; milliseconds. 
        1000,// Time between each attempt in the second group of reconnection attempts; milliseconds. 
        5000,// Time between each attempt in the third group of reconnection attempts; milliseconds. 
        30000,// Time between each attempt in the fourth group of reconnection attempts; milliseconds. 
        300000// Time between each attempt in the fifth group of reconnection attempts; milliseconds. 
    ],
    useConnectionPooling: false,// Whether or not to use connection pooling. 
    reconnectDelayGroupSize: 5,// Number of reconnection attempts per reconnect delay value. 
    maxReconnectAttempts: 25,// Maximum number of reconnection attempts. Set to 0 for unlimited. 
    keepAlive: true,// Whether or not to send keep-alive pings on the database connection(s). 
    keepAliveInterval: 3000// How frequently keep-alive pings will be sent; milliseconds. 
};

var db = mysql.createConnection(options);

function connectDatabase() {
    db.connect((err) => {
        if (err) throw err;
        console.log('Database Connected');
    });
};
connectDatabase();

setInterval(function () {
    db.query('SELECT * FROM Music', () => {
        // console.log('Pinging Server');
    });
}, 3000)

// connectDatabase();

app.post('/api/music', (req, res) => {
    const isValidArtistName = (artist) => {
        var regExp = /^[a-z]{2,}$/i;
        return regExp.test(artist)
      }

      const isValidTitleName = (title) => {
        const regExp = /^[a-z]{2,}$/i;
        return regExp.test(title)
      }

      const isValidYear = (year) => {
        const regExp = /^(194[5-9]|19[5-9]\d|200\d|201[0-8])$/i;
        return regExp.test(year)
      }

      const isValidLink = (link) => {
        const regExp = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/i;
        return regExp.test(link)
      }

    const { artist, title, year, link } = req.body;

    var sql = `INSERT INTO Music (Artist, Title, Year, Link) VALUES ('${artist}', '${title}', ${Number(year)}, '${link}')`;
    if (isValidArtistName(artist) && isValidTitleName(title) && isValidYear(year) && isValidLink(link)) {
    return db.query(sql, (err, result) => {
        if (err) throw err
        return res.status(200)
            .json(req.body);       
    });

} else {
    return res.status(400).send('Bad job, check your inputs');
}
})

app.get('/api/music', (req, res) => {
    var sql = 'Select * FROM Music LIMIT 100'
    return db.query(sql, (err, result) => {
        const resultFormatted = result.map((media) => {
            const currentParsedUrl = url.parse(media.Link, true);
            media.Link = currentParsedUrl.query.v;
            return media
        })
        if (err) throw err
        return res.status(200)
            .json(resultFormatted);
    });
});

app.get('/api/music/:id', (req, res) => {
    const isValidID = (requestId) => {
        const regExp = /^[1-9]\d*$/;
        return regExp.test(requestId)
      }
    const requestId = req.params.id;

    const sql = `SELECT ID, Artist, Title, Year, Link FROM Music WHERE ID = ${requestId} LIMIT 1`;

    if(isValidID(requestId)) {
    return db.query(sql, (err, result) => {
        const resultFormatted = result.map((media) => {
            const currentParsedUrl = url.parse(media.Link, true);
            media.Link = currentParsedUrl.query.v;
            return media
        })
        if (err) throw err;
        return res.status(200)
            .json(resultFormatted);
    });

} else {
    return res.status(400).send('Bad job, check your inputs');
}
});


app.get('/api/music/search/:Name', (req, res) => {
    var requestArtist = req.query.q;
    var sql = "SELECT * from Music where Artist " + " LIKE '%" + requestArtist + "%'";
    return db.query(sql, (err, result) => {
        if (err) throw err
        return res.status(200)
            .json(result);
    });

});
app.listen(3000, () => console.log('server is running'));
