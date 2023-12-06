const bcrypt = require("bcrypt");
//const check = require('../validation/CheckValidation')
const conn = require("../config/db");
const moment = require("moment");
//const {authToken} =require('../middleware/getToken')
// User login
var nodemailer = require("nodemailer");


const axios = require("axios");

//list of getPlayerDAta
const getPlayerData = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT id,username,useremail,point FROM  users`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {

      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const getAllUser = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM  users`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const getPlayerHistoryData = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT user.id,user.user_id,user.username,game_name.game_name FROM  user left join round_report on user.user_id=round_report.player_id left join game_name on round_report.game=game_name.id`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};
/* const WheelOfFortunegetPlayerHistoryData = async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM game_record_wheeloffortune ORDER BY created DESC  `;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent not found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error' )
    }
}

const PokergetPlayerHistoryData = async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM game_record_pokerking ORDER BY created DESC`;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent not found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error' )
    }
}
const TigerVsElephantgetPlayerHistoryData = async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM game_record_dragon ORDER BY created DESC `;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent not found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error' )
    }
} */
/* const LuckyBallgetPlayerHistoryData = async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM game_record_lucky ORDER BY created DESC`;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent not found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error' )
    }
} */

const TitaligetPlayerHistoryData = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM game_record_titali ORDER BY created DESC`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const DragonVsTigergetPlayerHistoryData = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM game_record_dragon ORDER BY created DESC`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const Transaction = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM transactions ORDER BY created DESC`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

//Playerpointhistory
const getPlayerPointHistory = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT user.id,user.user_id,user.username,game_record_dragon.game_id,game_record_dragon.created_at FROM user left join game_record_dragon on user.user_id=game_record_dragon.user_id`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agenot found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

/* //GamesHistory------------------
const getDoubleChanceHistory= async (req, res) => {
    let message = null
    let statusCode = 400  
    let data;
    try { 
           // let sql = `SELECT * FROM round_report WHERE game=1 and outer_win=NULL and inner_win=NULL `;
           let sql = `SELECT * FROM round_report WHERE game=1 `;

            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "NOT found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error 1')
    }
}
const getJeetoJokerHistory= async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM round_report WHERE game=2 `;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error 1')
    }
}
const get16CardsHistory= async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM round_report WHERE game=3`;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error 1')
    }
}
const getSpinGameHistory= async (req, res) => {
    let message = null
    let statusCode = 400  
    try { 
            let sql = `SELECT * FROM round_report WHERE game=4 `;
            const agent = await conn.query(sql)
            if(agent.length>0){ 
                statusCode = 200
                message    = "success" 
                data = agent
            }else{
                statusCode = 404
                message    = "Agent found"
            } 
            const responseData = {
                status: statusCode,
                message, 
                data
            }
            res.send(responseData)
     
    } catch (error) {
        res.status(500).send('Database error 1')
    }
}

 */

