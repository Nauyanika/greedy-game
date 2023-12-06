const bcrypt = require("bcrypt");
// const check = require('../validation/CheckValidation')
const conn = require("../config/db");
const moment = require("moment");
//const { authToken } = require("../middleware/getToken");
//User login
var nodemailer = require("nodemailer");
const e = require("express");
const axios = require("axios");
let userId=""
const authAdminLogin = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let error = {};
  let data = {};
  let token;
  try {
    // Check requeted user is exist or not
    const { username, email, password } = req.body;
    let sql = `SELECT * FROM admin INNER JOIN roles ON roles.role_id = admin.role_id WHERE LOWER(admin.email)= ? OR admin.username = ? limit ?`;
    let user = await conn.query(sql, [email.toLowerCase(), username, 1]);
    if (user.length > 0) {
      const usersRows = JSON.parse(JSON.stringify(user))[0];
      const comparison = await bcrypt.compare(password, usersRows.password);
      if (comparison) {
        const last_login = moment().format("YYYY-MM-DD HH:mm:ss");
        statusCode = 200;
        message = "Login success";
        data = {
          user_id: usersRows.admin_id,
          role_id: usersRows.role_id,
          role_name: usersRows.name,
          username: usersRows.username,
        };
        let auth = {
          id: usersRows.admin_id,
          user_id: usersRows.admin_id,
          role_id: usersRows.role_id,
          role_name: usersRows.name,
        };
        const tokens = await authToken(auth);
        token = tokens;
      } else {
        statusCode = 401;
        message = "Password does not match!";
        error.password = "err";
      }
    } else {
      // check user
      let sql = `SELECT * FROM distributor INNER JOIN roles ON roles.role_id = distributor.role_id WHERE distributor.distributor_id= ? limit ?`;
      const users = await conn.query(sql, [username, 1]);
      if (users.length > 0) {
        const usersRows = JSON.parse(JSON.stringify(users))[0];
        const comparison = await bcrypt.compare(password, usersRows.password);
        if (comparison) {
          if (usersRows.IsBlocked !== 1) {
            const LastLoggedIn = moment().format("YYYY-MM-DD HH:mm:ss");
            statusCode = 200;
            message = "Login success";
            data = {
              user_id: usersRows.id,
              role_id: usersRows.role_id,
              role_name: usersRows.name,
              username: usersRows.username
                ? usersRows.username
                : `Guest00${usersRows.id}`,
            };
            let auth = {
              id: usersRows.id,
              user_id: usersRows.distributor_id,
              role_id: usersRows.role_id,
              role_name: usersRows.name,
            };
            const tokens = await authToken(auth);
            sql = "UPDATE distributor Set ? WHERE id= ?";
            await conn.query(sql, [{ LastLoggedIn }, usersRows.id]);
            token = tokens;
          } else {
            statusCode = 401;
            message = "Account is blocked";
            data = {};
          }
        } else {
          statusCode = 401;
          message = "Password does not match!";
          error.password = "err";
        }
      } else {
        // check user
        let sql = `SELECT * FROM user INNER JOIN roles ON roles.role_id = user.role_id WHERE user.user_id= ? limit ?`;
        const users = await conn.query(sql, [username, 1]);
        if (users.length > 0) {
          const usersRows = JSON.parse(JSON.stringify(users))[0];
          const comparison = await bcrypt.compare(password, usersRows.password);
          if (comparison) {
            if (usersRows.IsBlocked !== 1) {
              const last_logged_in = moment().format("YYYY-MM-DD HH:mm:ss");
              statusCode = 200;
              message = "Login success";
              data = {
                user_id: usersRows.id,
                role_id: usersRows.role_id,
                role_name: usersRows.name,
                username: usersRows.username
                  ? usersRows.username
                  : `Guest00${usersRows.id}`,
              };
              let auth = {
                id: usersRows.id,
                user_id: usersRows.user_id,
                role_id: usersRows.role_id,
                role_name: usersRows.name,
              };
              const tokens = await authToken(auth);
              sql = "UPDATE user Set ? WHERE id= ?";
              await conn.query(sql, [{ last_logged_in }, usersRows.id]);
              token = tokens;
            } else {
              statusCode = 401;
              message = "Account is blocked";
              data = {};
            }
          } else {
            statusCode = 401;
            message = "Password does not match!";
            error.password = "err";
          }
        } else {
          statusCode = 404;
          message = "User not exist";
        }
      }
    }
    const responseData = {
      status: statusCode,
      message,
      token,
      user: data,
      errors: error,
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.send({ authLogin: error });
  }
};

