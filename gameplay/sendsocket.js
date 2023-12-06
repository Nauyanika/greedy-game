const SendSocketToSvenUP = require("./Sevenup").GetSocket;
const SendSocketToDvT = require("./DragonVsTiger").GetSocket;
const SendSocketToTitali = require("./TitaliGame").GetSocket;

const SendSocketToAndarbhar = require("./Andarbhar").GetSocket;



function sendSocket(socket){
    SendSocketToSvenUP(socket)
    SendSocketToDvT(socket)
    SendSocketToAndarbhar(socket)
 SendSocketToTitali(socket)
}

module.exports.sendSocket = sendSocket;