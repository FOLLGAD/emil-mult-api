const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const bodyParser = require("body-parser")
const app = express()

app.use(bodyParser.json())
app.use(morgan("tiny"))
app.use(cors())

const url = process.env.MONGO_URL,
    dbName = process.env.DB_NAME,
    port = process.env.PORT

const MongoClient = require('mongodb').MongoClient

let exampleScore = {
    name: "Beep boop",
    time: 31.23,
    max: 9,
    min: 1
}

MongoClient.connect(url).then(client => {
    const db = client.db(dbName)
    const scoreboard = db.collection('scoreboard')

    app.get('/scores', (req, res) => {
        scoreboard
            .find()
            .project({ name: 1, time: 1, max: 1, min: 1, created: 1, _id: 0 })
            .limit(req.query.l || 10)
            .sort({ time: 1 })
            .toArray()
            .then(arr => {
                res.json(arr)
            })
    })
    app.get('/scores/last', (req, res) => {
        scoreboard
            .find()
            .project({ name: 1, time: 1, max: 1, min: 1, created: 1, _id: 0 })
            .limit(req.query.l || 10)
            .sort({ created: 0 })
            .toArray()
            .then(arr => {
                res.json(arr)
            })
    })
    app.get('/scores/daily', (req, res) => {
        let today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        scoreboard
            .find({ created: { $gt: today } })
            .project({ name: 1, time: 1, max: 1, min: 1, created: 1, _id: 0 })
            .limit(req.query.l || 10)
            .sort({ time: 1 })
            .toArray()
            .then(arr => {
                res.json(arr)
            })
    })
    app.get('/scores/weekly', (req, res) => {
        let monday = new Date();
        monday.setHours(0);
        monday.setMinutes(0);
        monday.setSeconds(0);
        monday.setMilliseconds(0);

        var day = monday.getDay() || 7;
        if (day !== 1)
            monday.setHours(-24 * (day - 1));

        scoreboard
            .find({ created: { $gt: monday } })
            .project({ name: 1, time: 1, max: 1, min: 1, created: 1, _id: 0 })
            .limit(req.query.l || 10)
            .sort({ time: 1 })
            .toArray()
            .then(arr => {
                res.json(arr)
            })
    })
    app.post('/scores', (req, res) => {
        let b = req.body
        let doc = {
            time: b.time,
            name: b.name,
            max: b.max,
            min: b.min,
            created: new Date(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        }
        if (!doc.time) {
            res.status(400).json({
                error: "Time is required"
            })
            return
        }
        if (doc.time < 0) {
            res.status(400).json({
                error: "Time is less than zero! Hmm..."
            })
            return
        }
        if (doc.max < doc.min) {
            res.status(400).json({
                error: "Max must not be less than min."
            })
            return
        }
        if (doc.min <= 0) {
            res.status(400).json({
                error: "Minimum must be more than zero."
            })
            return
        }
        scoreboard.insertOne(doc).then(() => {
            res.sendStatus(200)
        })
    })
    app.listen(port, () => {
        console.log(`Server is now listening on port ${port}`)
    })
}).catch(err => {
    console.error(err)
})