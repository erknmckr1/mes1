const LeaveReason = require("../models/LeaveReasons")


//! İzin sebeplerini dönecek fonksiyon
const getLeaveReasons = async () => {
    try {
        const result = await LeaveReason.findAll();
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {getLeaveReasons};