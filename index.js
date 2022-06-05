const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch")
const router = express.Router();
const app = express();
const rootUrl = 'https://blfa-api.migros.ch';
const coursesEndpoint = rootUrl + '/kp/api/Courselist/all'
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = process.env.PORT || 9000
router.post('/courses',(request,response) => {
    console.log("Request received:",request.body)
    const body = request.body;

    fetch(coursesEndpoint, {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(res => res.json())
        .then(json => response.send(json.courses));
});

// add router in the Express app.
app.use("/", router);
app.use(express.static('public'))
app.listen(port)
console.log('App listening on',port)