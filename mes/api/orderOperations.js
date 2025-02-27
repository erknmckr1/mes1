const CancelReason = require("../models/CancelReason");
const { Op } = require("sequelize");
const RepairReason = require("../models/RepairReason");
const OrderTable = require("../models/OrderTable");
const Processes = require("../models/Processes");
const Machines = require("../models/Machines");
const WorkLog = require("../models/WorkLog");
const StoppedWorksLogs = require("../models/StoppedWorksLog");
const BreakLog = require("../models/BreakLog");
const SectionParticiptionLogs = require("../models/SectionParticiptionLogs");
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

//! Seçili siparişi iptal edecek servis grup olayı bu serviste yok...
const cancelWork = async ({ uniq_id, currentDateTimeOffset, currentUser,area_name }) => {
  try {
    // Bölüme katılacak kullanıcı molada mı ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id: currentUser,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message: "Moladayken siparişi iptal edemezsiniz.",
      };
    }

    //MOLA

      // Bölümde mi ? şimdilik sadece cekic bölümüne özel
  if (area_name === "cekic") {
    const isSectionParticipated = await SectionParticiptionLogs.findOne({
      where: {
        operator_id: currentUser,
        exit_time: null,
        area_name,
      },
    });

    if (!isSectionParticipated) {
      return {
        status: 400,
        message: "Bölüme katılım sağlamadan prosesi iptal  edemezsiniz.",
      };
    }
  }
  // bölüm ?

    const result = await WorkLog.update(
      {
        work_status: "3",
        work_end_date: currentDateTimeOffset,
        work_finished_op_dec: currentUser,
      },
      {
        where: {
          uniq_id: uniq_id,
        },
      }
    );
    return result;
  } catch (err) {
    console.log(err);
    throw err;
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

//! Ortak kullanılan fonksiyon
const generateUniqueId = async () => {
  const latestWorkLog = await WorkLog.findOne({ order: [["uniq_id", "DESC"]] });
  if (latestWorkLog) {
    const latestId = parseInt(latestWorkLog.uniq_id, 10);
    return String(latestId + 1).padStart(6, "0");
  }
  return "000001";
};

//! cekic ekranı ıcın ıs olusturacak servis...
const createCekicWorkLog = async ({
  work_info,
  currentDateTimeOffset,
  field,
}) => {
  const newUniqId = await generateUniqueId();
  const {
    user_id_dec,
    op_username,
    order_id,
    section,
    area_name,
    work_status,
    process_id,
    process_name,
    machine_name,
    production_amount,
  } = work_info;

  return await WorkLog.create({
    uniq_id: newUniqId,
    user_id_dec: user_id_dec,
    op_username: op_username,
    order_no: order_id,
    section: section,
    area_name: area_name,
    work_status: work_status,
    process_id: process_id,
    work_start_date: currentDateTimeOffset,
    process_name: process_name,
    production_amount: production_amount,
    machine_name,
    uniq_id: newUniqId,
    setup_start_date: currentDateTimeOffset,
    field,
  });
};

//! yeni bir iş başlatacak query
const createWork = async ({ work_info, currentDateTimeOffset }) => {
  const {
    user_id_dec,
    op_username,
    order_id,
    section,
    area_name,
    work_status,
    process_id,
    process_name,
    machine_name,
    production_amount,
    group_no,
    group_record_id,
    field,
  } = work_info;

  // Eğer "buzlama" ekranındaysak ve machine_name boşsa hata döndür
  if (area_name === "buzlama" && !machine_name) {
    return {
      status: 400,
      message: "Makine seçimi zorunludur.",
    };
  }

  let existingOrderCount = 0;
  if (area_name === "buzlama") {
    try {
      existingOrderCount = await WorkLog.count({
        where: {
          machine_name,
          order_no: order_id,
          work_status: {
            [Op.in]: ["1", "2"], // '1' veya '2' durumundaki işleri getir
          },
        },
      });
    } catch (err) {
      return {
        status: 500,
        message: "Mevcut iş kontrol edilirken bir hata oluştu.",
      };
    }
  }

  // Eğer sipariş zaten başlatılmışsa hata döndür
  if (area_name === "buzlama" && existingOrderCount > 0) {
    return {
      status: 303,
      message: `${machine_name} makinesinde ${order_id} siparişi zaten başlatılmış.`,
    };
  }

  // En büyük uniq_id'yi bul ve bir artır
  let newUniqId;
  try {
    const latestWorkLog = await WorkLog.findOne({
      order: [["uniq_id", "DESC"]],
    });

    newUniqId = latestWorkLog
      ? String(parseInt(latestWorkLog.uniq_id, 10) + 1).padStart(6, "0")
      : "000001";
  } catch (err) {
    return {
      status: 500,
      message: "Yeni iş ID'si oluşturulurken hata meydana geldi.",
    };
  }

  const workInfo = {
    uniq_id: newUniqId,
    user_id_dec,
    op_username,
    order_no: order_id,
    section,
    area_name,
    work_start_date: currentDateTimeOffset,
    work_status,
    process_id,
    process_name,
    production_amount,
    machine_name,
    group_no,
    group_record_id,
  };

  if (area_name === "cekic") {
    workInfo.field = field;
    workInfo.work_start_date = null;
  }

  try {
    const newWorkLog = await WorkLog.create(workInfo);

    return {
      status: 200,
      message: "İş başarıyla başlatıldı.",
      result: newWorkLog,
    };
  } catch (err) {
    return {
      status: 500,
      message: "İş başlatılırken bir hata meydana geldi.",
    };
  }
};

//! Mevcut işleri çekecek query...
const getWorks = async ({ area_name, user_id_dec }) => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: area_name,
        user_id_dec: user_id_dec,
        work_status: "1",
        // work_status: {
        //   [Op.in]: ["0", "1"] // work_status '0' veya '1' olanları çek
        // }
      },
    });
    return result;
  } catch (err) {
    throw err;
  }
};

