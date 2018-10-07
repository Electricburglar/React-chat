const io = require('.').io;
const { VERIFY_USER, USER_CONNECTED, LOGOUT } = require('../Events');
const { createUser, createMessage, createChat } = require('../Factories');
const connectedUsers = {  }

module.exports = function(socket) {
    console.log("Socket ID :"+socket.id);

    socket.on(VERIFY_USER, (nickname, callback) => {
        if(isUser(connectedUsers, nickname)) {
            callback({isUser: true, user: null})
        }
        else {
            callback({isUser: false, user: createUser({name: nickname})})
        }
    });

    socket.on(USER_CONNECTED, (user) => {
        connectedUsers = addUser(connectedUsers, user);
        socket.user = user;
        console.log(connectedUsers);
    });
}

function addUser(userList, user) {
    let newList = Object.assign({}, userList);
    newList[user.name] = user;
    return newList;
}

function removeUser(userList, username) {
    let newList = Object.assign({}, userList);
    delete newList[username];
    return newList;
}

function isUser(userList, username) {
    return username in userList;
}