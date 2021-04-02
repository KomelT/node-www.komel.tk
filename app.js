require("dotenv").config()
var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var helmet = require('helmet');
var cors = require('cors')
const Discord = require('discord.js');
const fetch = require('node-fetch');
const contentSecurityPolicy = require("express-csp-generator");

// Set allowed origins for /send route
const allowedOrigins = ["https://www.komel.tk", "https://komel.tk", "https://komelt.github.io"];

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

app.use(
    contentSecurityPolicy({
        "directives": {
            "frame-ancestors": [
                "'none'"
            ],
            "block-all-mixed-content": [],
            "default-src": [
                "'none'"
            ],
            "script-src-elem": [
                "'self'"
            ],
            "script-src": [
                "'self'",
                "https://www.gstatic.com",
                "https://www.google.com"
            ],
            "style-src": [
                "'self'",
                "'report-sample'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com/"
            ],
            "object-src": [
                "'none'"
            ],
            "frame-src": [
                "https://www.komel.tk/",
                "https://www.google.com/"
            ],
            "child-src": [
                "'none'"
            ],
            "img-src": [
                "'self'"
            ],
            "font-src": [
                "'self'",
                "https://fonts.gstatic.com/"
            ],
            "connect-src": [
                "https://www.komel.tk/"
            ],
            "manifest-src": [
                "'none'"
            ],
            "base-uri": [
                "'self'"
            ],
            "form-action": [
                "'none'"
            ],
            "media-src": [
                "'none'"
            ],
            "prefetch-src": [
                "'none'"
            ],
            "worker-src": [
                "'none'"
            ],
            "report-uri": [
                "https://gate.rapidsec.net/g/r/csp/b3a6a7f0-407a-4815-b972-b795fc9e2f91/0/3/3?sct=ff3f873a-89ae-4ccf-b082-50098f31e34c&dpos=report"
            ]
        },
        "reportOnly": false
    })
);

// Allow direct queries to folder "public"
app.use(express.static("public"))

// Routes to serve diferent sites
app.get('/', (req, res) => {
    res.set('Content-Security-Policy', 'script-src *');
    res.sendFile(path.join(__dirname + '/html/index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/about.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname + '/html/portfolio.html'));
});

app.get('/contact', (req, res) => {
    res.set('Content-Security-Policy', 'script-src https://*');
    res.sendFile(path.join(__dirname + '/html/contact.html'));
});

// POST request to send Discord message
app.post("/send", (req, res) => {

    // Test if origin is right
    if (allowedOrigins.indexOf(req.header("Origin")) === -1) {
        res.send("Origin '" + req.header("Origin") + "' not allowed!")
        return true;
    }

    //console.log(req.body)

    // Parse data from request
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const recaptcha = req.body["g-recaptcha-response"]

    console.log(recaptcha)

    // Send "success" if all parametrs are OK else "error"
    if (name === undefined || email === undefined || subject === undefined || message === undefined || recaptcha === "") {
        res.send("error")
    } else {

        const params = new URLSearchParams();
        params.append("secret", process.env.RECAPTCHA_SECRET);
        params.append("response", recaptcha)
        const fetchOptions = {
            method: 'POST',
            body: params
        }

        fetch("https://www.google.com/recaptcha/api/siteverify", fetchOptions).then(res => res.json()).then(body => {
            console.log(body)
            console.log(body.success)
            if (body.success === true) {
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

            } else {
                res.send("recaptcha-failed")
            }
        });
    }


})

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + '/html/error/404.html'));
})

app.post("*", (req, res) => {
    res.status(405).send("Method not allowed");
})

app.put("*", (req, res) => {
    res.status(405).send("Method not allowed");
})

app.listen(8080, (err) => {
    console.log("App is listening on port 8080!")
});