const sendPoints = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let sql = "";
  let responseData;
  let updateResponse;
  try {
    const { id, points } = req.body;

    let formData = {
      useremail: id,
      cash_balance: points,
    };
    let formData1 = {
      receiver: id,
      sender: "Company",
      point: points,
    };

    if (points) {
      sql = `SELECT * FROM users WHERE id = ? limit ?`;
      responseData = await conn.query(sql, [id, 1]);
      if (responseData.length > 0) {
        console.log(responseData, "responseData");
        statusCode = 404;
        let stokezPointId = responseData[0].id;
        //const tpoints = parseInt(points) + (responseData[0].point);
        const tpoints =
          parseInt(points) + parseInt(responseData[0].cash_balance);

        sql = "UPDATE users SET ? WHERE id=?";
        // updateResponse = await conn.query(sql, [{ point: tpoints }, id]);
        updateResponse = await conn.query(sql, [{ cash_balance: tpoints }, id]);
        if (updateResponse) {
          // statusCode = 200
          // message    = "Points updated"

          // sql = "INSERT INTO  point_history SET ?";
          sql = "INSERT INTO  users SET ?";
          const userss = await conn.query(sql, formData);
          if (userss) {
            statusCode = 200;
            message = "Points updated";
          } else {
            statusCode = 500;
            message = "Something went wrong! database error";
          }
        } else {
          statusCode = 500;
          message = "Something went wrong! database error";
        }
      }
    } else {
      statusCode = 404;
      message = "Points required";
    }

    const responseDatajson = {
      status: statusCode,
      message,
    };
    res.send(responseDatajson);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const PointHistory = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM point_history order by createdat desc `;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const payment = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let sql = "";
  let responseData;
  let updateResponse;
  try {
    let sql = "INSERT INTO payment_detail SET ?";
    let formData1 = {
      userid: req.body.userid,
      amount: req.body.amount,
      payment_methode_id: req.body.paymentid,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "payment updated";
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

/*********************************************************************************************** */
const Bank = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let sql = "";
  let responseData;
  let updateResponse;
  try {
    let sql = "INSERT INTO bank SET ?";
    console.log(req.body);
    let formData1 = {
      actual_name: req.body.actual_name,
      ifsc_code: req.body.ifsc_code,
      account_number: req.body.account_number,
      upi_address: req.body.upi_address,
      emailId: req.body.emailId,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "Bank detail updated";
    } else {
      statusCode = 500;
      message = "Something went wrong! database error";
    }

    const responseDatajson = {
      status: statusCode,
      message,
    };
    res.send(responseDatajson);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const UPI = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let sql = "";
  let responseData;
  let updateResponse;
  try {
    let sql = "INSERT INTO upi SET ?";
    let formData1 = {
      actual_name: req.body.actual_name,
      upi_address: req.body.upi_address,
      emailId: req.body.emailId,
      // payment_methode_id: req.body.paymentid,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "UPI updated";
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

const getfetchBank = async (req, res) => {
  let message = null;
  let statusCode = 400;
  var data = {};
  const { emailId } = req.body;
  try {
    let sql = `SELECT * FROM  bank where emailId=?`;
    const agent = await conn.query(sql, emailId);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";

      var data1 = {};
      // data1.status = 200;
      // data1.message = "success";
      /*  var UPI = {};
      UPI.id = agent[0].id;
      UPI.actual_name = agent[0].actual_name;
      UPI.upi_address = agent[0].upi_address;
      data1.UPI = UPI;
      */ var account = {};

      account.ifsc_code = agent[0].ifsc_code;
      account.account_number = agent[0].account_number;
      account.actual_name = agent[0].actual_name;
      data1.account = account;
      data = data1;
    } else {
      statusCode = 404;
      message = "detail not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

/* const fetchUPIBank = async (req, res) => {
  let message = null;
  let statusCode = 400;
  var data = {};
  const { emailId } = req.body;
  try {
    let sql = `SELECT * FROM  bank where emailId=?`;
    const agent = await conn.query(sql, emailId);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";

      var data1 = {};
      // data1.status = 200;
      // data1.message = "success";
      var UPI = {};
      UPI.id = agent[0].id;
      UPI.actual_name = agent[0].actual_name;
      UPI.upi_address = agent[0].upi_address;
      data1.UPI = UPI;
      var account = {};

      account.ifsc_code = agent[0].ifsc_code;
      account.account_number = agent[0].account_number;
      account.actual_name = agent[0].actual_name;
      data1.account = account;
      data = data1;
    } else {
      statusCode = 404;
      message = "detail not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};
 */

const fetchUPIBank = async (req, res) => {
  let message = null;
  let statusCode = 400;
  var data = {};
  const { emailId } = req.body;
  try {
    let sql = `SELECT * FROM  bank ,upi where  bank.emailId=upi.emailId`;
    const agent = await conn.query(sql, emailId);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";

      var data1 = {};
      // data1.status = 200;
      // data1.message = "success";
      var UPI = {};
      UPI.id = agent[0].id;
      UPI.actual_name = agent[0].actual_name;
      UPI.upi_address = agent[0].upi_address;
      data1.UPI = UPI;
      var account = {};

      account.ifsc_code = agent[0].ifsc_code;
      account.account_number = agent[0].account_number;
      account.actual_name = agent[0].actual_name;
      data1.account = account;
      data = data1;
    } else {
      statusCode = 404;
      message = "detail not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const withdrawRequest = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let sql = "";
  let responseData;
  let updateResponse;
  try {
    let sql = "INSERT INTO withdraw_requests SET ?";
    let formData1 = {
      email: req.body.email,
      amount: req.body.amount,
      //payment_methode_id: req.body.paymentid,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "withdraw updated";
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

const getwithdrawRequest = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM  withdraw_requests`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const getUPI = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM  upi`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "Agent not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const getBank = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    let sql = `SELECT * FROM  bank`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      data = agent;
    } else {
      statusCode = 404;
      message = "detail not found";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const updateScore = async (req, res) => {
  // console.log("playerId:", playerId, "points:", points);
  const { useremail, score } = req.body;
  let statusCode = 400;
  let message = null;
  try {
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let responseData = await conn.query(sql, [useremail, 1]);
    if (responseData.length > 0) {
      sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
      responseData = await conn.query(sql, [useremail, 1]);
      if (responseData.length > 0) {
        const tpoints = parseInt(score) + parseInt(responseData[0].point);
        sql = "UPDATE users SET point= ? WHERE useremail=?";

        const userss = await conn.query(sql, [tpoints, useremail]);
        console.log(userss);
        if (userss) {
          statusCode = 200;
          message = "done";
        } else {
        }
      }
    } else {
      statusCode = 500;
      message = "Something went wrong! database error";
    }
    res.send({ statusCode, message });
  } catch (err) {
    console.log(err);
  }
};

const ispaymentdone = async (req, res) => {
  let message = null;
  let statusCode = 400;
  const useremail = req.body.useremail;
  try {
    let sql = `SELECT ispaid FROM  users where useremail=?`;
    const agent = await conn.query(sql, useremail);
    if (agent.length > 0) {
      if (agent[0].ispaid == 1) {
        statusCode = 200;
        message = "true";
      } else {
        statusCode = 201;
        message = "false";
      }
      data = agent;
    } else {
      statusCode = 404;
      message = "user does not exist";
    }
    const responseData = {
      status: statusCode,
      message,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send("Database error");
  }
};

const leaderlist = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let data;
  //const playerId = req.body.playerId;
  try {
    /* let sql = `SELECT username,point FROM  users order by point desc limit 20`;
    const agent = await conn.query(sql);
    if (agent.length > 0) {
      statusCode = 200;
      message = "success";
      
      data = agent;
    } else {
      statusCode = 404;
      message = "user does not exist";
    }
     */  var rest = await axios.put(
      "https://api-uat.yaravoice.com/api/v1/leader-board"
     
    );
    console.log("rest---",rest.data)


    
    
    const responseData = {
     // status: statusCode,
      message:"leaderboard_list",
      data:rest.data
    };
    res.send(responseData);
  } catch (error) {
    console.log("error.............",error)
    res.status(500).send("Database error");
  }
};

/* const winResult = async (req, res) => {
  // console.log("playerId:", playerId, "points:", points);
  const { useremail, score } = req.body;
  let statusCode = 400;
  let message = null;
  try {
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let responseData = await conn.query(sql, [useremail, 1]);
    if (responseData.length > 0) {
      sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
      responseData = await conn.query(sql, [useremail, 1]);
      if (responseData.length > 0) {
        const tpoints = parseInt(score) + parseInt(responseData[0].point);
        sql = "UPDATE users SET point= ? WHERE useremail=?";

        const userss = await conn.query(sql, [tpoints, useremail]);
        console.log(userss);
        if (userss) {
          statusCode = 200;
          message = "done";
        } else {
        }
      }
    } else {
      statusCode = 500;
      message = "Something went wrong! database error";
    }
    res.send({ statusCode, message });
  } catch (err) {
    console.log(err);
  }
};
 */
module.exports = {
  /* createDistrubutor ,
    createStokez,
    createAgent,
    createPlayer,
    createUser,  
    getUsers,
    getAdminData,
    sendPoints,
    changePassword,
    resetPassword,
    getAgents,
    getAgentsData, */
  getPlayerData,
  getPlayerHistoryData,
  sendPoints,
  PointHistory,

  payment,

  withdrawRequest,
  Bank,
  UPI,
  getUPI,
  getBank,
  getwithdrawRequest,
  fetchUPIBank,

  getfetchBank,
  updateScore,
  //getAllPlayerData,
  /* WheelOfFortunegetPlayerHistoryData,
     PokergetPlayerHistoryData,
    TigerVsElephantgetPlayerHistoryData, */
  /* LuckyBallgetPlayerHistoryData, */
//winResult,
  TitaligetPlayerHistoryData,
  DragonVsTigergetPlayerHistoryData,
  getAllUser,
  Transaction,
  ispaymentdone,
  leaderlist,

  /* getStokezPointHistory,
    getAgentPointHistory,
    getPlayerPointHistory,
    getDoubleChanceHistory,
    getJeetoJokerHistory,
    get16CardsHistory,
    getSpinGameHistory,
 */
};
