"use strict";
const debug = require("debug")("test");
const roomData = require("./RoomData").roomData;
const commontVar = require("../Constants").commonVar;
const selectGame = require("../Constants").selectGame;

async function JoinRoom(data) {
 return(new Promise(function (myResolve, myReject) {
   //let roomName=commontVar.gameplay;
   let roomName=selectGame[data.gameId];

    //this gameplay room will help to emit events common events 
    //like Ontimeup() OnTimerStart() OnWait()
    data.socket.join(roomName, () => {
      debug(`user ${data.socket.id} joined room ${roomName } `);
    });
    myResolve({result:"success",roomName:roomName});
  }));
 
}


module.exports.JoinRoom = JoinRoom;