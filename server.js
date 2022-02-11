// import
import express from 'express';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import Messages from './dbMessages.js';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1346101",
    key: "7fb86a6f28f516cae519",
    secret: "00451c534ba53bacceb3",
    cluster: "mt1",
    useTLS: true
});

// middleware
app.use(express.json());

app.use(cors());

// DB config
const connection_url = "mongodb+srv://adnanmomin:adnan%40123@cluster0.keaua.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url);

const db = mongoose.connection;

db.once('open', ()=> {
    console.log("DB connection opened")

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("change occured", change)

        if(change.operationType == "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });            
        }
        else {
            console.log("Error triggering pusher")
        }
    })
});

// ????

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data);
        }
    })
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(201).send(data);
        }
    })
})

// listener
app.listen(port, () => console.log(`Listening on localhost:${port}`));