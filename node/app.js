var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(4000);


var mongo = require('mongoskin'); 
var appName = 'app20093986';
var mongoUri = 'mongodb://token-for-conveyance:11f244795480b628db024ff00c633fce@paulo.mongohq.com:10030/app20093986';
var db = mongo.db(mongoUri, {safe:false});

var games = db.collection('games');


console.log("Starting Node Server on port 4000");
console.log("http://localhost:4000/");







function createTrainDeck(cards)
{
    var top = cards.length;
    var shuffledDeck = new Array();

    while(cards.length > 0)
    {
      var rnd = Math.floor((Math.random()*top));

      if(cards[rnd] != undefined)
      {
        shuffledDeck.push(cards[rnd].card);

        cards[rnd].count = cards[rnd].count -1;

        if(cards[rnd].count == 0 ){
          cards.splice(rnd,1);
        }
      }
    }

    return shuffledDeck;
}

var totalTrainCards = 110;
var totalofEachTrainCards = new Array();

totalofEachTrainCards[0] = {card:'Box', count: 12};
totalofEachTrainCards[1] = {card:'Passenger', count: 12};
totalofEachTrainCards[2] = {card:'Tanker', count: 12};
totalofEachTrainCards[3] = {card:'Reefer', count: 12};
totalofEachTrainCards[4] = {card:'Freight', count: 12};
totalofEachTrainCards[5] = {card:'Hopper', count: 12};
totalofEachTrainCards[6] = {card:'Coal', count: 12};
totalofEachTrainCards[7] = {card:'Caboose', count: 12};
totalofEachTrainCards[8] = {card:'Locomotive', count: 14};





io.sockets.on('connection', function (socket) {
   

  socket.on('cardDrawn', function (data) {
    console.log(socket+" drawing card.");
     socket.set('cardDrawn', data);
     socket.broadcast.emit('cardDrawn', data);
     console.log(data);
  });

  socket.on('addPlayer', function (data) {
     socket.broadcast.emit('addPlayer', data);
     console.log(socket+" adding player.");
     console.log("user: " + data);

     games.findOne({"game_id":data.game_id}, function(e, result){
        for(x=0;x<result.players.length;x++)
        {
          if(result.players[x].session_id == socket.id)
          {
            result.players[x].name = data.player_name;
          }
        }

        games.update({"game_id":data.game_id}, result, function(e, upResult){ });

    });
  });

  socket.on('createGame', function (data) {
    
    console.log(socket.id+" creating game.");
    console.log("game: " + data);

    var shuffledDeck = createTrainDeck(totalofEachTrainCards);

    games.findOne({"game_id":data}, function(e, result){
      if(result === null)
      {
        games.insert({"game_id":data, 'players': [ { session_id: socket.id } ], 'trainCards': shuffledDeck }, {}, function(e, results){
          if (e) return next(e);

        });
      }
    });

    socket.broadcast.emit('createGame', data);
    socket.emit('loadTrainCards', shuffledDeck);

  });

  socket.on('joinGame', function (data) {

    console.log(socket.id+" join game.");
    console.log("game: " + data);

    var game_id = data;
    var shuffledDeck = [];

    games.findOne({"game_id":game_id}, function(e, result){
      console.log('found game:');
      console.log(result.game_id);
      result.players.push({ session_id: socket.id });

      shuffledDeck = result.trainCards;

      games.update({"game_id":game_id}, result, function(e, upResult){ });

      socket.broadcast.emit('joinGame', game_id);
      socket.emit('loadTrainCards', shuffledDeck);
    });

    console.log(shuffledDeck);

    
  });


// End of Connection Methods ******************************//

});