//! Bir birimin durdurulmus işlerini çekecek query...
const getStoppedWorks = async ({ area_name }) => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: area_name,
        work_status: "2",
      },
    });
    return result;
  } catch (err) {
    console.log(err);
  }
};

//! Seçili işi durduracak query...
const stopWork = async ({
  work_log_uniq_id,
  currentDateTimeOffset,
  stop_reason_id,
  order_id,
  user_who_stopped,
  group_record_id,
  area_name,
}) => {
  // Molada ise hata nesnesi döndür
  const isBreakUser = await BreakLog.findOne({
    where: {
      operator_id: user_who_stopped,
      end_date: null,
    },
  });
  if (isBreakUser) {
    return {
      status: 400,
      message:
        "Moladayken prosesi durduramazsınız. Moladan dönüş işlemini gerçekleştirip tekrar deneyin.",
    };
  }

  // İlgili uniq id ile zaten durdurulmuş iş kontrolü

  // Bölümde mi ? şimdilik sadece cekic bölümüne özel
  if (area_name === "cekic") {
    const isSectionParticipated = await SectionParticiptionLogs.findOne({
      where: {
        operator_id: user_who_stopped,
        exit_time: null,
        area_name,
      },
    });

    if (!isSectionParticipated) {
      return {
        status: 400,
        message: "Bölüme katılım sağlamadan işi durduramazsınız.",
      };
    }
  }
  // bölüm ?

  const existingLogs = await StoppedWorksLogs.findAll({
    where: {
      work_log_uniq_id,
      stop_end_date: null,
    },
  });
  if (existingLogs.length > 0) {
    return { status: 400, message: "Bazı işler zaten durdurulmuş!" };
  }

  const stopLogs = work_log_uniq_id.map((id, index) => ({
    order_id: order_id[index],
    stop_start_date: currentDateTimeOffset,
    work_log_uniq_id: id,
    stop_reason_id,
    user_who_stopped,
  }));
  await StoppedWorksLogs.bulkCreate(stopLogs);
  await WorkLog.update(
    { work_status: "2" },
    { where: { uniq_id: work_log_uniq_id } }
  );
  return { status: 200, message: "İş başarıyla durduruldu." };
};

