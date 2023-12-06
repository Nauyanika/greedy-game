const debug = require("debug")("test");
const db = require("../config/db.js");


const changeStatus = async(status,playerId) => {
    try{
        sql = `UPDATE users SET is_login= ? WHERE id= ? `;
        let changeStatus = await db.query(sql,[status,playerId]);
        return;
    } catch (err) {
        console.log(err);
        debug(err);
    }     
}



module.exports = {changeStatus};