/* const authLogin = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let error = {};
  console.log(req.body);

  let data = {};

  try {
    //    Check requeted user is exist or not
    //const { email, password } = req.body;
    const { userId } = req.body.userId;

    let sql = `SELECT * FROM users WHERE LOWER(users.useremail)= ? `;
    let user = await conn.query(sql, [email.toLowerCase()]);
    if (user.length > 0) {
      const usersRows = JSON.parse(JSON.stringify(user))[0];
      const comparison = await bcrypt.compare(password, usersRows.password);

      var res = await axios.put(
        "https://yara-api.strivemindz.com/api/v1/user-balance",
        {
          userId: userId,
          
        }
      );
  
console.log("res---",res.data)
 if (comparison!=0) {
        const last_login = moment().format("YYYY-MM-DD HH:mm:ss");
        statusCode = 200;
        message = "Login success";
        data = {
          balance: usersRows.point,
          user_id: usersRows.user_id,

          //   user_id:1,role_id:1,role_name:"Super Admin",
          login: true,
          profile: {
            firstname: usersRows.first_name,
            lastname: usersRows.last_name,
            email: usersRows.useremail,
            //phone:usersRows.phone,
            cashbalance: usersRows.cash_balance,
            safe_balance: usersRows.safe_balance,
            winning_balance: usersRows.winning_balance,
            bonus_amount: usersRows.bonus_amount,
            coin_balance: usersRows.coin_balance,
          },
          username: usersRows.username,
        };

        /*  let auth ={
                    //    id: usersRows.admin_id,
                     //   user_id: usersRows.admin_id,
                       // role_id :usersRows.role_id,
                      //  role_name :usersRows.name,  
                 //   } 
        //  const tokens = await authToken(auth);
        //token = tokens
      } else {
        statusCode = 401;
        message = "Password does not match!";
      }
    } else {
      statusCode = 401;
      message = "Password or email does not match!";
    }
    const responseData = {
      status: statusCode,
      message,
      user: data,
      errors: error,
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiU3VwZXIgQWRtaW4iLCJyb2xlX2lkIjoxLCJhZG1pbl9pZCI6MSwiaWF0IjoxNjUzMTMwNDMwLCJleHAiOjE2NTMxMzQwMzB9.hU41Zvx5uoaI7Nt46LaL8GFjTjAXUnet6GKhc5Ku4TA",
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.send({ authLogin: error });
  }
};
 */


const authLogin = async (req, response) => {
  let error = {};
console.log(req.body)
  let data = {};
const userId= req.body.userId
try{
      var res = await axios.put(
        "https://api-uat.yaravoice.com/api/v1/user-balance",
        {
          userId: userId,
          
        }
      );
  
console.log("res---",res.data)
    const responseData = {
      status:res.data.status,
      message:res.data.message,
      result:res.data.result,
      errors: error,
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiU3VwZXIgQWRtaW4iLCJyb2xlX2lkIjoxLCJhZG1pbl9pZCI6MSwiaWF0IjoxNjUzMTMwNDMwLCJleHAiOjE2NTMxMzQwMzB9.hU41Zvx5uoaI7Nt46LaL8GFjTjAXUnet6GKhc5Ku4TA",
    };
    response.send(responseData);
  }catch (error) {
    console.log(error);
    response.send({ authLogin: error });
    }
};




const authSignUp = async (req, res) => {
  let message = null;
  let register = false;

  let statusCode = 400;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //user: "otp.nms@gmail.com",
        //user: "bigwinnerjackpot1@gmail.com",
        //pass: "Nmsgames@07",
        // pass: "spM@2126000",
        user: "otp.nms@gmail.com",
        pass: "qlholtlqogsewieo",
      },
    });

    const { username, email, password, phone, cash_balance } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9999);
    const last_minute = moment().format("YYYY-MM-DD HH:mm:ss");

    const encryptedPassword = await bcrypt.hash(password, 10);
    const formData = {
      username: username,
      useremail: email,
      phone: phone,
      password: encryptedPassword,
      otp: otp,
      otp_time: last_minute,
      cash_balance: cash_balance,
    };

    // Check requeted user is exist or not
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let user = await conn.query(sql, [formData.useremail.toLowerCase(), 1]);
    if (user.length > 0) {
      statusCode = 401;
      message = "Sorry! Email already exist try another email";
    } else {
      const sql1 = `INSERT INTO users set ?`;
      const users = await conn.query(sql1, formData);
      // Sent mail
      transporter
        .sendMail({
          // from: "otp.nms@gmail.com",
          from: "otp.nms@gmail.com",
          // from: "bigwinnerjackpot1@gmail.com", // sender address
          to: email, // list of receivers
          subject: "OTP Verfications", //  Subject line
          html: `<b>The OTP is ${otp}. <br>This OTP generated at ${last_minute} and valid for 5 Minutes.</b>`, //html body
        })
        .then((info) => {
          console.log({ info });
        })
        .catch(console.error);

      if (users) {
        statusCode = 201;
        message =
          "User created success,An email sent with OTP on your register email address";
        register = true;
      } else {
        statusCode = 500;
        message = "Something went wrong! database error";
      }
    }

    const responseData = {
      status: statusCode,
      message,
      register,
    };
    res.send(responseData);
  } catch (error) {
    res.send({ error: error });
  }
};

