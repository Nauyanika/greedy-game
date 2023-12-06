const debug = require("debug")("test");
let Players=[]

function AddPlayer(data){
Players.push(data)
// debug("new player add");
// debug(data)
}
function RemovePlayer(socketId){

  for (let i = 0; i < Players.length; i++) {
   if(Players[i].socketId===socketId){
     debug(Players[i].playerId +"player removed")
    Players.splice(i,1);
    return;
   }
   //debug("player not found");
  }
}
function GetPlayerData(socketId){
  for (let i = 0; i < Players.length; i++) {
    if(Players[i].socketId===socketId){
      return Players[i];
    }    
  }
  return null;
}


  module.exports.AddPlayer=AddPlayer;
  module.exports.RemovePlayer=RemovePlayer;
  module.exports.GetPlayerData=GetPlayerData;