const CancelReason = require("../models/CancelReason");
const RepairReason = require("../models/RepairReason");
const OrderTable = require("../models/OrderTable");
const Processes = require("../models/Processes");
const Machines = require("../models/Machines");
const WorkLog = require("../models/WorkLog");
const StoppedWorksLogs = require("../models/StoppedWorksLog");

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

const cancelWork = async ({ uniq_id }) => {
  try {
    const result = await WorkLog.destroy({
      where: {
        uniq_id: uniq_id
      }
    });
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

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
      return [{ machine_name: "Bu bölüme dahil bir makine yok..." }];
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

//! yeni bir iş başlatacak query
const createWork = async ({ work_info, currentDateTimeOffset }) => {
  const {
    user_id_dec,
    order_id,
    section,
    area_name,
    work_status,
    process_id,
    process_name,
    production_amount,
  } = work_info;

  // En büyük uniq_id'yi bul ve bir artır
  const latestWorkLog = await WorkLog.findOne({
    order: [["uniq_id", "DESC"]],
  });

  let newUniqId;
  if (latestWorkLog) {
    const latestId = parseInt(latestWorkLog.uniq_id, 10);
    newUniqId = String(latestId + 1).padStart(6, "0"); // 6 haneli sıralı ID oluştur
  } else {
    newUniqId = "000001"; // Eğer kayıt yoksa ilk ID'yi oluştur
  }

  try {
    const result = await WorkLog.create({
      uniq_id: newUniqId,
      user_id_dec: user_id_dec,
      order_no: order_id,
      section: section,
      area_name: area_name,
      work_status: work_status,
      process_id: process_id,
      work_start_date: currentDateTimeOffset,
      process_name: process_name,
      production_amount: production_amount,
    });

    return result;
  } catch (err) {
    throw err;
  }
};

//! Mevcut işleri çekecek query...
const getWorks = async ({ area_name, user_id_dec }) => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: area_name,
        user_id_dec: user_id_dec,
        work_status:"1"
      },
    });
    return result;
  } catch (err) {
    throw err;
  }
};
//! Bir birimin durdurulmus işlerini çekecek query... 
const getStoppedWorks = async({area_name,}) => {
  try {
    const result = await WorkLog.findAll({
      where:{
        area_name:area_name,
        work_status:"2"
      }
    });
    return result;
  } catch (err) {
    consıole.log()
  }
}

//! Seçili işi durduracak query...
const stopWork = async ({
  work_log_uniq_id,
  currentDateTimeOffset,
  stop_reason_id,
  order_id,
}) => {
  try {
    // İlgili uniq id ile olusturulmus bir stop işlemi var mı?
    const existingLog = await StoppedWorksLogs.findOne({
      where: {
        work_log_uniq_id,
        stop_end_date: null,
      },
    });

    if (existingLog) {
      throw new Error("Bu iş durdurulmus...");
    }

    // İlgili uniq id ile durdurma kaydı olustur...
    await StoppedWorksLogs.create({
      order_id,
      stop_start_date: currentDateTimeOffset,
      work_log_uniq_id,
      stop_reason_id,
    });

    // stop kaydını olusturduktan sonra durdurulan işin work_status degerını guncelle...
    await WorkLog.update(
      {
        work_status: "2",
      },
      {
        where: {
          uniq_id: work_log_uniq_id,
        },
      }
    );

    return { message: "İş başariyla durduruldu." };
  } catch (err) {
    throw err;
  }
};

//! Seçili işi yeniden baslatacak query...
const rWork = async ({ work_log_uniq_id, currentDateTimeOffset }) => {
  try {
    const stoppedWork = await StoppedWorksLogs.findOne({
      where: { work_log_uniq_id, stop_end_date: null },
      order: [['stop_start_date', 'DESC']],
    });

    if (!stoppedWork) {
      throw new Error("Durdurulmuş iş bulunamadı.");
    }

    await StoppedWorksLogs.update(
      {
        stop_end_date: currentDateTimeOffset,
      },
      {
        where: {
          id: stoppedWork.id, // durdurulmus ıd si durdurulmus ısı su sekılde anlıyoruz. Eğer ilgili iş(id) için bir tablo da bır durdurma kaydı yoksa yenı bır kayıt olusturuyoruz. Eğer stop_end_date dolu ıse iş tekrar baslamıstır. İşi yenıden baslatmak ıcın 
        },                    // stop_log tablosunda ılgılı durdurulmus ısın unıq ıd si ile stop_end_date i dolduruyoruz.
      }
    );

    await WorkLog.update(
      { work_status: "1" },
      { where: { uniq_id: work_log_uniq_id } } 
    );

    return { message: "İş başarıyla yeniden başlatıldı." };
  } catch (err) {
    throw err;
  }
};

//! Seçili işi bitirecek query...
const finishedWork = async ({
  uniq_id,
  currentDateTimeOffset,
  work_finished_op_dec,
  produced_amount,
  repair_amount,
  scrap_amount,
  repair_reason,
  scrap_reason,
  repair_reason_1,
  repair_reason_2,
  repair_reason_3,
  repair_reason_4,
  repair_section,
  end_desc
}) => {
  try {
    const result = await WorkLog.update(
      {
        work_status: "4",
        work_end_date: currentDateTimeOffset,
        uniq_id,
        work_finished_op_dec,
        produced_amount,
        repair_amount,
        scrap_amount,
        repair_reason,
        scrap_reason,
        repair_reason_1,
        repair_reason_2,
        repair_reason_3,
        repair_reason_4,
        repair_section,
        end_desc
      },
      {
        where: {
          uniq_id: uniq_id,
        },
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getCancelReason,
  getRepairReason,
  getOrder,
  getProcessList,
  getMachineList,
  createWork,
  getWorks,
  stopWork,
  rWork,
  finishedWork,
  cancelWork,
  getStoppedWorks
};