const forgotPassword = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let data = {};
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        // user: "otp.nms@gmail.com",
        // pass: "Nmsgames@07",
        user: "otp.nms@gmail.com",
        pass: "qlholtlqogsewieo",
      },
    });
    console.log("RESPOSES", data);

    const { email } = req.body;
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let user = await conn.query(sql, [email.toLowerCase(), 1]);
    if (user.length > 0) {
      const otp = Math.floor(1000 + Math.random() * 9999);
      const last_minute = moment().format("YYYY-MM-DD HH:mm:ss");
      //Sent mail
      transporter
        .sendMail({
          from: "otp.nms@gmail.com", //sender address
          to: email, // list of receivers
          subject: "OTP Verfications", // Subject line
          html: `<b>The OTP is ${otp}. <br>This OTP generated at ${last_minute} and valid for 5 Minutes.</b>`, // html body
        })
        .then((info) => {
          console.log({ info });
        })
        .catch(console.error);
      const formData = {
        otp: otp,
        otp_time: last_minute,
      };
      let sql1 = "UPDATE users Set ? WHERE useremail= ?";
      await conn.query(sql1, [formData, email]);
      statusCode = 200;
      message = "Otp have sent on your registered email address!";
      const usersRows = JSON.parse(JSON.stringify(user))[0];
      data = {
        user_id: usersRows.user_id,
        email: usersRows.useremail,
        phone: usersRows.phone,
      };
    } else {
      statusCode = 404;
      message = "Sorry! Email does not exist!";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.send({ error: error });
  }
};

const resetPassword = async (req, res) => {
  let message = null;
  let statusCode = 400;
  try {
    const { email, new_password, old_password } = req.body;

    const encryptedPassword = await bcrypt.hash(old_password, 10);
    // Check requeted user is exist or not
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ?  limit ?`;
    let user = await conn.query(sql, [email.toLowerCase(), 1]);
    if (user.length > 0) {
      const usersRows = JSON.parse(JSON.stringify(user))[0];
      const comparison = await bcrypt.compare(old_password, usersRows.password);
      if (comparison) {
        const encryptedPassword2 = await bcrypt.hash(new_password, 10);

        let sql2 = "UPDATE users Set password=? WHERE useremail= ?";
        const user = await conn.query(sql2, [encryptedPassword2, email]);
        if (user) {
          statusCode = 200;
          message = "Password reset successfully";
        } else {
          statusCode = 500;
          message = "Something Went wrong";
        }
      } else {
        statusCode = 401;
        message = "Password does not match!";
      }
    } else {
      statusCode = 404;
      message = "Sorry Invalid email or password";
    }

    const responseData = {
      status: statusCode,
      message,
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.send({ error: error });
  }
};

const authVerifyemail = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let data = {};
  try {
    const { email, otp } = req.body;
    console.log("response", req.body);
    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let user = await conn.query(sql, [email, 1]);
    if (user.length > 0) {
      const formData = {
        otp_verified: 1,
      };
      const usersRows = JSON.parse(JSON.stringify(user))[0];

      if (usersRows.otp == otp) {
        let sql1 = "UPDATE users Set ? WHERE useremail= ?";
        await conn.query(sql1, [formData, email]);
        statusCode = 200;
        message = "Otp verified!";
        data = {
          user_id: usersRows.user_id,
          email: usersRows.useremail,
          phone: usersRows.phone,
        };
      } else {
        statusCode = 404;
        message = "Sorry! OTP does not match!";
      }
    } else {
      statusCode = 404;
      message = "Sorry! Email does not exist!";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.send({ error: error });
  }
};

const authVerifyForgetOTP = async (req, res) => {
  let message = null;
  let statusCode = 400;
  let data = {};
  try {
    const { email, otp, new_password, old_password } = req.body;
    const encryptedPassword = await bcrypt.hash(new_password, 10);

    let sql = `SELECT * FROM users WHERE LOWER(useremail)= ? limit ?`;
    let user = await conn.query(sql, [email.toLowerCase(), 1]);
    if (user.length > 0) {
      const formData = {
        password: encryptedPassword,
      };
      const usersRows = JSON.parse(JSON.stringify(user))[0];

      if (usersRows.otp == otp) {
        let sql1 = "UPDATE users Set ? WHERE useremail= ?";
        await conn.query(sql1, [formData, email]);
        statusCode = 200;
        message = "Otp verified and password reset sucessfully!";
        data = {
          user_id: usersRows.user_id,
          email: usersRows.useremail,
          phone: usersRows.phone,
        };
      } else {
        statusCode = 404;
        message = "Sorry! OTP does not match!";
      }
    } else {
      statusCode = 404;
      message = "Sorry! Email does not exist!";
    }
    const responseData = {
      status: statusCode,
      message,
      data,
    };
    res.send(responseData);
  } catch (error) {
    res.send({ error: error });
  }
};

module.exports = {
  authLogin,
  authSignUp,
  forgotPassword,
  resetPassword,
  authVerifyemail,
  authVerifyForgetOTP,
  authAdminLogin,
};
