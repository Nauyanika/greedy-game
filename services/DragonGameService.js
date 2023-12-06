"use strict";
const debug = require("debug")("test");
const db = require("../config/db.js");
const commonVar = require("../Constants").commonVar;

const userById = async (playerId) => {
  try {
    let sql = `SELECT * FROM users WHERE id= ? limit ?`;
    let user = await db.query(sql, [playerId, 1]);
    return user;
  } catch (err) {
    debug(err);
  }
};

const getUserBalance = async (playerId) => {
  try {
    let user = await userById(playerId);
    let result = user[0]["point"];
    return result;
  } catch (err) {
    debug(err);
  }
};

const userByEmail = async (playerId) => {
  try {
    let sql = `SELECT * FROM users WHERE email= ? limit ?`;
    let user = await db.query(sql, [playerId, 1]);
    return user;
  } catch (err) {
    debug(err);
  }
};

const getUserPoint = async (playerId, betPoints) => {
  try {
    let user = await userByEmail(playerId);
    let result = user[0]["point"];
    let sql = `UPDATE users SET point= ? WHERE email= ? `;
    let savePoint = await db.query(sql, [result - betPoints, playerId]);

    return result;
  } catch (err) {
    debug(err);
  }
};

const updateUserPoint = async (playerId, winPoints) => {
  try {
    /* let admin_commision=(winPoints/5)
       winPoints=winPoints-(admin_commision)
        */ let user = await userByEmail(playerId);
    let result = user[0]["point"];
    let sql = `UPDATE users SET point= ? WHERE email= ? `;
    let savePoint = await db.query(sql, [result + winPoints, playerId]);
    console.log("databaseupdated", savePoint);

    /* user  = await userByEmail("admin@admin.com");
        result = user[0]['point'];
       sql = `UPDATE users SET point= ? WHERE email= ? `;
       savePoint  = await db.query(sql,[result+admin_commision,"admin@admin.com"]);
      console.log("databaseupdated",savePoint) */

    //return result;
  } catch (err) {
    debug(err);
  }
};
const onSendPointsToPlayer = async (
  senderplayerId,
  receiverplayerId,
  point,
  password
) => {
  try {
    //let parms = data;
    let receiver = await userByEmail(receiverplayerId);
    if (receiver.length == 0) {
      return 404;
    }
    let user = await userByEmail(senderplayerId);
    if (user[0]["password"] == password) {
      let sql = "Insert Into point_history Set ?";
      let query = await db.query(sql, {
        receiver: receiverplayerId,
        sender: senderplayerId,
        point: point,
      });
      // debug("Winning no. inserted successfuly to db")
      /* user  = await userByEmail(receiverplayerId);
        let result = user[0]['point'];
        */
      /* sql = `UPDATE users SET point= ? WHERE email= ? `;
       let savePoint  = await db.query(sql,[result+point,receiverplayerId]);
       console.log("databaseupdated",savePoint)
        user  = await userByEmail(senderplayerId);
       // password==senderplayerId.password
         result = user[0]['point'];
        */
      /* sql = "Insert Into notification_table Set ?"
           query = await db.query(sql,{receiver_id:receiverplayerId,sender_id:senderplayerId,point:point})
          // debug("Winning no. inserted successfuly to db")
          console.log("query",query)
           */ user = await userByEmail(senderplayerId);
      let result = user[0]["point"];

      sql = `UPDATE users SET point= ? WHERE email= ? `;
      let savePoint = await db.query(sql, [result - point, senderplayerId]);
      console.log("databaseupdated", savePoint);

      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    debug(err);
  }
};

const onNotification = async (playerId) => {
  try {
    //let limit = 1;
    let sql = `SELECT * FROM point_history where receiver =? and status=-1`;
    let result = await db.query(sql, playerId);

    return result;
  } catch (err) {
    debug(err);
  }
};

const onAcceptPoints = async (notifyId, playerId) => {
  try {
    //let limit = 1;
    /*let sql =  `SELECT * FROM point_history where receiver =?`
        let result = await db.query(sql,playerId);*/
    let sql = `UPDATE point_history SET status= ? WHERE  id=?`;
    let savePoint = await db.query(sql, [1, notifyId]);
    console.log("databaseupdated", savePoint);

    sql = `select * from point_history where id=? `;
    savePoint = await db.query(sql, [notifyId]);
    // console.log("databaseupdated",savePoint)
    let point = savePoint[0]["point"];

    let user = await userByEmail(playerId);
    let result = user[0]["point"];

    sql = `UPDATE users SET point= ? WHERE email= ? `;
    savePoint = await db.query(sql, [result + point, playerId]);
    console.log("databaseupdated", savePoint);

    return result;
  } catch (err) {
    debug(err);
  }
};

const onUploadImage = async (imagename, username) => {
  try {
    let sql = "INSERT INTO  user_upload_image SET ?";
    let formData1 = {
      imagename: req.file.filename,
      username: req.body.username,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "images updated";
    } else {
      statusCode = 500;
      message = "Something went wrong! database error";
    }
    //res.send("imageload sucessfully");
    const responseDatajson = {
      status: statusCode,
      message,
    };
    res.send(responseDatajson);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const onchangePassword = async (userId, old_password, new_password) => {
  try {
    //let parms = data;

    let user = await userByEmail(userId);
    if (user[0]["password"] == old_password) {
      // const Password =await db.query(new_password)
      let sql = `UPDATE users SET password= ? WHERE email= ? `;
      let savePoint = await db.query(sql, [new_password, userId]);
      console.log("databaseupdated", savePoint);
      user = await userByEmail(userId);
      console.log("user", user);
      return user;
    } else {
      return 404;
    }
  } catch (err) {
    console.error(err);
    debug(err);
  }
};

const onRejectPoints = async (notifyId, playerId) => {
  try {
    //let limit = 1;
    /*let sql =  `SELECT * FROM point_history where receiver =?`
        let result = await db.query(sql,playerId);*/
    let sql = `UPDATE point_history SET status= ? WHERE  id=?`;
    let savePoint = await db.query(sql, [0, notifyId]);
    console.log("databaseupdated", savePoint);

    sql = `select * from point_history where id=? `;
    savePoint = await db.query(sql, [notifyId]);
    // console.log("databaseupdated",savePoint)
    let point = savePoint[0]["point"];

    let senderId = savePoint[0]["sender"];

    let user = await userByEmail(senderId);
    let result = user[0]["point"];

    sql = `UPDATE users SET point= ? WHERE email= ? `;
    savePoint = await db.query(sql, [result + point, senderId]);
    console.log("databaseupdated", savePoint);

    return result;
  } catch (err) {
    debug(err);
  }
};

const onSenderNotification = async (playerId) => {
  try {
    //let limit = 1;
    let sql = `SELECT * FROM point_history where receiver =? and status=-1`;
    let result = await db.query(sql, playerId);

    return result;
  } catch (err) {
    debug(err);
  }
};

const isValidArray = (arr) => {
  if (arr != null && arr != undefined && arr.length > 0) {
    return true;
  } else {
    return false;
  }
};

const getRoundCount = async () => {
  try {
    let limit = 1;
    let sql = `SELECT room_id FROM game_record_dragon ORDER BY id DESC LIMIT ?`;
    let result = await db.query(sql, limit);
    let roundCount = result[result.length - 1]["room_id"] + 1;
    return roundCount;
  } catch (err) {
    debug(err);
  }
};

const JoinGame = async (data, room_id) => {
  try {
    let user = await userById(data.playerId);
    if (isValidArray(user)) {
      let cash_balance = user[0]["cash_balance"];
      let chip_amt = data.chip;
      if (cash_balance >= chip_amt) {
        let parms = {
          user_id: data.playerId,
          game_id: data.gameId,
          amount: data.chip,
          spot: data.spot,
          room_id: room_id,
        };
        let sql = "Insert Into join_game Set ?";
        let saveBet = await db.query(sql, parms);

        if (
          saveBet != null &&
          saveBet != undefined &&
          Object.keys(saveBet).length != 0
        ) {
          cash_balance -= chip_amt;
          sql = `UPDATE users SET cash_balance= ? WHERE id= ? `;
          let saveBalance = await db.query(sql, [cash_balance, data.playerId]);
        }
      }
    }
    debug("player bet successfully add to db");
    return true;
  } catch (err) {
    debug(err);
  }
};

const lastWinningNo = async () => {
  try {
    let limit = 20;
    let result = new Array(limit);
    let sql = `SELECT spot FROM (SELECT * FROM game_record_dragon
 ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`;
    let data = await db.query(sql, limit);
    if (isValidArray(data)) {
      for (var i = 0; i < data.length; i++) {
        let spot = data[i].spot;
        result[limit - 1 - i] = spot;
      }
    }
    return result;
  } catch (err) {
    debug(err);
  }
};

const updateWinningNo = async (data) => {
  try {
    let parms = data;
    let sql = "Insert Into game_record_dragon Set ?";
    let query = await db.query(sql, parms);
    debug("Winning no. inserted successfuly to db");
    return true;
  } catch (err) {
    debug(err);
  }
};

const updateWinningAmount = async (data) => {
  try {
    let winningspot = data["spot"];
    let rate = winningspot === 0 || winningspot === 2 ? 2 : 8; //winning amt multile
    let game_id = 6;
    let room_id = data["room_id"];
    let playeWinningArray = [];

    let sql = `SELECT user_id FROM join_game WHERE game_id= ? AND room_id= ? AND is_updated= ? GROUP BY user_id `;
    let players = await db.query(sql, [game_id, room_id, 0]);

    if (isValidArray(players)) {
      for (let player of players) {
        let playerId = player["user_id"];
        let sql = `SELECT spot,amount FROM join_game WHERE game_id= ? AND room_id= ? AND user_id= ? `;
        let bets = await db.query(sql, [game_id, room_id, playerId]);

        if (isValidArray(bets)) {
          let total_win_amount = 0;
          let total_bet_amount = 0;

          for (let bet of bets) {
            let win_amount = 0;
            let playingSpot = parseInt(bet["spot"]);
            let betAmt = parseInt(bet["amount"]);
            total_bet_amount += betAmt;

            if (playingSpot === winningspot) {
              win_amount = betAmt * (rate - commonVar.adminCommisionRate);
              total_win_amount += win_amount;
            }

            sql = `UPDATE join_game SET  win_amount=? ,is_updated=?  WHERE game_id= ? AND room_id= ? AND user_id= ?  `;
            let update_sql = await db.query(sql, [
              win_amount,
              1,
              game_id,
              room_id,
              playerId,
            ]);
            if (update_sql != null && win_amount > 0) {
              sql = `UPDATE users SET  cash_balance= cash_balance + ?   WHERE id= ?  `;
              let saveBalance = await db.query(sql, [win_amount, playerId]);
            }
          }

          let winningAmount = total_win_amount - total_bet_amount;
          playeWinningArray.push({ playerId, winningAmount });
        }
      }
      debug("Winning amount successfuly updated in db");
    }

    return playeWinningArray;
  } catch (err) {
    debug(err);
  }
};

const gameMartixRecords = async (data) => {
  try {
    let limit = 105;
    let result = new Array(limit);
    let sql = `SELECT spot FROM (SELECT * FROM game_record_dragon
 ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`;
    let data = await db.query(sql, limit);
    if (isValidArray(data)) {
      result = data.map((win) => win.spot);
    }
    return result;
  } catch (err) {
    debug(err);
  }
};

// const gameMartixRecords = async(data) => {
//     try{

//         let limit = 210;
//         let maxColumn = 21;
//         let maxRow = 5;
//         let result = new Array(maxColumn);
//         let arr = [];
//         let sql =  `SELECT spot FROM game_record_TripleChan ORDER BY id DESC LIMIT ?`
//         let data = await db.query(sql,limit);
//         if(isValidArray(data)){

//             for (var i = 0; i < data.length; i++) {
//                 let len = arr.length;
//                 if((arr[len-1] != undefined) && (arr[len-1][0] === data[i].spot) && (arr[len-1].length < maxRow)) {
//                     arr[len-1].push(data[i].spot);
//                 }else{
//                     arr[len] = [data[i].spot]
//                     maxColumn--;
//                 }
//                 if(maxColumn === 0) break;
//             }
//             result = arr.reverse();
//         }
//         return result
//     } catch (err) {
//         debug(err);
//     }
// }

const gameSlotRecords = async (data) => {
  try {
    let limit = 10;
    let result = new Array(limit);
    let sql = `SELECT winNo1,winNo2 FROM (SELECT * FROM game_record_dragon
 ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC`;
    let data = await db.query(sql, limit);
    if (isValidArray(data)) {
      result = data.map((spot) => {
        return { D: spot.winNo1, T: spot.winNo2 };
      });
    }
    return result;
  } catch (err) {
    debug(err);
  }
};

module.exports = {
  JoinGame,
  lastWinningNo,
  getRoundCount,
  updateUserPoint,
  onchangePassword,
  updateWinningNo,
  onSenderNotification,
  onNotification,
  onSendPointsToPlayer,
  onAcceptPoints,
  userByEmail,
  onRejectPoints,
  updateWinningAmount,
  getUserBalance,
  getUserPoint,
  gameMartixRecords,
  gameSlotRecords,

  onUploadImage,
};
