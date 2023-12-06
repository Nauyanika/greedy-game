"use strict";
const debug = require("debug")("test");
const db = require("../config/db.js");
const commonVar = require("../Constants").commonVar;




const userById = async(playerId) => {
    try{
        let sql = `SELECT * FROM users WHERE id= ? limit ?`;
        let user  = await db.query(sql,[playerId,1])
        return user;
    } catch (err) {
        console.log(err);
        debug(err);
    }     
}

const getUserBalance = async(playerId) => {
    try{
        let user  = await userById(playerId);
        let result = user[0]['cash_balance'];
        return result;
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}


const  isValidArray = (arr) => {
    if(arr!=null && arr!=undefined && arr.length>0) {
        return true
    } else {
        return false
    }
}


const getRoundCount = async() => {
    try{
        let limit = 1;
        let sql =  `SELECT room_id FROM game_record_sevenup ORDER BY id DESC LIMIT ?`
        let result = await db.query(sql,limit);
        let roundCount = result[result.length-1]['room_id'] + 1
        return (roundCount);
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}


const JoinGame = async(data,room_id) => {
    try{
        let user  = await userById(data.playerId);
        if(isValidArray(user)){
            let cash_balance = user[0]['cash_balance'];
            let chip_amt = data.chip;
            if(cash_balance >= chip_amt){
                let parms = {user_id:data.playerId,game_id:data.gameId,amount:data.chip,spot:data.spot,room_id:room_id};
                let sql = "Insert Into join_game Set ?"
                let saveBet = await db.query(sql,parms);

                if(saveBet!=null && saveBet!=undefined && Object.keys(saveBet).length !=0) {
                    cash_balance -= chip_amt
                    sql = `UPDATE users SET cash_balance= ? WHERE id= ? `;
                    let saveBalance  = await db.query(sql,[cash_balance,data.playerId]);
                }    
            } 
        }
        debug("player bet successfully add to 7up db")
        return true;
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}



const lastWinningNo = async() => {
    try{
        let limit = 10;
        let result = new Array(limit);
        let sql =  `SELECT  win_no FROM (SELECT * FROM game_record_sevenup ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`
        let data = await db.query(sql,limit);
        if(isValidArray(data)){
            for (var i = 0; i < data.length; i++) {
                let spot=data[i].spot;
                result[(limit-1)-i]=spot;
            }
        }
        return (result);
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}



const updateWinningNo = async(data) => {
    try{
        let parms = data;
        let sql = "Insert Into game_record_sevenup Set ?"
        let query = await db.query(sql,parms)
        debug("Winning no. inserted successfuly to 7up db")
        return true;
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}



const updateWinningAmount = async(data) => {
    try{
        let winningspot = data['spot'];
        let game_id = 1;
        let rate = (winningspot === 0 || winningspot === 2 ) ? 2 : 5;     //winning amt multile
        let room_id = data['room_id'];
        let sql = `SELECT user_id,spot,amount FROM join_game WHERE game_id= ? AND room_id= ? AND is_updated= ? `;
        let result = await db.query(sql,[game_id,room_id,0]);
        let playeWinningArray = [];
        
        if(result!=null && result!=undefined && result.length>0){
            for(let player of result ){
                let win_amount = 0; 
                let playerId = player['user_id'] 
                let playingSpot = player['spot'] 
                let betAmt =   player['amount']
                if(playingSpot === winningspot) {
                    win_amount = betAmt * (rate - (commonVar.adminCommisionRate));
                } 
                sql = `UPDATE join_game SET  win_amount=? ,is_updated=?  WHERE game_id= ? AND room_id= ? AND user_id= ?  `;
                let update_sql = await db.query(sql,[win_amount,1,game_id,room_id,playerId]);
                if(update_sql!=null && win_amount >0 ) {
                    sql = `UPDATE users SET  cash_balance= cash_balance + ?   WHERE id= ?  `;
                    let saveBalance  = await db.query(sql,[win_amount,playerId]);
                } 
                playeWinningArray.push({playerId,win_amount})
            }
        }else{
            debug("no player has played 7up game yet db.")
        }

        return playeWinningArray;
        
    } catch (err) {
        console.log(err);
        debug(err);
    }    
}




module.exports = {JoinGame, lastWinningNo,getRoundCount , updateWinningNo , updateWinningAmount,getUserBalance}