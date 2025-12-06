var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var rooms = {};

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('join room', function(data) {
    var username = data.username;
    var room = data.room;

    if (socket.room) {
      socket.leave(socket.room);
      if (rooms[socket.room]) {
        var index = rooms[socket.room].indexOf(socket.username);
        if (index > -1) {
          rooms[socket.room].splice(index, 1);
        }
        io.to(socket.room).emit('user left', { username: socket.username });
        io.to(socket.room).emit('users in room', rooms[socket.room]);
      }
    }

    socket.join(room);
    socket.room = room;
    socket.username = username;

    if (!rooms[room]) {
      rooms[room] = [];
    }
    if (rooms[room].indexOf(username) === -1) {
      rooms[room].push(username);
    }
    
    socket.emit('welcome', { username: username, room: room });

    socket.to(room).emit('user joined', { username: username });
    
    io.to(room).emit('users in room', rooms[room]);

    console.log(username + ' joined room: ' + room);
  });

  socket.on('chat message', function(data) {
    var room = data.room;
    var username = data.username;
    var message = data.message;

    io.to(room).emit('chat message', {
      username: username,
      message: message,
      room: room
    });
  });

  socket.on('disconnect', function() {
    if (socket.room && socket.username) {
      var room = socket.room;
      var username = socket.username;

      if (rooms[room]) {
        var index = rooms[room].indexOf(username);
        if (index > -1) {
          rooms[room].splice(index, 1);
        }
        
        io.to(room).emit('user left', { username: username });
        io.to(room).emit('users in room', rooms[room]);

        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }

      console.log(username + ' disconnected from room: ' + room);
    } else {
      console.log('user disconnected');
    }
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

console.log('Server is running on port 3000');