"use strict";
const JoinRoom = require("./JoinRoom").JoinRoom;
const debug = require("debug")("test");
const commonVar = require("../Constants").commonVar;
const selectGame = require("../Constants").selectGame;
const StartDVsTGame = require("../gameplay/DragonVsTiger").StartDVsTGame;
const StartTitaliGame = require("../gameplay/TitaliGame").StartTitaliGame;

const StartAndarbharGame = require("../gameplay/Andarbhar").StartAndarbharGame;
const StartGame = require("../gameplay/Sevenup").StartGame;

async function MatchPlayer(data) {
  let result = await JoinRoom(data);
  if (result.result === commonVar.success) {
    debug("successfully joined the room " + result[commonVar.roomName]);
    data[commonVar.roomName] = result[commonVar.roomName];
  }

  switch (data[commonVar.roomName]) {
    case selectGame[1]:
      StartGame(data);
      break;
    case selectGame[2]:
      StartDVsTGame(data);
      break;
    case selectGame[4]:
      StartTitaliGame(data);
      break;
    case selectGame[3]:
      StartAndarbharGame(data);
      break;
    default:
      break;
  }
}

module.exports.MatchPlayer = MatchPlayer;
