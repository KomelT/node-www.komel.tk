require("dotenv").config()
var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var helmet = require('helmet');
var cors = require('cors')
const Discord = require('discord.js');

// Set allowed origins for /send route
const allowedOrigins = ["https://www.komel.tk", "https://komel.tk", "http://localhost:8080", "https://komelt.github.io"];

// initialize Express.js
var app = express();

// Declare Discord webhook
const webhookClient = new Discord.WebhookClient(process.env.DISCORD_ID, process.env.DISCORD_TOKEN);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// Allow direct queries to folder "public"
app.use(express.static("public"))

// Routes to serve diferent sites
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/about.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/portfolio.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/contact.html'));
});

// POST request to send Discord message
app.post("/send", (req, res) => {

    // Test if origin is right
    if (allowedOrigins.indexOf(req.header("Origin")) === -1) {
        res.send("Origin '" + req.header("Origin") + "' not allowed!")
        return true;
    }

    // Parse data from request
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    // Send "success" if all parametrs are OK else "error"
    if (name === undefined || email === undefined || subject === undefined || message === undefined) {
        res.send("error")
    } else {
        res.send("success")

        let date = new Date();

        // Set data to embed in Discord message
        const embed = new Discord.MessageEmbed()
            .setTitle('**' + subject + '**')
            .setFooter(date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getYear() + " " + date.toLocaleTimeString())
            .setThumbnail("https://www.komel.tk/img/favicon.png")
            .addFields([
                {
                    name: "From:",
                    value: name + "\n" + email
                },
                {
                    name: "Message:",
                    value: message
                }
            ])

        // Execute Discord message
        webhookClient.send("", {
            embeds: [embed]
        })
    }


})

app.listen(8080, (err) => {
    console.log("App is listening on port 8080!")
});