//! Seçili işleri yeniden başlatacak query...
const rWork = async ({
  currentDateTimeOffset,
  work_log_uniq_id,
  currentUser,
  startedUser,
  selectedOrders,
  area_name,
}) => {
  try {
    // İŞLEMİ YAPACAK KULLANICI MOLADA MI ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id: currentUser,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message:
          "Moladayken işleri başlatamazsınız. Moladan dönüş işlemini gerçekleştirip tekrar deneyin.",
      };
    }
    // MOLA
    // Bölümde mi ? şimdilik sadece cekic bölümüne özel
    if (area_name === "cekic") {
      const isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: {
          operator_id: currentUser,
          exit_time: null,
          area_name
        },
      });

      if (!isSectionParticipated) {
        return {
          status: 400,
          message: "Bölüme katılım sağlamadan işi yeniden başlatamazsınız.",
        };
      }
    }
    // bölüm ?
    // Seçilen tüm işlerin gerçekten durdurulmuş olup olmadığını kontrol et
    const stoppedWorks = await StoppedWorksLogs.findAll({
      where: {
        work_log_uniq_id,
        stop_end_date: null,
      },
      order: [["stop_start_date", "DESC"]],
    });

    if (stoppedWorks.length === 0) {
      throw new Error("Durdurulmuş iş bulunamadı.");
    }

    let workIdsToClose = []; // Eski işleri kapatılacaklar
    let workIdsToRestart = []; // Aynı kişi tarafından başlatılacak işler
    let newWorkTasks = []; // Yeni açılacak işler

    for (let i = 0; i < selectedOrders.length; i++) {
      const order = selectedOrders[i];
      const stoppedWork = stoppedWorks.find(
        (sw) => sw.work_log_uniq_id === order.uniq_id
      );

      if (!stoppedWork) {
        throw new Error(`Durdurulmuş iş bulunamadı: ${order.uniq_id}`);
      }

      // Eğer başlatan kişi ile durduran kişi aynıysa sadece yeniden başlat
      if (startedUser[i] === currentUser) {
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: currentUser,
          },
          {
            where: { id: stoppedWork.id },
          }
        );

        workIdsToRestart.push(order.uniq_id);
      }
      // Eğer başlatan kişi farklıysa, eski işi kapat ve yeni bir iş oluştur
      else {
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: currentUser,
          },
          {
            where: { id: stoppedWork.id },
          }
        );

        workIdsToClose.push(order.uniq_id); // Eski işin kapatılması gerekiyor

        // Yeni uniq_id oluştur
        const latestWorkLog = await WorkLog.findOne({
          order: [["uniq_id", "DESC"]],
        });

        let newUniqId = latestWorkLog
          ? String(parseInt(latestWorkLog.uniq_id, 10) + 1).padStart(6, "0")
          : "000001";

        // Yeni iş kaydı oluştur
        newWorkTasks.push({
          uniq_id: newUniqId,
          user_id_dec: currentUser,
          order_no: order.order_no,
          section: order.section,
          area_name: order.area_name,
          work_status: "1", // Yeni iş başlatılıyor
          process_id: order.process_id,
          work_start_date: currentDateTimeOffset,
          process_name: order.process_name,
          production_amount: order.production_amount,
          machine_name: order?.machine_name || null, // Buzlama için makine adı eklenmeli
        });
      }
    }

    // Eski işleri kapat (work_status = 4 yap)
    if (workIdsToClose.length > 0) {
      await WorkLog.update(
        {
          work_status: "4", // İş kapatıldı
          work_end_date: currentDateTimeOffset,
          work_finished_op_dec: currentUser,
          produced_amount: 0,
        },
        { where: { uniq_id: workIdsToClose } }
      );
    }

    // Aynı kişi tarafından başlatılan işleri yeniden başlat (work_status = 1 yap)
    if (workIdsToRestart.length > 0) {
      await WorkLog.update(
        { work_status: "1" },
        { where: { uniq_id: workIdsToRestart } }
      );
    }

    // Yeni iş kaydı oluştur
    if (newWorkTasks.length > 0) {
      await WorkLog.bulkCreate(newWorkTasks);
    }

    return { message: "İş(ler) başarıyla yeniden başlatıldı." };
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
  end_desc,
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
        end_desc,
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
  getStoppedWorks,
  createCekicWorkLog,
};
