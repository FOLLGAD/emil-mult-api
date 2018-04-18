const express = require("express");
const app = express();

const url = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

const MongoClient = require('mongodb').MongoClient;

let exampleScore = {
    name: "Beep boop",
    time: 31.23,
    max: 9,
    min: 1
}

MongoClient.connect(url, function (err, client) {
    console.assert(err == null);

    const db = client.db(dbName);
    const scoreboard = db.collection('scoreboard')

    app.get('/scoreboard', (req, res) => {
        scoreboard.find()
            .limit(10)
            .sort({ time: 1 })
            .toArray()
            .then(arr => {
                console.log(arr)
            })
    })
    app.post('/score', (req, res) => {
        console.log(req.body)
    })
});