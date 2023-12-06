"use strict";
const debug = require("debug")("test");
const shortid = require('shortid');
const MaxPlayer=6;
let storeData = [];
let roomData = function () {
    let instance;
    let obj = {
        
        removePlayer: function (SocketId) {
                for (let j = 0; j < storeData[i].length; j++) {
                    if (storeData[j] === SocketId) {
                        debug(`remove player ${storeData[i]} from room `)
                        storeData[j].splice(j, 1);
                    }
                }
               
        },
        showUsers: function () {
            console.table(storeData);
        },
        findUser: function (playerId) {

           
        },
        AddPlayer: function (SocketId) {
           storeData.push(SocketId);
        }
    };

    if (!instance) {
        instance = obj;
    }

    return instance;
};

module.exports.roomData = roomData;


