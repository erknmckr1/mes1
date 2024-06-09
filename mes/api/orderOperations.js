const CancelReason = require("../models/CancelReason");
const RepairReason = require("../models/RepairReason");
const OrderTable = require("../models/OrderTable");
const Processes = require("../models/Processes");
const Machines = require("../models/Machines");
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
const getRepairReason = async ({ area_name }) => {
  try {
    const result = await RepairReason.findAll({
      where: {
        area_name: area_name,
      },
    });
    return result;
  } catch (err) {
    throw err;
  }
};

//! Bolume gore proses listesini getırecek query...
const getProcessList = async ({ area_name }) => {
  try {
    const result = await Processes.findAll({
      where: {
        area_name: area_name,
      },
    });
    return result;
  } catch (error) {
    console.log(err);
  }
};

//! Bölüme göre makine listesini getirecek query...
const getMachineList = async ({ area_name }) => {
  try {
    const result = await Machines.findAll({
      where: {
        area_name: area_name,
      },
    });

    
    if (result.length > 0) {
      return result;
    } else {
      return [{machine_name : "Bu bölüme dahil bir makine yok..."}]
    }

  } catch (err) {
    console.log(err);
  }
};

//! Order id ye göre siparişi çekecek query...
const getOrder = async ({ id }) => {
  try {
    const result = await OrderTable.findOne({
      where: {
        ORDER_ID: id,
      },
    });
    return result;
  } catch (err) {
    console.error("Sipariş sorgulanırken hata:", err);
    throw err;
  }
};

module.exports = { getCancelReason, getRepairReason, getOrder, getProcessList,getMachineList };
