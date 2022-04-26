const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const { generateMessage } = require('./utils/messages')
const { generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count=0

io.on('connection', (socket)=>{
    console.log("New web socket connection!")

    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({ id:socket.id, username, room })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Discord','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Discord','A new user has joined!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback() 
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(coords, callback) => {
        const user = getUser(socket.id) 
        io.to(user.room).emit('locationmessage', generateLocationMessage(user.username,'https://google.com/maps?q=0'+coords.latitude,coords.longitude) )
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        // if(user){
        //     io.to(user.room).emit('message',generateMessage('User has left!'))
        // }

        io.emit('message',generateMessage('Discord','User has left!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })
})

server.listen(port, () => {
    console. log( 'Server is up on port '+ port +'!')
})
