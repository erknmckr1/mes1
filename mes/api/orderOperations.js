const CancelReason = require("../models/CancelReason");
const RepairReason = require("../models/RepairReason");
const Orders = require("../models/OrderTable")

//! Parametreye gore iptal sebeblerini cekecek query ( parametre url route dan alıyoruz.)
const getCancelReason = async ({ area_name }) => {
  try {
    const result = await CancelReason.findAll();
    return result;
    
  } catch (err) {
    console.error(err);
    throw err; // Hata fırlatmak, hatanın yukarıya doğru iletilmesini sağlar
  }
};

//! Tamir nedenlerini çekecek query
const getRepairReason = async ({area_name}) => {
  try {
    const result = await RepairReason.findAll({
      where:{
        area_name:area_name,
      }
    })
    return result;
  } catch (err) {
    throw err;
  }
}

//! Order id ye göre siparişi çekecek query...

module.exports = { getCancelReason,getRepairReason };
