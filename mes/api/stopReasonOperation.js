const StopReason = require("../models/StopReason");

//! durdurma sebeplerini bölüme göre getirecek metot... getirecek query...
const getStopReason = async ({ area_name }) => {
    console.log(area_name)
  try {
    const stopReason = await StopReason.findAll({
        where:{
            area_name:area_name
        }
    });
    return stopReason;
  } catch (err) {
    console.error("Error querying stop reasons:", err);
    throw err;
  }
};

module.exports = getStopReason;
