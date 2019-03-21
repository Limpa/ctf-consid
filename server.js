const express = require('express');
const app = express();
const expressSession = require('express-session');
const sharedSession = require('express-socket.io-session');
const port = 3000;
const hash = require('./hash');
const questions = require('./questions');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const session = expressSession({
  secret: `e6332cc0c03c351f8819caa0288ebf1d`,
  resave: true,
  saveUninitialized: true,
});
app.use(session);
io.use(sharedSession(session));

app.use(express.static('public'))

var rexp = new RegExp('<|>|\'|script|;');
highscores = {highscoreList: [{name: 'Linus', points: 200}]};
io.on('connection', socket => {
  io.to(socket.id).emit('initHighscore', highscores);
  socket.on('initQuiz', () => {
    io.to(socket.id).emit('quizQuestions', questions);
  });

  socket.on('addUserToHighscore', req => {
    if (!req.name || !req.points || !req.authHash){
      io.to(socket.id).emit('errorMessage', 'FEL FORMAT DIN LILLA JÄKEL');
      return;
    }
    if (rexp.test(req.name)){
      io.to(socket.id).emit('errorMessage', 'inga sånnadär karaktärer tack.');
      return;
    }
    if (hash(req.points) != req.authHash){
      io.to(socket.id).emit('errorMessage', 'hashen stämmer inte överrens');
      return;
    }
    if (req.points > 100){
      io.to(socket.id).emit('errorMessage', 'finns bara 100 frågor, hur kan det vara 200 poäng????');
      return;
    }
    highscores.highscoreList.push({name: req.name, points: req.points});
    highscores.highscoreList = highscores.highscoreList.sort((a,b) => a.points > b.points ? -1 : 1);
    io.emit('updateHighscore', {updateType: 'add', highscoreList: highscores.highscoreList});
  })
});

server.listen(port, () => console.log(`listening on port ${port}`))