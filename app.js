//express setup
let express = require('express');
const { disconnect } = require('process');
let app = express();
let serv = require('http').Server(app);

app.get('/',function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.');

let socket = require('./server/socket.js')