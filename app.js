const express = require('express');
const cors = require('cors');
const app = express();
const ejs = require('ejs');
const request = require('request');
const fs = require('fs');
const { Stream } = require('stream');
const { start } = require('repl');
// const fetch = require('node-fetch');
const options = { etag: false };
// const helmet = require('helmet');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public', options));
app.use(express.urlencoded({ extended: true }));
// const corsOptions = {
//     origin: "http://localhost:8080",
//     credentials: true
// }
// app.use(cors(corsOptions));
app.use(express.json());
// app.use(helmet());
app.disable('x-powered-by');

// res.sendFile('./public/page/condition.html', {root:__dirname});
app.get('/', function(req, res){
    return res.render('index.html', {title: 'Express'});
});
app.get('/condition', function(req, res){
    return res.render('condition.html', {title: 'Express'});
});
app.get('/recommendation', function(req, res){
    return res.render('recommendation.html', {title: 'Express'});
});
app.get('/contact', function(req, res){
    return res.render('contact.html', {title: 'Express'});
});

let sensData415 = [0, 0, 0];
let sensData414 = [0, 0, 0];
let exists415;
let exists414;

let low_S = "Silent";
let middle_S = "White noise";
let high_S = "Noisy";

function checkSound(res){
    if(res >= 510) return "Silent";
    else if(res >= 470 && res < 510) return "White noise";
    else if(res >= 0 && res < 470) return "Noisy";
}

! function getMdata(){
    let basicUrl415 = 'http://203.253.128.177:7579/Mobius/schclass415/';
    let basicUrl414 = 'http://203.253.128.177:7579/Mobius/schclass414/';
    let sensUrl = new Array(6);
    sensUrl[0] = basicUrl415 + "temp/la";
    sensUrl[1] = basicUrl415 + "cam/la";
    sensUrl[2] = basicUrl415 + "sound/la";
    sensUrl[3] = basicUrl414 + "temp/la";
    sensUrl[4] = basicUrl414 + "cam/la";
    sensUrl[5] = basicUrl414 + "sound/la";

    let options = new Array(6);
    for(var i = 0; i < 6; i++){
        options[i] = {
            'method': 'GET',
            'url': sensUrl[i],
            'headers': {
                'Accept': 'application/json',
                'X-M2M-RI': '12345',
                'X-M2M-Origin': 'SOrigin'
            }
        };
    }    
    request(options[0], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con'];
        var temp = res.split(',');
        sensData415[0] = temp[0];
        console.log("415 temp :" + sensData415[0]);
    });      
    request(options[1], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con'];
        exists415 = res;
        var temp = 0;
        for(var i = 0; i < res.length; i++){
            if(res[i] == '1') temp++;
        }
        sensData415[1] = temp;
        console.log("415 count :" + sensData415[1]);
    });      
    request(options[2], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con'];
        sensData415[2] = checkSound(res);
        console.log("415  sound :" + sensData415[2]);
    });      
    request(options[3], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con'];
        var temp = res.split(',');
        sensData414[0] = temp[0];
        console.log("414 temp :" + sensData414[0]);
    });      
    request(options[4], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con']; 
        exists414 = res;
        var temp = 0;
        for(var i = 0; i < res.length; i++){
            if(res[i] == '1') temp++;
        }
        sensData414[1] = temp;
        console.log("414 count :" + sensData414[1]);
    });      
    request(options[5], function(error, res){
        if (error) throw new Error(error);
        res = JSON.parse(res.body);
        res = res['m2m:cin']['con'];
        sensData414[2] = checkSound(res);
        console.log("414 sound :" + sensData414[2]);
    });      
    setTimeout(function(){
        getMdata();
    }, 60000); //300000
}();
app.get('/condition/req', function(req, res){
    console.log(exists415 + " " + exists414);
    res.send({"temp415" : sensData415[0] + " Degree", "cam415" : sensData415[1] + " Exists",
        "sound415" : sensData415[2], "temp414" : sensData414[0] + " Degree", "cam414" : sensData414[1] + " Exists",
        "sound414" : sensData414[2], "exists415" : exists415, "exists414" : exists414});
});
app.post('/recommendation/req', function(req, res){
    var temp = req.body['temp'];
    var noise = req.body['noise'];
    var count = req.body['count'];
    console.log(`${temp}, ${noise}, ${count}`);
    var score415 = 0;
    var score414 = 0;
    if(sensData415[0] <= 20 && temp == 'low') score415++;
    else if(sensData415[0] >= 21 && sensData415[0] <= 25 && temp == 'mid') score415++;
    else if(sensData415[0] >= 26 && temp == 'high') score415++;
    if(sensData415[1] <= 4 && count == 'low') score415++;
    else if(sensData415[1] >= 5 && sensData415[1] <= 8 && count == 'mid') score415++;
    else if(sensData415[1] >= 9 && count == 'high') score415++;
    if(sensData415[2] == low_S && noise == 'low') score415++;
    else if(sensData415[2] == middle_S && noise == 'mid') score415++;
    else if(sensData415[2] == high_S && noise == 'high') score415++;

    if(sensData414[0] <= 20 && temp == 'low') score414++;
    else if(sensData414[0] >= 21 && sensData414[0] <= 25 && temp == 'mid') score414++;
    else if(sensData414[0] >= 26 && temp == 'high') score414++;
    if(sensData414[1] <= 4 && count == 'low') score414++;
    else if(sensData414[1] >= 5 && sensData414[1] <= 8 && count == 'mid') score414++;
    else if(sensData414[1] >= 9 && count == 'high') score414++;
    if(sensData414[2] == low_S && noise == 'low') score414++;
    else if(sensData414[2] == middle_S && noise == 'mid') score414++;
    else if(sensData414[2] == high_S && noise == 'high') score414++;
    //
    console.log("415 :"+score415);
    console.log("414 :"+score414);
    var result;
    if(score415 >= score414) result = 'ML 415';
    else result = 'ML 414';
    res.send({result : result});
});

var server = app.listen(8840, function () {
    var host = server.address().address;
    var port = server.address().port; 
    console.log('Server is working : PORT - ',port);
});
