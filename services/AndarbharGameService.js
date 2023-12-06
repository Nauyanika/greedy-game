"use strict";
const debug = require("debug")("test");
const db = require("../config/db.js");
const commonVar = require("../Constants").commonVar;
const winningRate = require("../Constants").andarBaharWinningRate;


const userById = async(playerId) => {
    try{
        let sql = `SELECT * FROM users WHERE id= ? limit ?`;
        let user  = await db.query(sql,[playerId,1])
        return user;
    } catch (err) {
        debug(err);
    }     
}

const getUserBalance = async(playerId) => {
    try{
        let user  = await userById(playerId);
        let result = user[0]['cash_balance'];
        return result;
    } catch (err) {
        debug(err);
    }    
}

const updateUserBalance = async(playerId,balance) => {
    try{
        let user  = await userById(playerId);
        let result = user[0]['cash_balance'];
        return result;
    } catch (err) {
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
        let sql =  `SELECT room_id FROM game_record_dragon ORDER BY id DESC LIMIT ?`
        let result = await db.query(sql,limit);
        let roundCount = result[result.length-1]['room_id'] + 1
        return (roundCount);
    } catch (err) {
        debug(err);
    }    
}


const saveJokerCard = async(data) => {
    try{
        let parms = data;
        let sql = "Insert Into game_record_andarbhar Set ?"
        let query = await db.query(sql,parms)
       // debug("joker card save in andhar bhar db")
        return true;
    } catch (err) {
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
                
                let checkBet = 'select * FROM join_game WHERE user_id=? AND game_id= ? AND room_id= ? AND spot=? AND is_updated=?';
                let playerBet = await db.query(checkBet,[data.playerId,data.gameId,room_id,data.spot,0]);

                if(isValidArray(playerBet)){

                    let totalChip = playerBet[0].amount + data.chip;
                    let id = playerBet[0].id;
                    let parms = {user_id:data.playerId,game_id:data.gameId,amount:data.chip,spot:data.spot,room_id:room_id};
                    let sql = "UPDATE join_game Set amount= ? WHERE id= ?"
                    let saveBet = await db.query(sql,[totalChip,id]);

                } else {

                    let parms = {user_id:data.playerId,game_id:data.gameId,amount:data.chip,spot:data.spot,room_id:room_id};
                    let sql = "Insert Into join_game Set ?"
                    let saveBet = await db.query(sql,parms);
                }

                cash_balance -= chip_amt
                sql = `UPDATE users SET cash_balance= ? WHERE id= ? `;
                let saveBalance  = await db.query(sql,[cash_balance,data.playerId]);   
            } 
        }
        //debug("player bet successfully add to db")
        return true;
    } catch (err) {
        debug(err);
    }    
}

const lastWinningNo = async() => {
    try{
        let limit = 100;
        let result = [];
        let sql =  `SELECT spot1 FROM (SELECT * FROM game_record_andarbhar WHERE spot1 IS NOT NULL ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`
        let data = await db.query(sql,limit);
        if(isValidArray(data)){
            result = data.map(val => val.spot1 )
        }
        return (result);
    } catch (err) {
        debug(err);
    }    
}

const historyCard = async() => {
    try{
        let limit = 10;
        let result = [];
        let sql =  `SELECT * FROM (SELECT * FROM game_record_andarbhar WHERE spot1 IS NOT NULL ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`
        let data = await db.query(sql,limit);
        if(isValidArray(data)){
            result = data.map(val => {
                return {joker_card_no :val.joker_card_no,winSpot : val.spot1} 
            })
        }
        return result;
    } catch (err) {
        debug(err);
    }    
}


const updateWinningNo = async(data) => {
    try{
        let {room_id,game_id,Spot1,Spot2} = data;
        let sql = "UPDATE game_record_andarbhar Set spot1= ?,spot2= ? WHERE room_id= ? AND game_id= ?"
        let updateSpot = await db.query(sql,[Spot1,Spot2,room_id,game_id]);
       // debug("Winning spot successfuly update to andhar bhar db")
        return true;
    } catch (err) {
        debug(err);
    }    
}


const updateWinningAmount = async(data) => {
    try{

        let{winningspot,room_id,game_id} = data;

        let sql =  `SELECT user_id FROM join_game WHERE game_id= ? AND room_id= ? AND is_updated= ? GROUP BY user_id `;
        let players = await db.query(sql,[game_id,room_id,0]);

        if(isValidArray(players)){
            for(let player of players ){
                let playerId = player['user_id'];
                let sql = `SELECT id,spot,amount FROM join_game WHERE game_id= ? AND room_id= ? AND user_id= ? And  spot IN (?) `;
                let bets = await db.query(sql,[game_id,room_id,playerId,winningspot]);

                if(isValidArray(bets)){ //winning spot user amount update
                    let win_amount = 0
                    let total_win_amount  = 0; 
                    for(let bet of bets ){ //update winning amount in bets
                        let joinGameId  =   bet['id'] 
                        let playingSpot =   parseInt(bet['spot']);
                        let betAmt      =   parseInt(bet['amount']);
                        let rate        =   winningRate[playingSpot];

                        win_amount = betAmt * (rate - (commonVar.adminCommisionRate));
                        win_amount = parseFloat((win_amount).toFixed(2));
                        total_win_amount  += win_amount;
                        sql = `UPDATE join_game SET  win_amount=? ,is_updated=?  WHERE game_id= ? AND room_id= ? AND user_id= ? AND id = ? `;
                        let update_sql = await db.query(sql,[win_amount,1,game_id,room_id,playerId,joinGameId]);
                    }  

                    if (total_win_amount > 0)  { //update cash balanve
                        sql = `UPDATE users SET  cash_balance= cash_balance + ?   WHERE id= ? `;
                        let saveBalance  = await db.query(sql,[win_amount,playerId]);
                    }
                }  
            }  

            //Update Non Winning Bets
            sql = `UPDATE join_game SET  win_amount=? ,is_updated=?  WHERE game_id= ? AND room_id= ? AND is_updated= ?  `;
            let update_sql = await db.query(sql,[0,1,game_id,room_id,0]);

           // debug("Winning amount successfuly updated in anadarbhar db")  
        }
    } catch (err) {
        debug(err);
    }    
}



 





module.exports = {saveJokerCard, historyCard ,JoinGame, lastWinningNo , updateWinningNo , updateWinningAmount,getUserBalance}