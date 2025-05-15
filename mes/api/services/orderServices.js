const OrderTable = require("../../models/OrderTable");
const WorkLog = require("../../models/WorkLog");
const GroupRecords = require("../../models/GroupRecords");
const User = require("../../models/User");
const StoppedWorksLogs = require("../../models/StoppedWorksLog");
const StopReason = require("../../models/StopReason");
const CancelReason = require("../../models/CancelReason");
const { Op, json } = require("sequelize");
const MeasureData = require("../../models/MeasureData");
const ConditionalFinishReason = require("../../models/ConditionalFinishReasons");
const Zincir50CMGR = require("../../models/Zincir50CMGR");
const sequelize = require("../../lib/dbConnect");
const PureGoldScrapMeasurements = require("../../models/PureGoldScrapMeasurements");
const SectionParticiptionLogs = require("../../models/SectionParticiptionLogs");
const BreakLog = require("../../models/BreakLog");
const RepairReason = require("../../models/RepairReason");
const Processes = require("../../models/Processes");
const Machines = require("../../models/Machines");
const Sequelize = require("sequelize");
const { current } = require("@reduxjs/toolkit");
const { data } = require("autoprefixer");
// utils
const { closeOpenStops } = require("../utils/orderUtils");

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
    await closeOpenStops({ uniq_id, closeDate: currentDateTimeOffset });

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

//! Seçili işleri yeniden başlatacak query...
const rWork = async ({
  currentDateTimeOffset,
  work_log_uniq_id,
  currentUser,
  startedUser,
  selectedOrders,
  area_name,
  field,
  machine_name,
}) => {
  try {
    // 1. MOLADA MI?
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

    // 2. CEKIC ALANIYSA BÖLÜMDE Mİ?
    if (area_name === "cekic" && field !== "makine") {
      const whereClause = {
        operator_id: currentUser,
        exit_time: null,
        area_name,
      };

      // Eğer alan telcekme ise selectedMachine de kontrol edilsin
      if (area_name === "telcekme") {
        whereClause.machine_name = machine_name;
      }

      const isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: whereClause,
      });

      if (!isSectionParticipated) {
        return {
          status: 400,
          message: "Bölüme katılım sağlamadan işi yeniden başlatamazsınız.",
        };
      }

      if (isSectionParticipated.field !== field) {
        return {
          status: 400,
          message: `Şu anda ${isSectionParticipated.field} alanında çalışıyorsunuz. Önce çıkış yapıp ${field} alanına giriş yapmalısınız.`,
        };
      }
    }

    // 3. DURDURULMUŞ İŞLERİ BUL
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

    // 4. DEĞİŞKENLER
    let workIdsToClose = [];
    let workIdsToRestart = [];
    let newWorkTasks = [];

    // 5.  exit_time dolu olan geçmiş katılım kayıtları
    const getExitedLogs = async (uniq_id) => {
      return await SectionParticiptionLogs.findAll({
        where: {
          uniq_id,
          exit_time: {
            [Op.not]: null,
          },
          status: "2",
        },
      });
    };

    // 6. DÖNGÜ
    for (let i = 0; i < selectedOrders.length; i++) {
      const order = selectedOrders[i];
      const stoppedWork = stoppedWorks.find(
        (sw) => sw.work_log_uniq_id === order.uniq_id
      );

      if (!stoppedWork)
        throw new Error(`Durdurulmuş iş bulunamadı: ${order.uniq_id}`);

      // BAŞLATAN KİŞİ AYNIYSA YALNIZCA UPDATE
      if (String(startedUser[i]) === String(currentUser)) {
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: currentUser,
          },
          { where: { id: stoppedWork.id } }
        );

        workIdsToRestart.push(order.uniq_id);

        const exitedLogs = await getExitedLogs(order.uniq_id);
        for (const item of exitedLogs) {
          // Eski katılımı geçmişe taşı
          await SectionParticiptionLogs.update(
            {
              status: "4",
            },
            {
              where: {
                status: "2",
                uniq_id: item.uniq_id,
                operator_id: item.operator_id, // ✅ bu filtreyi de eklersen daha güvenli olur
              },
            }
          );
          // Yeni aktif katılımı oluştur
          await SectionParticiptionLogs.create({
            uniq_id: item.uniq_id,
            operator_id: item.operator_id,
            join_time: currentDateTimeOffset,
            section: item.section,
            area_name: item.area_name,
            order_no: item.order_no,
            status: "1",
            machine_name: item.machine_name,
            field: item.field,
          });
        }
      } else {
        // YENİ İŞ OLUŞTURULUYOR
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: currentUser,
          },
          { where: { id: stoppedWork.id } }
        );

        workIdsToClose.push(order.uniq_id);

        const latestWorkLog = await WorkLog.findOne({
          order: [["uniq_id", "DESC"]],
        });

        const newUniqId = latestWorkLog
          ? String(parseInt(latestWorkLog.uniq_id, 10) + 1).padStart(6, "0")
          : "000001";

        // Yeni iş kaydı
        newWorkTasks.push({
          uniq_id: newUniqId,
          user_id_dec: currentUser,
          order_no: order.order_no,
          section: order.section,
          area_name: order.area_name,
          work_status: "1",
          process_id: order.process_id,
          work_start_date: currentDateTimeOffset,
          process_name: order.process_name,
          production_amount: order.production_amount,
          machine_name: order?.machine_name || null,
        });

        // Geçmiş katılımcıları geri ekle (duplike kontrolüyle)
        const exitedLogs = await getExitedLogs(order.uniq_id);
        for (const item of exitedLogs) {
          // Eski katılımı geçmişe taşı
          await SectionParticiptionLogs.update(
            {
              status: "4",
            },
            {
              where: {
                status: "2",
                uniq_id: item.uniq_id,
                operator_id: item.operator_id, // ✅ bu filtreyi de eklersen daha güvenli olur
              },
            }
          );
          // Yeni aktif katılımı oluştur
          await SectionParticiptionLogs.create({
            uniq_id: newUniqId,
            operator_id: item.operator_id,
            join_time: currentDateTimeOffset,
            section: item.section,
            area_name: item.area_name,
            order_no: item.order_no,
            status: "1",
            machine_name: item.machine_name,
            field: item.field,
          });
        }

        await SectionParticiptionLogs.create({
          uniq_id: newUniqId,
          operator_id: currentUser,
          join_time: currentDateTimeOffset,
          section: order.section,
          area_name: order.area_name,
          order_no: order.order_no,
          status: "1",
          machine_name: order?.machine_name || null,
          field,
        });
      }
    }

    // 7. GÜNCELLEME VE KAYITLAR
    if (workIdsToClose.length > 0) {
      await WorkLog.update(
        {
          work_status: "4",
          work_end_date: currentDateTimeOffset,
          work_finished_op_dec: currentUser,
          produced_amount: 0,
        },
        { where: { uniq_id: workIdsToClose } }
      );
    }

    if (workIdsToRestart.length > 0) {
      await WorkLog.update(
        { work_status: "1" },
        { where: { uniq_id: workIdsToRestart } }
      );
    }

    if (newWorkTasks.length > 0) {
      await WorkLog.bulkCreate(newWorkTasks);
    }

    return { message: "İş(ler) başarıyla yeniden başlatıldı." };
  } catch (err) {
    throw err;
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
  field,
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
  // Bölümde mi ? şimdilik sadece cekic bölümüne özel
  if (
    (area_name === "cekic" && field !== "makine") ||
    area_name === "telcekme"
  ) {
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
    if (isSectionParticipated.field !== field) {
      return {
        status: 400,
        message: `Şu anda ${isSectionParticipated.field} alanında çalışıyorsunuz. Önce çıkış yapıp ${field} alanına giriş yapmalısınız.`,
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
  // Aşağıdaki işlemi şimdilik sadece telçekme bölümü için yapıyoruz. İş durduruldugu zaman bölümdekileri çıkarıyoruz.
  if (area_name === "telcekme") {
    //todo findAll ın dönüş değeri dizidir.
    const isSectionParticipated = await SectionParticiptionLogs.findAll({
      where: {
        exit_time: null,
        area_name,
        uniq_id: work_log_uniq_id,
      },
    });

    if (isSectionParticipated.length > 0) {
      const exitTimeUpdated = await SectionParticiptionLogs.update(
        {
          exit_time: currentDateTimeOffset,
          status: "2",
        },
        {
          where: {
            uniq_id: work_log_uniq_id,
            status: {
              [Op.in]: ["1", "2"],
            },
          },
        }
      );
    }
  }
  return { status: 200, message: "İş başarıyla durduruldu." };
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
const getStoppedWorks = async ({ area_name, user_id_dec }) => {
  try {
    if (!area_name) throw new Error("area_name is required.");

    const where = {
      area_name,
      work_status: "2",
    };

    if (area_name === "cila" && user_id_dec) {
      where.user_id_dec = user_id_dec;
    }

    const result = await WorkLog.findAll({ where });
    return result;
  } catch (err) {
    console.error(err);
    throw new Error("Stopped works could not be fetched.");
  }
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
    old_code,
  } = work_info;

  // Eğer "buzlama" ekranındaysak ve machine_name boşsa hata döndür
  if (area_name === "buzlama" && !machine_name) {
    return {
      status: 400,
      message: "Makine seçimi zorunludur.",
    };
  }

  // TELCEKME ŞART...
  if (area_name === "telcekme" && (process_name !== "ÖN HADDELEME" && process_name !== "TAMİR")) {
    const work = await WorkLog.findOne({
      where: {
        area_name: "telcekme",
        process_name: "ÖN HADDELEME",
        order_no: order_id,
        work_status: {
          [Op.in]: ["4"],
        },
      },
    });
    if (!work) {
      return {
        status: 400,
        message: "Bu sipariş için ön haddeleme işlemi yapılmamıştır.",
      };
    }
  }

  let existingOrderCount = 0;
  // Baslatılmaya calısılan iş daha önce başlatılmış mı kontrol et
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

  // Eğer "cekic" ekranındaysak, kullanıcının bölüme katılımını kontrol et
  if (area_name === "cekic" && field !== "makine") {
    try {
      const isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: {
          operator_id: user_id_dec,
          exit_time: null,
          area_name: area_name,
        },
      });

      if (!isSectionParticipated) {
        return {
          status: 400,
          message: "Bölüme katılım sağlamadan işe başlayamazsınız.",
        };
      }

      // Eğer kullanıcı bölüme katıldıysa ancak yanlış field içinde ise
      if (isSectionParticipated.field !== field) {
        return {
          status: 400,
          message: `Şu anda ${isSectionParticipated.field} alanında çalışıyorsunuz. Önce çıkış yapıp ${field} alanına giriş yapmalısınız.`,
        };
      }
    } catch (err) {
      return {
        status: 500,
        message:
          "Bölüm katılım durumu kontrol edilirken bir hata meydana geldi.",
      };
    }
  }

  // cekic bölümünde makine alanında başka bir iş var mı kontrolü eğer bir makine birden fazla iş başlatılacaksa bunu şartı kaldır...
  if (area_name === "cekic" && field === "makine") {
    const isSelectedCekicMachineWork = await WorkLog.findOne({
      where: {
        area_name: "cekic",
        machine_name,
        work_status: {
          [Op.in]: ["0", "1", "2"],
        },
      },
    });

    if (isSelectedCekicMachineWork) {
      return {
        status: 400,
        message: `${machine_name} makinesinde başka bir iş var.`,
      };
    }
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
    old_code,
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

//! Seçili siparişi iptal edecek servis grup olayı bu serviste yok...
const cancelWork = async ({
  uniq_id,
  currentDateTimeOffset,
  currentUser,
  area_name,
  field,
}) => {
  try {
    // kullanıcı molada mı ?
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
    if (
      (area_name === "cekic" && field !== "makine") ||
      area_name === "telcekme"
    ) {
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
      if (isSectionParticipated.field !== field) {
        return {
          status: 400,
          message: `Şu anda ${isSectionParticipated.field} alanında çalışıyorsunuz. Önce çıkış yapıp ${field} alanına giriş yapmalısınız.`,
        };
      }
    }
    // bölüm ?

    await closeOpenStops({ uniq_id, closeDate: currentDateTimeOffset });

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

    // Aşağıdaki işlemi şimdilik sadece telçekme bölümü için yapıyoruz
    if (area_name === "telcekme") {
      // findAll ın dönüş değeri dizidir.
      const isSectionParticipated = await SectionParticiptionLogs.findAll({
        where: {
          exit_time: null,
          uniq_id,
          area_name,
        },
      });

      if (isSectionParticipated.length > 0) {
        const exitTimeUpdated = await SectionParticiptionLogs.update(
          {
            exit_time: currentDateTimeOffset,
            status: "3",
          },
          {
            where: {
              uniq_id,
              area_name,
              status: {
                [Op.in]: ["1", "2"],
              },
            },
          }
        );

        if (exitTimeUpdated[0] > 0) {
          console.log(
            `✔ ${exitTimeUpdated[0]} kullanıcı çıkışı kaydedildi (telçekme).`
          );
        } else {
          console.log(
            "⚠ Kullanıcı çıkışı güncellenmedi, zaten çıkış yapılmış olabilir."
          );
        }
      }
    }
    return { status: 200, message: "Sipariş başarıyla iptal edildi." };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

//! durdurma sebeplerini bölüme göre getirecek metot
const getStopReason = async ({ area_name }) => {
  try {
    const stopReason = await StopReason.findAll({
      where: {
        area_name,
      },
    });
    return stopReason;
  } catch (err) {
    console.error("Error querying stop reasons:", err);
    throw err;
  }
};

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

//! Bölümdeki tüm durmuş ve aktif işleri çekecek query...
async function getWorksWithoutId(areaName) {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: areaName,
        work_status: {
          [Op.in]: ["0", "1", "2", "6", "7"], // '1' veya '2' durumundaki işleri getir
        },
      },
    });

    // Eğer sonuç varsa 200 status ve sonuçları dön
    if (result.length > 0) {
      return {
        status: 200,
        message: result,
      };
    }
    // Eğer sonuç yoksa 404 status ve mesaj dön
    else {
      return {
        status: 404,
        message: "No works found",
      };
    }
  } catch (err) {
    console.error("Database error:", err);
    // Hata oluşursa 500 status ve hata mesajı döndür
    return {
      status: 500,
      message: "Database query failed",
    };
  }
}

//! id ye gore sıparısı getırecek servis...
async function getOrderById(orderId) {
  try {
    const result = await OrderTable.findOne({
      where: {
        ORDER_ID: orderId,
      },
    });

    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: "Girilen id ile ilgili bir sipariş bulunamadı",
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
}

//! Buzlama işlerini çekecek fonksiyon 6 ve 7 harıc  tum statu dekı ıslerı cekecek servis
const getWorksToBuzlama = async () => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: "buzlama",
        work_status: {
          [Op.in]: ["0", "1", "2", "4", "5"],
        },
      },
    });

    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: "Buzlama alanında iş bulunamadı.",
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Bölümdeki bitmiş yada iptal olan işleri çek...
const getFinishedOrders = async (area_name) => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name,
        work_status: {
          [Op.in]: ["3", "4", "5"],
        },
      },
    });

    if (result.length > 0) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: `${area_name} alanında iş bulunamadı.`,
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Yenı grup olustacak fonksıyon...
async function createOrderGroup(params) {
  if (!params || typeof params !== "object") {
    return { status: 400, message: "Invalid parameters." };
  }

  const {
    orderList,
    machine_name,
    process_id,
    process_name,
    operatorId,
    section,
    areaName,
  } = params;

  if (!orderList || !operatorId) {
    return { status: 400, message: "Missing required parameters." };
  }

  const currentDateTimeOffset = new Date().toISOString();

  try {
    // Giriş yapan kullanıcı olusturmayacaksa ekstra bır ıd alma popup ı yapacağız.
    const user = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: operatorId }, { id_hex: operatorId }],
      },
    });

    if (!user) {
      return { status: 403, message: "Girilen kullanıcı id geçersiz." };
    }

    let orders = JSON.parse(orderList);

    // Her bir order_id için kontrol yapıyoruz
    // for (const order of orders) {
    //   const existingOrder = await WorkLog.findOne({
    //     where: {
    //       order_no: order.ORDER_ID,
    //     },
    //   });

    //   if (
    //     existingOrder &&
    //     existingOrder.work_status !== "3" &&
    //     existingOrder.area_name === "buzlama" &&
    //     existingOrder.work_status !== "4"
    //   ) {
    //     // Eğer mevcut bir kayıt varsa ve work_status 3 değilse, direkt return yapıyoruz.
    //     return {
    //       status: 400,
    //       message: `Sipariş ID ${order.ORDER_ID} için zaten mevcut bir kayıt var. Grup oluşturulmadı.`,
    //     };
    //   }
    // }

    // Benzersiz group_no oluşturma
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    const newGroupRecord = await GroupRecords.create({
      group_record_id: newUniqId,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_creation_date: currentDateTimeOffset,
      group_status: "1",
      section,
      area_name: areaName,
    });

    if (newGroupRecord) {
      for (const order of orders) {
        const sorder = await OrderTable.findOne({
          where: {
            ORDER_ID: order.ORDER_ID,
          },
        });

        if (!sorder) {
          throw new Error(`Order not found for ORDER_ID: ${order.ORDER_ID}`);
        }

        const work_info = {
          section,
          area_name: areaName,
          work_status: "0",
          production_amount: sorder.PRODUCTION_AMOUNT,
          order_id: sorder.ORDER_ID,
          user_id_dec: user.id_dec,
          op_username: user.op_username,
          group_no: newGroupNo,
          group_record_id: newUniqId,
        };

        await createWork({ work_info, currentDateTimeOffset });
      }
    }

    return {
      status: 200,
      message: "Sipariş grubu başarıyla oluşturuldu.",
      createdGroupNo: newGroupNo,
    };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Sipariş grubu oluşturulamadı." };
  }
}

//! Grupları çekecek servis...
const getGroupList = async () => {
  try {
    const result = await GroupRecords.findAll({
      where: {
        group_status: {
          [Op.in]: ["1", "2", "3", "4", "5"], // Hem "1" hem de "2" olan grupları getirir
        },
      },
      order: [["group_creation_date", "DESC"]], // En yeni tarih en başta olacak şekilde sıralar
    });

    if (result.length === 0) {
      return { status: 404, message: "Grup bulunamadı" };
    }
    return { status: 200, message: result };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Kapanmıs Grupları cekecek servis
//! Grupları çekecek servis...
const getClosedGroups = async () => {
  try {
    const result = await GroupRecords.findAll({
      where: {
        group_status: "2",
      },
    });

    if (result.length === 0) {
      return { status: 404, message: "Grup bulunamadı" };
    }
    return { status: 200, message: result };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};
//! Grupları birleştirecek servis...
const mergeGroups = async (params) => {
  const { groupIds, operatorId, section, areaName } = params;
  const currentDateTimeOffset = new Date().toISOString();

  try {
    // Gönderilen grup ID'lerini parse et (dizi olarak aldık)
    const parsedGroupIds = JSON.parse(groupIds);
    console.log(parsedGroupIds);

    if (parsedGroupIds.length < 2) {
      return {
        status: 400,
        message: "Birleştirmek için birden fazla grup seçiniz.",
      };
    }

    // Her bir grup için `group_status` kontrolü yap
    for (const groupUniqId of parsedGroupIds) {
      const group = await GroupRecords.findOne({
        where: { group_record_id: groupUniqId.group_record_id },
      });

      if (!group) {
        return {
          status: 404,
          message: `Grup bulunamadı: ${groupUniqId.group_record_id}`,
        };
      }

      // Eğer `group_status` 1 veya 2 değilse, işlemi durdur ve hata mesajı döndür
      if (group.group_status !== "1" && group.group_status !== "2") {
        return {
          status: 400,
          message: `Grup ${group.group_record_id} birleştirilemez çünkü işlem devam ediyor veya tamamlanmış: group_status = ${group.group_status}`,
        };
      }
    }

    // Son kaydın grup_no sunu al
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    // Uniq bir grup numarası oluştur
    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderIds = [];
    for (const groupUniqId of parsedGroupIds) {
      const orders = await WorkLog.findAll({
        where: { group_record_id: groupUniqId.group_record_id },
      });

      // Eğer group_record_id'ye bağlı order'lar varsa, bunları allOrderIds dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const ongoingOrder = orders.find((order) => order.work_status === "1");
        if (ongoingOrder) {
          return {
            status: 400,
            message: `Bu grupta devam eden ya da bitmiş bir sipariş var: ${groupUniqId.group_record_id}`,
          };
        }

        allOrderIds = allOrderIds.concat(orders.map((order) => order.uniq_id));
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupUniqId.group_record_id}`,
        };
      }
    }

    if (allOrderIds.length > 0) {
      // Yeni grup kaydını oluştur
      const newGroupRecord = await GroupRecords.create({
        group_no: newGroupNo,
        who_started_group: operatorId,
        group_creation_date: new Date().toISOString(),
        group_start_date: currentDateTimeOffset,
        group_status: "1",
        section,
        area_name: areaName,
        group_record_id: newUniqId,
      });

      console.log(allOrderIds);

      // WorkLog tablosundaki her siparişin group_no ve group_record_id sütununu güncelle
      for (const orderId of allOrderIds) {
        await WorkLog.update(
          { group_no: newGroupNo, group_record_id: newUniqId },
          { where: { uniq_id: orderId } }
        );
      }

      // Eski grupları sil
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupIds.map((item) => item.group_record_id),
        },
      });

      return { status: 200, message: "Gruplar başarıyla birleştirildi." };
    } else {
      return { status: 400, message: "Birleştirilecek grupları seçiniz." };
    }
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Gruptan sipariş çıkaracak servis...
const removeOrdersFromGroup = async (params) => {
  const { orderUniqIds, groupNo, operatorId } = params;
  try {
    const parsedOrderIds = JSON.parse(orderUniqIds);
    const parsedGroupNo = JSON.parse(groupNo);
    console.log(parsedOrderIds);

    let ordersToDelete = []; // Gruptan çıkarılacak siparişleri topladığımız dizi
    let invalidOrders = []; // Başlamış siparişleri topladığımız dizi

    // 1. Order'ları bul ve silinmesi gerekenleri belirle
    for (const orderData of parsedOrderIds) {
      const order = await WorkLog.findOne({
        where: {
          uniq_id: orderData.uniq_id,
          work_status: "0",
        },
      });

      if (!order) {
        // Eğer sipariş bulunamazsa veya başlamışsa, invalidOrders dizisine order_no'yu ekleyin
        const startedOrder = await WorkLog.findOne({
          where: {
            uniq_id: orderData.uniq_id,
          },
        });

        if (startedOrder) {
          invalidOrders.push(startedOrder.order_no); // order_no'yu ekliyoruz
        } else {
          invalidOrders.push(orderData.order_no); // Eğer order_no bulunamazsa, order_no'yu ekliyoruz
        }
      } else if (order.work_status === "0") {
        ordersToDelete.push(order.uniq_id);
      }
    }

    // Eğer hatalı siparişler varsa, bir uyarı mesajı döndür
    if (invalidOrders.length > 0) {
      return {
        status: 403,
        message: `${invalidOrders.join(
          ", "
        )} no lu sipariş(ler) işleme alınmış yada bitirilmiş. Gruptan çıkarmak istediğiniz siparişleri tekrardan seçip işlemi gerçekleştirin.`,
      };
    }

    console.log(ordersToDelete);

    // 2. Order'ları sil
    if (ordersToDelete.length > 0) {
      await WorkLog.destroy({
        where: {
          uniq_id: ordersToDelete,
        },
      });
    }

    // yollanan grup no da hiç sipariş yoksa 0 lar yukarıda silindi grubu sil...
    const orderByGroup = await WorkLog.findAll({
      where: {
        group_record_id: parsedGroupNo[0].group_record_id,
      },
    });

    if (orderByGroup.length === 0) {
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupNo[0].group_record_id,
        },
      });
      return {
        status: 200,
        message: "Grup kapatıldı ve tüm siparişler silindi",
      };
    } else {
      // grup içinde daha onceden iptal edilen ve bitmiş işler var ve devam eden bir iş yok ise grubu otomatik kapatmak ıcın arama yapıyoruz
      const isFinishedOrder = orderByGroup.some(
        (item) =>
          (item.work_status === "3" || item.work_status === "4") &&
          item.work_status !== "1"
      );

      if (isFinishedOrder) {
        await GroupRecords.update(
          {
            group_status: "5",
            group_end_date: new Date().toISOString(),
            who_ended_group: operatorId,
          },
          {
            where: {
              group_record_id: parsedGroupNo[0].group_record_id,
            },
          }
        );
        return {
          status: 200,
          message: "Grup kapatıldı ve siparişler güncellendi",
        };
      }
    }

    return {
      status: 200,
      message: "Siparişler gruptan başarıyla çıkarıldı, grup kapatılmadı",
    };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};
//! Grubu kapatacak servis...
const closeSelectedGroup = async (params) => {
  const currentDateTimeOffset = new Date().toISOString();
  const { groupNos } = params;
  let parsedGroupNos = JSON.parse(groupNos);
  try {
    if (parsedGroupNos.length !== 1) {
      return {
        status: 402,
        message: "Birden fazla grubu kapatmaya çalışmayın.",
      };
    }

    // Grup numarasına ait tüm order'ları WorkLog tablosundan aldık
    const orders = await WorkLog.findAll({
      where: {
        group_record_id: parsedGroupNos[0].group_record_id, // Tek grup numarasına göre filtreleme
      },
    });

    // Eğer grup içerisinde bir sipariş yoksa grubu sil...
    if (orders.length < 0) {
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupNos[0].group_record_id,
        },
      });
    }

    // Eğer herhangi bir siparişin work_status'ü 1 veya 2 ise, grup kapatılamaz
    const hasActiveOrders = orders.some(
      (order) => order.work_status === "1" || order.work_status === "2"
    );

    if (hasActiveOrders) {
      return {
        status: 400,
        message: "Grup içerisindeki işler başlatılmış veya yanlış alanda.",
      };
    }

    // Eğer bütün siparişlerin work_status'ü 0 ise siparişler ve grup silinecek
    const allOrdersArePending = orders.every(
      (order) => order.work_status === "0"
    );

    if (allOrdersArePending) {
      await WorkLog.destroy({
        where: {
          group_record_id: parsedGroupNos[0].group_record_id,
          work_status: "0", // Sadece work_status "0" olan siparişleri sil
        },
      });

      await GroupRecords.destroy({
        where: { group_record_id: parsedGroupNos[0].group_record_id },
      });

      return { status: 200, message: "Grup ve siparişler başarıyla silindi." };
    }

    // Eğer bütün siparişlerin work_status'ü 3 (iptal) veya 4 (bitmiş) ise grup kapatılacak, ancak siparişler ve grup silinmeyecek
    const allOrdersCompletedOrCanceled = orders.every(
      (order) => order.work_status === "3" || order.work_status === "4"
    );

    if (allOrdersCompletedOrCanceled) {
      await GroupRecords.update(
        {
          group_status: 5, // Grup durumu kapatıldı olarak güncellenecek
          group_end_date: currentDateTimeOffset, // Grup bitiş tarihi güncellenecek
        },
        {
          where: { group_record_id: parsedGroupNos[0].group_record_id },
        }
      );

      return { status: 200, message: "Grup başarıyla kapatıldı." };
    }

    return {
      status: 400,
      message: "Grup içerisindeki işler devam ediyor, grup kapatılamaz.",
    };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Gruba sipariş ekleyecek servis
const addToGroup = async (params) => {
  const { group_record_id, selectedOrderId } = params;
  let parsedOrdersId = JSON.parse(selectedOrderId);

  try {
    // Eklemeye çalıştığınız grubu bulun
    const group = await GroupRecords.findOne({
      where: {
        group_record_id,
      },
    });

    if (!group) {
      return {
        status: 400,
        message: `Eklemeye çalıştığınız ${group_record_id} grup numarası bulunamadı...`,
      };
    } else {
      // Eklenmesi gereken siparişleri alın
      const orders = await WorkLog.findAll({
        where: {
          uniq_id: parsedOrdersId.map((order) => order.uniq_id), // Tüm uniq_id değerlerini kontrol eder
          area_name: "buzlama",
          work_status: "0",
        },
      });

      // Siparişlerin tümü uygun mu? (area_name: "buzlama" ve work_status: "0")
      const allOrdersValid = orders.every(
        (order) => order.area_name === "buzlama" && order.work_status === "0"
      );

      if (allOrdersValid) {
        for (const order of orders) {
          await WorkLog.update(
            { group_record_id: group_record_id, group_no: group.group_no },
            { where: { uniq_id: order.uniq_id, area_name: "buzlama" } }
          );
        }
      } else {
        return {
          status: 400,
          message: "Siparişler arasında uygun olmayanlar var.",
        };
      }

      const oldOrderGroupId = orders[0].group_record_id;
      console.log({ order: oldOrderGroupId, group_record_id });
      // Gruba ait kalan siparişleri kontrol et
      const remainingOrdersInGroup = await WorkLog.findAll({
        where: { group_record_id: oldOrderGroupId, area_name: "buzlama" },
      });

      // Eğer grupta kalan sipariş yoksa, grubu sil
      if (remainingOrdersInGroup.length === 0) {
        await GroupRecords.destroy({
          where: { group_record_id: oldOrderGroupId },
        });
        return {
          status: 200,
          message:
            "Siparişler başarıyla gruba eklendi ve grup boş olduğu için silindi.",
        };
      } else {
        return {
          status: 200,
          message: "Siparişler başarıyla gruba eklendi.",
        };
      }
    }
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
};

//! Gönderilen grubu makineye yollayacak servis...
const sendToMachine = async (params) => {
  const { id_dec, machine_name, process_name, process_id, group_record_id } =
    params;
  const currentDateTimeOffset = new Date().toISOString();

  try {
    // grup var mı ?
    const group = await GroupRecords.findOne({
      where: { group_record_id },
    });

    // grup no yoksa...
    if (!group) {
      return {
        status: 404,
        message: "Makineye gönderilecek grup numarası bulunamadı...",
      };
    }

    if (group.group_status === "2") {
      return {
        status: 404,
        message: `Bu grup makineye gönderilmiş ${group.machine_name}`,
      };
    }

    // Eğer varsa bu gurubun siparişlerini bul
    const orders = await WorkLog.findAll({
      where: { group_record_id, work_status: "0" },
    });

    // statusu 0 sipariş yoksa başlamıştır...
    if (orders.length === 0) {
      return {
        status: 404,
        message: "Grupta sipariş yok ya da bütün siparişler başlamış.",
      };
    }

    await GroupRecords.update(
      {
        group_status: "2",
        process_name,
        machine_name,
      },
      {
        where: {
          group_record_id,
        },
      }
    );

    // bulunan siparişlerin uniq idsini kullanarak güncelle...
    for (const order of orders) {
      await WorkLog.update(
        {
          process_name,
          machine_name,
          process_id,
        },
        {
          where: { uniq_id: order.uniq_id, work_status: "0" },
        }
      );
    }

    return { status: 200, message: "Grup başarıyla makineye gönderildi." };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası oluştu. Lütfen tekrar deneyiniz.",
    };
  }
};

//! Makineye gonderılmıs prosesi baslatacak servis work status 0dan 1 e  gs-3
async function startToProcess({ id_dec, group_record_id }) {
  try {
    const group = await GroupRecords.findOne({
      where: {
        group_record_id,
      },
    });

    if (!group) {
      return { status: 404, message: "İşlem yapılacak grup bulunamadı..." };
    }

    const orders = await WorkLog.findAll({
      where: {
        group_record_id,
        work_status: "0",
      },
    });

    if (orders.length < 0) {
      return {
        status: 404,
        message: "Bu grupta prosese gönderilecek sipariş yok",
      };
    }

    // Tüm siparişlerin aynı makineye atandığını varsayarak makine adını alıyoruz
    const machineName = orders[0].machine_name;

    // Makine kontrolü
    const activeMachine = await WorkLog.findOne({
      where: {
        machine_name: machineName,
        work_status: ["1", "2"], // İşlemde olan ya da durdurulmuş
      },
    });

    if (activeMachine) {
      return {
        status: 400,
        message: `Makine (${machineName}) hâlihazırda kullanılıyor. İş başlatılamaz.`,
      };
    }

    const isActiveOrder = orders.every((item) => item.work_status === "1");

    if (isActiveOrder && group.group_status === "3") {
      return { status: 400, message: "Proses başlatılmış" };
    }

    // grubu guncelle status vs...
    await GroupRecords.update(
      {
        group_status: "3",
        group_start_date: new Date().toISOString(),
      },
      {
        where: {
          group_record_id,
          group_status: "2",
        },
      }
    );

    // WorkLog'daki siparişleri güncelle
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "1",
          user_id_dec: id_dec,
          work_start_date: new Date().toISOString(),
        },
        {
          where: {
            group_record_id,
            uniq_id: order.uniq_id,
            work_status: "0", // Sadece durumu 0 olan siparişleri güncelle
          },
        }
      );
    }

    return { status: 200, message: "Proses başlatıldı." };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Makineyi durduracak servis gs-4 ws-2
async function stopToSelectedMachine(
  selectedGroup,
  id_dec,
  stop_reason_id,
  area_name
) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const group = await GroupRecords.findOne({
      where: {
        group_record_id: selectedGroup.group_record_id,
        group_status: "3",
      },
    });

    if (!group) {
      return {
        status: 404,
        message:
          "Durdurmak istediğiniz makinede aktif bir iş yok yada durdurulmus.",
      };
    }

    const orders = await WorkLog.findAll({
      where: {
        group_record_id: selectedGroup.group_record_id,
        work_status: "1",
      },
    });

    // şartları sağlayan tum sıparıslerı guncelle
    if (!orders || orders.length === 0) {
      return { status: 400, message: "Grupta aktif sipariş yok" };
    } else {
      for (const order of orders) {
        await stopWork({
          work_log_uniq_id: order.uniq_id,
          currentDateTimeOffset,
          order_id: order.order_no,
          stop_reason_id,
          user_who_stopped: id_dec,
          group_record_id: order.group_record_id,
          area_name,
        });
      }
    }

    // şartları sağlayan tüm siparişleri de güncelle
    await GroupRecords.update(
      { group_status: "4" },
      {
        where: {
          group_record_id: selectedGroup.group_record_id,
          group_status: "3",
        },
      }
    );

    return {
      status: 200,
      message: `Makibe başarıyla durduruldu ${group.machine_name}`,
    };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Durdurulan makineyi yeniden başlatacak servis.. TRACSACTİON kullandık
async function restartToMachine(selectedGroup, id_dec, area_name) {
  const currentDateTimeOffset = new Date().toISOString();
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    // Seçilen grubu veritabanından buluyoruz
    const group = await GroupRecords.findOne({
      where: {
        group_record_id: selectedGroup.group_record_id,
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer grup bulunamazsa, işlem başarısız olur
    if (!group) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return {
        status: 400,
        message: `Durdurulacak grup bulunamadı ${selectedGroup?.group_no}...`,
      };
    }

    // Gruba ait durdurulmuş işleri buluyoruz
    const orders = await WorkLog.findAll({
      where: {
        group_record_id: selectedGroup.group_record_id,
        work_status: "2", // Sadece durdurulmuş işleri seçiyoruz
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer durdurulmuş iş yoksa, işlem başarısız olur
    if (!orders || orders.length === 0) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return { status: 400, message: "Grubun içinde durdurulmuş sipariş yok " };
    } else {
      // Durdurulmuş işler için gerekli güncellemeleri yapıyoruz
      for (const order of orders) {
        // Durdurulmuş işlerin sonlanma tarihini ve başlatan kullanıcıyı güncelliyoruz
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: id_dec,
          },
          {
            where: {
              work_log_uniq_id: order.uniq_id,
              stop_end_date: null, // Sadece durdurulmuş (bitmemiş) işleri seçiyoruz
            },
            transaction, // İşlemi transaction içinde yapıyoruz
          }
        );

        // İş durumunu '1' olarak güncelliyoruz, yani aktif hale getiriyoruz
        await WorkLog.update(
          {
            work_status: "1", // İş yeniden başlatıldığı için durum '1' oluyor
          },
          { where: { uniq_id: order.uniq_id }, transaction }
        );
      }

      // Grup durumunu '3' (aktif) olarak güncelliyoruz
      await GroupRecords.update(
        {
          group_status: "3",
        },
        {
          where: {
            group_record_id: selectedGroup.group_record_id,
          },
          transaction, // İşlemi transaction içinde yapıyoruz
        }
      );

      await transaction.commit(); // Tüm işlemler başarılı olduğunda transaction'ı tamamlıyoruz
      return { status: 200, message: "İşler başarıyla yeniden başlatıldı." };
    }
  } catch (err) {
    await transaction.rollback(); // Hata durumunda tüm işlemleri geri alıyoruz
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Ölçüm veri girişi
async function createMeasurementData(measurementsInfo) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    // const group = await GroupRecords.findAll({
    //   where: {
    //     group_no: measurementsInfo.group_no,
    //   },
    // });

    // const sologroup = await GroupRecords.findOne({
    //   where: {
    //     group_no: measurementsInfo.group_no,
    //   },
    // });

    // if (sologroup.group_status === "3") {
    //   return {
    //     status: 404,
    //     message: "Ölçü alabilmek için önce prosesi bitirin",
    //   };
    // }

    // console.log(group);

    // // Grup statüsü 5 ya da 7 olanların kontrolünü yap
    // const areTheGroupsValid = group.every(
    //   (item) => item.group_status === "5" || item.group_status === "7"
    // );

    // if (!areTheGroupsValid) {
    //   return {
    //     status: 404,
    //     message:
    //       "Grubun diğer prosesleri bitirilmemiş öncelikle o grupları bitirin.",
    //   };
    // }

    // if (sologroup.group_status === "3") {
    //   return {
    //     status: 404,
    //     message: "Ölçü alabilmek için önce prosesi bitirin",
    //   };
    // }

    // const measure = await MeasureData.findOne({
    //   where: {
    //     order_no: measurementsInfo.order_no,
    //     group_no: measurementsInfo.group_no,
    //     measure_status: "1",
    //   },
    // });

    // if (measure) {
    //   return {
    //     status: 400,
    //     message: `${measure.order_no} numaralı siparişin daha önce ölçümü alınmış.`,
    //   };
    // }

    // const allOrderNo = [];

    // for (const grp of group) {
    //   const orders = await WorkLog.findAll({
    //     where: {
    //       group_no: grp.group_no,
    //     },
    //   });

    //   orders.forEach((item) => {
    //     if (!allOrderNo.includes(item.order_no)) {
    //       allOrderNo.push(item.order_no);
    //     }
    //   });
    // };

    // Yeni ölçüm verisini oluştur
    const newMeasurement = await MeasureData.create({
      order_no: measurementsInfo.order_no,
      material_no: measurementsInfo.material_no,
      operator: measurementsInfo.operator,
      area_name: measurementsInfo.area_name,
      entry_measurement: measurementsInfo.entry_measurement,
      exit_measurement: measurementsInfo.exit_measurement,
      entry_weight_50cm: measurementsInfo.entry_weight_50cm,
      exit_weight_50cm: measurementsInfo.exit_weight_50cm,
      data_entry_date: currentDateTimeOffset,
      description: measurementsInfo.description,
      measurement_package: measurementsInfo.measurement_package,
      // group_no: measurementsInfo.group_no,
      measure_status: "1",
    });

    // Başarılı yanıt döndür
    return {
      status: 200,
      message: { success: true, message: newMeasurement },
    };
  } catch (err) {
    console.error("Error creating measurement data:", err);

    // Hata durumunda yanıt döndür
    return {
      status: 500,
      message: "Ölçüm verisi kaydedilirken bir hata oluştu.",
    };
  }
}

//! Ölçüm verilerini çekecek servis...
async function getAllMeasurements(areaName) {
  try {
    // Tüm ölçüm verilerini veritabanından çek
    const measurements = await MeasureData.findAll({
      where: {
        area_name: areaName,
      },
      order: [["data_entry_date", "DESC"]],
    });

    // Başarılı yanıt döndür
    return {
      status: 200,
      message: measurements,
    };
  } catch (error) {
    console.error("Error fetching measurements:", error);

    // Hata durumunda yanıt döndür
    return {
      status: 500,
      message: {
        success: false,
        message: "Ölçüm verileri çekilirken bir hata oluştu.",
      },
    };
  }
}

//! Seçili siparişi bitirecek servis...
async function deliverSelectedOrder(order, id_dec, op_username, group_no) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const selectedOrder = await WorkLog.findOne({
      where: {
        uniq_id: order.uniq_id,
      },
    });

    if (!selectedOrder) {
      return {
        status: 404,
        message: "Teslim etmeye çalıştığınız sipariş bulunamadı.",
      };
    }

    // Yollanan sipariş devam ediyorsa teslim edilebilir...
    if (selectedOrder.dataValues.work_status === "1") {
      await WorkLog.update(
        {
          work_end_date: currentDateTimeOffset,
          work_finished_op_dec: id_dec,
          work_status: "4",
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    } else if (selectedOrder.dataValues.work_status === "2") {
      return {
        status: 400,
        message:
          "Teslim etmeye çalıştığınız sipariş durdurulmuş. Öncelikle siparişi bitirin.",
      };
    } else if (selectedOrder.dataValues.work_status === "0") {
      return {
        status: 400,
        message:
          "Teslim etmeye çalıştığınız sipariş henüz başlamamış. Öncelikle siparişi bitirin.",
      };
    }

    // Yollanan gruptaki siparişleri al...
    const orders = await WorkLog.findAll({
      where: {
        group_no,
      },
    });

    // Gruptaki siparişlerin hepsi 4 ya da 3 mü?
    const allOrdersCompleted = orders.every(
      (order) => order.work_status === "3" || order.work_status === "4"
    );

    if (allOrdersCompleted) {
      await GroupRecords.update(
        {
          group_status: "2",
          group_end_date: currentDateTimeOffset,
          who_ended_group: id_dec,
        },
        {
          where: {
            group_no,
          },
        }
      );
    }

    return {
      status: 200,
      message: `${order.order_no}'lu sipariş başarıyla teslim edildi. `,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Sunucu hatası.",
    };
  }
}

//! Gruptaki işleri bitirip grubu güncelleyecek servis
async function finishTheGroup({ groups, id_dec }) {
  const groupIds = groups;
  try {
    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderUniqId = [];

    for (const groupId of groupIds) {
      const orders = await WorkLog.findAll({
        where: { group_record_id: groupId.group_record_id },
      });

      // Eğer group_no'ya bağlı order'lar varsa, bunları allOrderUniqId dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const stoppedOrder = orders.find((order) => order.work_status === "2");
        const emptyOrder = orders.find((order) => order.work_status === "0");
        const ongoingOrder = orders.find((order) => order.work_status === "1");

        if (stoppedOrder) {
          return {
            status: 400,
            message: `Bu grupta durdurulmuş bir sipariş var. Öncelikle onu iptal edin ya da işi bitirin: ${groupId.group_no}`,
          };
        } else if (emptyOrder) {
          return {
            status: 400,
            message: `Bu grupta başlamamış bir iş var. Grup teslim edilmedi. Yanlış grupta işlem yapmış olabilirsiniz: ${groupId.group_no}`,
          };
        } else if (ongoingOrder) {
          allOrderUniqId = allOrderUniqId.concat(
            orders
              .filter((order) => order.work_status === "1") // Sadece work_status === "1" olan siparişleri dahil et
              .map((order) => order.uniq_id) // Bu siparişlerin uniq_id'sini al
          );
        }
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupId.group_no}`,
        };
      }
    }

    // Güncellemeyi yalnızca allOrderUniqId boş değilse yap
    if (allOrderUniqId.length > 0) {
      await WorkLog.update(
        {
          work_finished_op_dec: id_dec,
          work_end_date: new Date().toISOString(),
          work_status: "4",
        },
        {
          where: {
            uniq_id: allOrderUniqId,
          },
        }
      );
    }

    // Güncellemeden sonra grubu tekrar kontrol etmek için siparişleri yeniden topla
    let allGroupsCompleted = true;

    for (const groupId of groupIds) {
      const updatedOrders = await WorkLog.findAll({
        where: { group_record_id: groupId.group_record_id },
      });

      if (updatedOrders && updatedOrders.length > 0) {
        const incompleteOrder = updatedOrders.find(
          (order) =>
            order.work_status !== "3" &&
            order.work_status !== "4" &&
            order.work_status !== "5"
        );
        if (incompleteOrder) {
          allGroupsCompleted = false;
          break;
        }
      } else {
        return {
          status: 400,
          message: `Güncelleme sonrası grup bulunamadı veya içinde sipariş yok: ${groupId.group_no}`,
        };
      }
    }

    // Eğer tüm siparişler "3" veya "4" "5" ise grubu güncelle
    if (allGroupsCompleted) {
      const [updatedRows] = await GroupRecords.update(
        {
          group_status: "5", // Grubun yeni durumu
          group_end_date: new Date().toISOString(),
        },
        {
          where: {
            group_record_id: groupIds.map((group) => group.group_record_id),
          },
        }
      );

      console.log(`Güncellenen satır sayısı: ${updatedRows}`);
    }

    return {
      status: 200,
      message: `Siparişler bitirldi, gruplar kapatıldı: ${groupIds.map(
        (group) => group.group_no
      )}`,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Sunucu hatası.",
    };
  }
}

//! Grubu teslim edecek servis gs-6 ws-4
async function deliverTheGroup(group, id_dec) {
  console.log(group);
  try {
    // Grup status "5" değilse işlem yapılmayacak
    if (group.group_status !== "5") {
      return {
        status: 400,
        message:
          "Grup teslim edilmeye uygun değil. Lütfen bitmiş bir grubu teslim edin.",
      };
    }

    // Teslim edilecek grupları al
    const groups = await GroupRecords.findAll({
      where: {
        group_no: group.group_no,
        group_status: "5",
      },
    });

    // Tüm iş emirlerini tek seferde al
    const allOrders = await WorkLog.findAll({
      where: {
        group_no: group.group_no,
      },
    });

    // İş emirlerini filtrele ve tekrar edenleri önle
    const uniqueOrders = Array.from(
      new Set(allOrders.map((item) => item.order_no))
    );

    // Eksik ölçümleri kontrol et
    const incompleteMeasurements = [];

    for (const order_no of uniqueOrders) {
      // Bu order_no için measure_status "1" olan bir kayıt var mı diye kontrol et
      const hasValidMeasurement = await MeasureData.findOne({
        where: {
          order_no: order_no,
          group_no: group.group_no,
          measure_status: "1",
        },
      });

      if (!hasValidMeasurement) {
        incompleteMeasurements.push(`order no: ${order_no}`);
      }
    }

    // Eğer eksik ölçümler varsa, teslim işlemini durdur
    if (incompleteMeasurements.length > 0) {
      return {
        status: 404,
        message: `Prosesi teslim edebilmek için eksik ölçümleri yapınız: ${incompleteMeasurements.join(
          ", "
        )}`,
      };
    }

    // Grup status "6" yapılıyor (teslim edilmiş)
    await GroupRecords.update(
      {
        group_status: "6",
      },
      {
        where: {
          group_no: group.group_no,
        },
      }
    );

    return { status: 200, message: "Grup başarıyla teslim edildi." };
  } catch (err) {
    console.error("Grup teslimi sırasında hata oluştu:", err);
    return {
      status: 500,
      message: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Seçili siparişleri bitirecek servis
async function finishSelectedOrders(params) {
  const { orders, id_dec } = params;

  try {
    // Bütün siparişler aynı grupta mı?
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const groupRecordId = orders[0].group_record_id; // İlk order'ın grup numarasını alıyoruz
      return orders.every((order) => order.group_record_id === groupRecordId);
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult !== true) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    // Aynı grupta olan siparişleri bitir
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "4",
          work_end_date: new Date().toISOString(),
          work_finished_op_dec: id_dec,
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    // Gruba ait tüm siparişleri kontrol et
    const groupOrder = await WorkLog.findAll({
      where: {
        group_record_id: orders[0].group_record_id,
      },
    });

    const allOrderOver = groupOrder.every(
      (item) =>
        item.work_status === "4" ||
        item.work_status === "3" ||
        item.work_status === "5"
    );

    if (allOrderOver) {
      await GroupRecords.update(
        {
          group_end_date: new Date().toISOString(),
          group_status: "5",
        },
        {
          where: {
            group_record_id: orders[0].group_record_id,
          },
        }
      );

      return {
        status: 200,
        message: "Gruptaki bütün siparişler bitirildi ve grup kapatıldı.",
      };
    }

    return { status: 200, message: "Siparişler başarıyla tamamlandı." };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! Şarrtlı bıtırme nedenlerını cekecek servis
async function getConditionalReason() {
  try {
    const result = await ConditionalFinishReason.findAll(); // Tüm nedenleri çek
    return { status: 200, message: result }; // Başarılı olduğunda 200 ve sonuçları dön
  } catch (err) {
    console.error("Error fetching conditional reasons:", err); // Hata logu
    return { status: 500, message: "Internal Server Error" }; // Hata durumunda 500 ve hata mesajı dön
  }
}

//! Gönderilen siparişleri şartlı bıtırecek popup...
async function conditionalFinish(orders, id_dec, conditional_finish, end_desc) {
  try {
    // Bütün siparişler aynı grupta mı?
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const firstGroupNo = orders[0].group_no; // İlk order'ın grup numarasını alıyoruz
      return orders.every((order) => order.group_no === firstGroupNo);
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult !== true) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    // Aynı grupta olan siparişleri bitir
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "5",
          work_end_date: new Date().toISOString(),
          work_finished_op_dec: id_dec,
          conditional_finish,
          end_desc,
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    // Gruba ait tüm siparişleri kontrol et
    const groupOrder = await WorkLog.findAll({
      where: {
        group_no: orders[0].group_no,
      },
    });

    const allOrderOver = groupOrder.every(
      (item) =>
        item.work_status === "4" ||
        item.work_status === "3" ||
        item.work_status === "5"
    );

    if (allOrderOver) {
      await GroupRecords.update(
        {
          group_end_date: new Date().toISOString(),
          group_status: "5",
        },
        {
          where: {
            group_record_id: orders[0].group_record_id,
          },
        }
      );

      return {
        status: 200,
        message: "Gruptaki bütün siparişler bitirildi ve grup kapatıldı.",
      };
    }
    return { status: 200, message: "Siparişler başarıyla tamamlandı." };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! GRUPLU EKRANLARDA siparişi iptal edecek fonksiyon
async function cancelOrderInGroup(orders, id_dec) {
  try {
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const groupNo = orders[0].group_no;
      const allSameGroup = orders.every((order) => order.group_no === groupNo);
      if (!allSameGroup) {
        return {
          status: 400,
          message: "Tüm siparişler aynı grup içinde olmalı.",
        };
      }
      return { status: 200 };
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult.status !== 200) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "3", // Sipariş iptal ediliyor
          group_no: "",
        },
        {
          where: {
            group_record_id: order.group_record_id,
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    const allOrdersInGroup = await WorkLog.findAll({
      where: {
        group_record_id: orders[0].group_record_id,
      },
    });

    // Gruptaki tüm siparişler iptal edilmiş mi?
    const allOrdersCancelled = allOrdersInGroup.every(
      (order) => order.work_status === "3"
    );

    // Grupta hiçbir siparişin durumu "0", "1" veya "2" değil mi?
    const noPendingOrders = allOrdersInGroup.every(
      (order) =>
        order.work_status !== "0" &&
        order.work_status !== "1" &&
        order.work_status !== "2"
    );

    // Eğer tüm siparişler iptal edilmişse, grup statüsü 7 yapılacak
    if (allOrdersCancelled) {
      await GroupRecords.update(
        { group_status: "7" },
        {
          where: { group_record_id: orders[0].group_record_id },
        }
      );
      return {
        status: 200,
        message: "Gruptaki tüm siparişler iptal edildi...",
      };
    }

    // Eğer hiç "0", "1" veya "2" statüsünde sipariş yoksa, grup statüsü 5 yapılacak
    if (noPendingOrders) {
      await GroupRecords.update(
        { group_status: "5" },
        {
          where: { group_record_id: orders[0].group_record_id },
        }
      );
    }

    return { status: 200, message: "Sipariş başarıyla iptal edildi." };
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! Kapatılan gruplar ve siparişleri ile aynı yada farklı proseslerde tekrardan iş başlatacak servis
async function restartGroupProcess(
  areaName,
  section,
  id_dec,
  machine_name,
  group_no,
  group_record_id,
  process_id,
  process_name
) {
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    // Grubun orderlarını bul...
    const orders = await WorkLog.findAll({
      where: {
        group_record_id,
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer grupta sipariş yoksa
    if (orders.length === 0) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return {
        status: 404,
        message: `${group_no} nosuna ait geçmiş sipariş bulunamadı.`,
      };
    }

    console.log({ orders: orders });

    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    // Aynı grup no ile grup kaydı oluştur...
    const groupRecord = await GroupRecords.create(
      {
        group_record_id: newUniqId,
        group_no: group_no,
        who_started_group: id_dec,
        group_creation_date: new Date().toISOString(),
        group_status: "2", // Yeni grup aktif
        section,
        area_name: areaName,
        process_name,
        machine_name,
      },
      { transaction }
    );

    const currentDateTimeOffset = new Date().toISOString();

    if (groupRecord) {
      for (const order of orders) {
        const sorder = await WorkLog.findOne({
          where: {
            order_no: order.order_no,
          },
          transaction, // İşlemi transaction içinde yapıyoruz
        });

        if (!sorder) {
          throw new Error(`Order not found for ORDER_ID: ${order.order_no}`);
        }

        const work_info = {
          section,
          area_name: areaName,
          work_status: "0", // İş henüz başlamadı
          process_name,
          machine_name,
          production_amount: sorder.production_amount,
          order_id: sorder.order_no,
          process_id,
          user_id_dec: id_dec,
          group_record_id: newUniqId,
          group_no: group_no,
        };

        await createWork({ work_info, currentDateTimeOffset, transaction });
      }

      await transaction.commit(); // Tüm işlemler başarılı olduysa transaction'ı tamamla
      return {
        status: 200,
        message: "Grup ve siparişler başarıyla yeniden başlatıldı.",
      };
    }
  } catch (err) {
    await transaction.rollback(); // Hata durumunda tüm işlemleri geri alıyoruz
    console.log(err);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

//! okutulan siparişi seçili gruba ekleyecek servis...
async function addReadOrderToGroup(group, orderList, user, areaName, section) {
  if (!orderList || !user) {
    return { status: 400, message: "Missing required parameters." };
  }

  const currentDateTimeOffset = new Date().toISOString();
  try {
    for (const order of orderList) {
      const work_info = {
        section,
        area_name: areaName,
        work_status: "0",
        production_amount: order.PRODUCTION_AMOUNT,
        order_id: order.ORDER_ID,
        user_id_dec: user.id_dec,
        op_username: user.op_username,
        group_no: group.group_no,
        group_record_id: group.group_record_id,
      };

      await createWork({ work_info, currentDateTimeOffset });
    }

    return {
      status: 200,
      message: `Okutulan siparişler başarıyla ${group.group_no}'lu gruba eklendi...`,
    };
  } catch (err) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

//! okutulan sıparısın olcu aralıgını getırecek servıs
async function getMetarialMeasureData(metarial_no) {
  try {
    const result = await Zincir50CMGR.findOne({
      where: {
        materialCode: metarial_no,
      },
    });

    // findOne bir obje veya null döner, bu nedenle length yerine null kontrolü yapılmalı
    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: `${metarial_no} için ölçü aralığı bulunamadı.`,
      };
    }
  } catch (err) {
    console.error("Error in getMetarialMeasureData function:", err); // Hatalı fonksiyon adını düzelttim
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//! Malzeme no ya gore olcum cekecek query...
async function getMeasureWithOrderId(material_no, areaName) {
  try {
    const result = await MeasureData.findAll({
      where: {
        material_no,
        area_name: areaName,
        measure_status: "1",
      },
      order: [["data_entry_date", "DESC"]],
    });

    if (result && result.length > 0) {
      return { status: 200, message: result };
    } else {
      return {
        status: 200,
        message: `${material_no} ait geçmiş olçüm bulunamadı.`,
      };
    }
  } catch (error) {
    console.error("Error in getMeasureWithOrderId function:", error); // Hata adı düzeltilmiş
    return { status: 500, message: "İç sunucu hatası." };
  }
}
//! secılı olcumu sılecek servıs
async function deleteMeasurement(area_name, order_no, id, user) {
  try {
    const measure = await MeasureData.findOne({ where: { id } });

    if (!measure) {
      return { status: 404, message: "Silmek istediğiniz ölçüm bulunamadı" };
    }

    const result = await MeasureData.update(
      {
        delete_date: new Date().toISOString(),
        who_deleted_measure: user,
        measure_status: "2",
      },
      {
        where: { area_name, order_no, id },
      }
    );

    if (result[0] === 0) {
      return { status: 400, message: "Ölçüm silinemedi, işlem başarısız" };
    }

    return { status: 200, message: "Ölçüm silme işlemi başarılı" };
  } catch (err) {
    console.error("Error in deleteMeasurement function:", err);
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//? FİRE İŞLEMLERİ İÇİN GEREKLİ SERVİSLER...
async function scrapMeasure(formState, user_id, areaName) {
  const {
    orderId,
    goldSetting,
    entryGramage,
    exitGramage,
    gold_pure_scrap,
    diffirence,
  } = formState;
  try {
    const measure = await PureGoldScrapMeasurements.findOne({
      where: { order_no: orderId },
    });

    if (measure && orderId !== "1234567") {
      return {
        status: 400,
        message: `${measure.dataValues.order_no} nolu siparişin ölçümü yapılmış. `,
      }; // Başarılı yanıt
    }

    const result = await PureGoldScrapMeasurements.create({
      order_no: orderId,
      operator: user_id,
      area_name: areaName,
      entry_measurement: entryGramage,
      exit_measurement: exitGramage,
      measurement_diff: diffirence,
      gold_pure_scrap,
      gold_setting: goldSetting,
    });
    return { status: 200, message: "Veri başarıyla kaydedildi." }; // Başarılı yanıt
  } catch (err) {
    console.error("Error in scrapMeasure function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! fire olcumlerını cekecek servis
async function getScrapMeasure(order_no) {
  try {
    const result = await PureGoldScrapMeasurements.findAll({
      where: {
        order_no,
      },
    });
    return { status: 200, message: result };
  } catch (err) {
    console.error("Error in deleteMeasurement function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}
//! fire ölçümünü silecek servis
async function deleteScrapMeasure(id) {
  try {
    const result = await PureGoldScrapMeasurements.destroy({
      where: {
        scrapMeasurement_id: id,
      },
    });

    if (result) {
    }
    return { status: 200, message: "Ölçüm başarıyla silindi" };
  } catch (err) {
    console.error("Error in getScrapMeasure function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}
//! Fire ölçümünü güncelleyecek servis
async function updateMeasure(formState, uniq_id) {
  const {
    orderId,
    goldSetting,
    entryGramage,
    exitGramage,
    gold_pure_scrap,
    diffirence,
  } = formState;
  try {
    const result = await PureGoldScrapMeasurements.update(
      {
        entry_measurement: entryGramage,
        exit_measurement: exitGramage,
        measurement_diff: diffirence,
        gold_pure_scrap,
      },
      {
        where: {
          order_no: orderId,
          scrapMeasurement_id: uniq_id,
        },
      }
    );

    return {
      status: 200,
      message: "Ölçüm başarıyla güncellendi.",
    };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//? FİRE İŞLEMLERİ İÇİN GEREKLİ SERVİSLER SON...

//? Toplu sipariş iptal edecek servis
const fwork = async (
  uniqIds,
  work_finished_op_dec,
  areaName,
  field,
  repair_amount,
  scrap_amount,
  produced_amount,
  product_count
) => {
  const work_end_date = new Date().toISOString();

  try {
    // Geçersiz veri kontrolü
    if (!uniqIds || !Array.isArray(uniqIds) || uniqIds.length === 0) {
      return { status: 400, message: "Bitirilecek siparişleri seçmelisiniz." };
    }

    if (!work_finished_op_dec) {
      return { status: 400, message: "Geçerli bir kullanıcı ID gerekli." };
    }

    // İŞLEMİ YAPACAK KULLANICI MOLADA MI ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id: work_finished_op_dec,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message:
          "Moladayken prosesi bitiremezsiniz. Moladan dönüş işlemini gerçekleştirip tekrar deneyin.",
      };
    }
    // MOLA

    // Bölümde mi ? şimdilik sadece cekic bölümüne özel
    if (
      (areaName === "cekic" && field !== "makine") ||
      areaName === "telcekme"
    ) {
      const isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: {
          operator_id: work_finished_op_dec,
          exit_time: null,
          area_name: areaName,
        },
      });

      if (!isSectionParticipated) {
        return {
          status: 400,
          message: "Bölüme katılım sağlamadan işe bitiremezsinizs.",
        };
      }
      if (isSectionParticipated.field !== field) {
        return {
          status: 400,
          message: `Şu anda ${isSectionParticipated.field} alanında çalışıyorsunuz. Önce çıkış yapıp ${field} alanına giriş yapmalısınız.`,
        };
      }
    }

    // bölüm ?
    const orders = await WorkLog.findAll({
      where: { uniq_id: uniqIds },
    });

    if (orders.length === 0) {
      return {
        status: 400,
        message: "Bazı siparişler bulunamadı veya geçersiz ID'ler gönderildi.",
      };
    }

    // Cekic bölümünde ölçüm yapılmadan sipariş bitirilmiyecek... Şimdilik sadece cekic bölümü için...
    let toBeFinished = []; // ölçüm verisi olanlar
    let withoutMeasure = []; // ölçüm verisi olmayanlar
    if (areaName === "cekic") {
      for (const uniqId of uniqIds) {
        const isMeasureData = await MeasureData.findOne({
          where: {
            order_no: orders.map((item) => item.order_no),
            area_name: areaName,
            measure_status: "1",
          },
        });

        if (isMeasureData) {
          toBeFinished.push(uniqId);
        } else {
          withoutMeasure.push(uniqId);
        }
      }

      // Eğer tüm siparişlerde ölçüm yoksa → işlemi tamamen iptal et
      if (toBeFinished.length === 0) {
        return {
          status: 400,
          message: `${orders.map(
            (item) => item.order_no
          )} Hiçbir siparişin ölçüm verisi bulunamadı. Önce ölçüm yapılmalıdır.`,
        };
      }
    }

    const allAreStatus = orders.every((order) => order.work_status === "1");

    if (!allAreStatus) {
      return {
        status: 400,
        message: "Sadece başlanmış işleri iptal edebilirsiniz.",
      };
    }

    // İşleri bitmiş olarak güncelleme
    const [updatedCount] = await WorkLog.update(
      {
        work_status: "4",
        work_finished_op_dec,
        work_end_date,
        repair_amount,
        produced_amount,
        scrap_amount,
        product_count,
      }, // Doğru kolon ismi
      { where: { uniq_id: uniqIds } }
    );

    if (updatedCount === 0) {
      return { status: 404, message: "Güncellenecek sipariş bulunamadı." };
    }

    // Aşağıdaki işlemi şimdilik sadece telçekme bölümü için yapıyoruz
    if (areaName === "telcekme") {
      // findAll ın dönüş değeri dizidir.
      const isSectionParticipated = await SectionParticiptionLogs.findAll({
        where: {
          exit_time: null,
          area_name: areaName,
          uniq_id: uniqIds,
        },
      });

      if (isSectionParticipated.length > 0) {
        const exitTimeUpdated = await SectionParticiptionLogs.update(
          {
            exit_time: work_end_date,
            status: "4",
          },
          {
            where: {
              uniq_id: uniqIds,
              status: { [Op.or]: ["1", "2"] },
            },
          }
        );

        if (exitTimeUpdated[0] > 0) {
          console.log(
            `✔ ${exitTimeUpdated[0]} kullanıcı çıkışı kaydedildi (telçekme).`
          );
        } else {
          console.log(
            "⚠ Kullanıcı çıkışı güncellenmedi, zaten çıkış yapılmış olabilir."
          );
        }
      }
    }

    return {
      status: 200,
      message: { success: `${updatedCount} iş başarıyla bitirildi.` },
    };
  } catch (err) {
    console.error("İş bitirme hatası:", err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
};

//? CEKİC BOLUME KATILAM İŞLEMLERİ....

//! Bölüme katılım sağlanması için kullanılacak servis...
async function joinSection(
  section,
  areaName,
  user_id,
  field,
  machine_name,
  workIds,
  uniqIds
) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    // Kullanıcı ID'lerini dizi haline getir (tek kişi ise dizileştir) bolumlere göre dizi ya da tek kişi olabilir
    const userIds = Array.isArray(user_id) ? user_id : [user_id];

    for (const userId of userIds) {
      const existingLogs = await SectionParticiptionLogs.findAll({
        where: {
          operator_id: userId,
          exit_time: null,
        },
      });

      const isBreakUser = await BreakLog.findOne({
        where: {
          operator_id: userId,
          end_date: null,
        },
      });

      if (isBreakUser) {
        return {
          status: 400,
          message: `Moladayken bölüme katılım sağlayamazsınız. (${userId})`,
        };
      }

      // Aynı field’a tekrar katılım varsa → engelle
      const sameAreaSameField = existingLogs.find(
        (log) => log.area_name === areaName && log.field === field
      );

      if (sameAreaSameField && areaName !== "telcekme") {
        return {
          status: 400,
          message: `"${areaName} / ${field}" alanına zaten katılmışsınız.`,
        };
      }

      // Cekic/makine özel durumu: farklı field’a geçebilir
      const isInCekicMakine = existingLogs.find(
        (log) => log.area_name === "cekic" && log.field === "makine"
      );

      const isInOtherCekicField = existingLogs.find(
        (log) => log.area_name === "cekic" && log.field !== "makine"
      );

      // makine harici baska bir yerde katılım varsa → engelle
      if (isInOtherCekicField) {
        return {
          status: 400,
          message: `Başka bir alanda aktif katılımınız var (${isInOtherCekicField.field}). Önce çıkış yapın.`,
        };
      }

      if (isInCekicMakine && areaName === "cekic" && field !== "makine") {
        // izin ver, continue → kayıt oluşturulacak
        continue;
      }

      // Telçekme → başka bölümlere her zaman katılabilir
      if (areaName === "telcekme") {
        continue;
      }

      // Diğer durumlar: zaten başka yerdeyse → engelle
      if (existingLogs.length > 0) {
        return {
          status: 409,
          message: `Başka bir alanda aktif katılımınız var (${existingLogs[0].area_name} / ${existingLogs[0].field}). Önce çıkış yapın.`,
        };
      }
    }

    // Katılım işlemi (Hem iş hem de kullanıcıları birlikte yönetelim)
    await Promise.all(
      // map içinde async await yok... Promise.all içinde async await kullanıyoruz
      // userIds tek bir kullanıcı ID'si olabileceği gibi, dizi içinde birden fazla kullanıcı ID'si de olabilir.
      (Array.isArray(userIds) ? userIds : [userIds]).map(async (userId) => {
        // Eğer workIds boşsa, sadece kullanıcı katılımı yap
        if (!Array.isArray(workIds) || workIds.length === 0) {
          await SectionParticiptionLogs.create({
            section,
            area_name: areaName,
            operator_id: userId,
            field,
            join_time: currentDateTimeOffset,
            machine_name,
            order_no: null, // Sipariş yoksa NULL atanabilir
            uniq_id: null, // uniq_id de null olabilir
            status: "1",
          });
        } else {
          await Promise.all(
            workIds.map(async (order, index) => {
              await SectionParticiptionLogs.create({
                section,
                area_name: areaName,
                operator_id: userId,
                field,
                join_time: currentDateTimeOffset,
                machine_name,
                order_no: order,
                uniq_id: uniqIds[index] || null, // Eğer uniq_id yoksa null ata
                status: "1",
              });
            })
          );
        }
      })
    );

    return { status: 200, message: "Bölüme başarıyla katıldınız." };
  } catch (err) {
    console.error("Error in joinSection function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! Bu servis, kullanıcının herhangi bir bölüme katılımı olup olmadığını kontrol eder.
async function checkParticipation(areaName, user_id) {
  try {
    if (!user_id) {
      return { status: 400, message: "Kullanıcı ID'si gerekli." };
    }

    const activeParticipation = await SectionParticiptionLogs.findAll({
      where: {
        operator_id: user_id,
        exit_time: null,
      },
    });

    // Hiç aktif katılım yoksa
    if (activeParticipation.length === 0) {
      return {
        status: 200,
        message: "Herhangi bir bölüme katılım yok.",
        joined: false,
      };
    }

    // Kendi ekranı dışında bir alana katılım var mı?
    const conflictLog = activeParticipation.find(
      (log) => log.area_name !== areaName
    );

    // Başka bir bölüme katılım varsa
    if (conflictLog) {
      return {
        status: 200,
        message: `${conflictLog.area_name} biriminde aktif katılımınız var. Öncelikle bu bölümden çıkış yapmalısınız.`,
        joined: true,
      };
    }

    // Yalnızca kendi alanında katılım varsa sorun yok
    return {
      status: 200,
      message: "Sadece kendi alanınızda katılım var.",
      joined: false,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "İç sunucu hatası: " + err.message,
    };
  }
}

//! Bölüme katılmıs bir personelin çıkısını yapacak servis
async function exitSection(
  selectedPersonInField,
  areaName,
  selectedHammerSectionField,
  machine_name
) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const whereClause = {
      operator_id: selectedPersonInField,
      exit_time: null,
      area_name: areaName,
      field: selectedHammerSectionField,
    };
    //! Telçekme bölümünde makine adı da kontrol ediliyor. Çünkü bir kullanıcı bırden fazla makine calıstırabilir
    if (areaName === "telcekme") {
      whereClause.machine_name = machine_name;
    }
    const exitSection = await SectionParticiptionLogs.update(
      {
        exit_time: currentDateTimeOffset,
        status: "4",
      },
      {
        where: whereClause,
      }
    );

    const updatedRecords = await SectionParticiptionLogs.findAll({
      where: {
        exit_time: currentDateTimeOffset,
        operator_id: selectedPersonInField,
      },
    });

    if (updatedRecords.length > 0) {
      return { status: 200, message: "Bölümden ayrılma işlemi başarılı." };
    } else {
      // Güncelleme başarısızsa bir yanıt döndür
      return {
        status: 404,
        message: "Kayıt bulunamadı veya çıkış yapılamadı.",
      };
    }
  } catch (err) {
    console.error("Error in exitSection function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! Bölümdeki kullanıcıları çekecek servis...
async function getPersonInTheField(areaName) {
  try {
    const result = await SectionParticiptionLogs.findAll({
      attributes: [
        "operator_id",
        "op_name",
        "area_name",
        "section",
        "field",
        "machine_name",
        [Sequelize.fn("MIN", Sequelize.col("join_time")), "join_time"], // En erken giriş yapılan kaydı al
      ],
      where: {
        area_name: areaName,
        exit_time: null, // Çıkış yapmamış kullanıcıları getir
      },
      group: [
        "operator_id",
        "op_name",
        "area_name",
        "section",
        "field",
        "machine_name", // Makine bazında da grupluyoruz
      ],
      order: [
        ["machine_name", "ASC"], // Makineye göre sıralıyoruz
        [Sequelize.fn("MIN", Sequelize.col("join_time")), "ASC"], // En erken giriş sırasına göre sıralıyoruz
      ],
    });

    return { status: 200, message: result };
  } catch (err) {
    console.error("Error in getPersonInTheField function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! Setup ı bitirip işi baslatacak servis
async function finishedToSetup(workIds, currentDateTimeOffset, operator_id) {
  try {
    // Bölüme katılacak kullanıcı molada mı ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message: "Moladayken bölüme katılım sağlayamazsınız.",
      };
    }

    // const isSectionParticipated = await SectionParticiptionLogs.findOne({
    //   where: {
    //     operator_id,
    //     exit_time: null,
    //   },
    // });
    // if (!isSectionParticipated) {
    //   return {
    //     status: 400,
    //     message: "Bölüme katılım sağlamadan işe başlayamazsınız.",
    //   };
    // }
    // Belirtilen ID'lere sahip işlerin olup olmadığını kontrol et
    let works = await WorkLog.findAll({
      where: {
        uniq_id: {
          [Op.in]: workIds, // Dizi olarak sorgulama
        },
        setup_end_date: null,
      },
    });

    if (!works || works.length === 0) {
      return {
        status: 404,
        message: "Setup bitireceğiniz işler bulunamadı.",
      };
    }

    // Setup'ı bitir ve işleri başlat
    await WorkLog.update(
      {
        work_status: "7",
        setup_end_date: currentDateTimeOffset,
        setup_end_id: operator_id,
      },
      {
        where: {
          uniq_id: {
            [Op.in]: workIds, // Birden fazla uniq_id'yi güncelle
          },
        },
      }
    );

    return {
      status: 200,
      message: `İşlem başarıyla tamamlandı. Güncellenen iş sayısı: ${works.length}`,
    };
  } catch (err) {
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! Setup ı başlatacak servis
async function startToSetup(workIds, currentDateTimeOffset, operator_id) {
  try {
    // Bölüme katılacak kullanıcı molada mı ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message:
          "Moladayken setup başlatamazsınız. Mola işlemini sonlandırıp tekrar deneyin.",
      };
    }
    // Mola...

    // // Bölümde mi ?
    // const isSectionParticipated = await SectionParticiptionLogs.findOne({
    //   where: {
    //     operator_id,
    //     exit_time: null,
    //   },
    // });
    // if (!isSectionParticipated) {
    //   return {
    //     status: 400,
    //     message: "Bölüme katılım sağlamadan işe başlayamazsınız.",
    //   };
    // }
    // // bölüm ?

    // Belirtilen ID'lere sahip işlerin olup olmadığını kontrol et
    let works = await WorkLog.findAll({
      where: {
        uniq_id: {
          [Op.in]: workIds, // Dizi olarak sorgulama
        },
        work_status: "0",
      },
    });

    if (!works || works.length === 0) {
      return {
        status: 404,
        message: "Setup başlatacağınız işler bulunamadı.",
      };
    }

    // Setup'ı başlat
    await WorkLog.update(
      {
        work_status: "6",
        setup_start_date: currentDateTimeOffset,
        setup_start_id: operator_id,
      },
      {
        where: {
          uniq_id: {
            [Op.in]: workIds, // Birden fazla uniq_id'yi güncelle
          },
        },
      }
    );

    return {
      status: 200,
      message: `İşlem başarıyla tamamlandı. Güncellenen iş sayısı: ${works.length}`,
    };
  } catch (err) {
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! prosesi baslatacak servis
async function startToProces(workIds, user_id_dec, area_name, field) {
  try {
    // Bölüme katılacak kullanıcı molada mı ?
    const isBreakUser = await BreakLog.findOne({
      where: {
        operator_id: user_id_dec,
        end_date: null,
      },
    });

    if (isBreakUser) {
      return {
        status: 400,
        message:
          "Moladayken prosesi başlatamazsınız. Moladan dönüş işlemini gerçekleştirip tekrar deneyin.",
      };
    }

    // Bölümde mi ? şimdilik sadece cekic bölümüne özel
    if (
      (area_name === "cekic" && field !== "makine") ||
      area_name === "telcekme"
    ) {
      const isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: {
          operator_id: user_id_dec,
          exit_time: null,
          area_name,
        },
      });

      if (!isSectionParticipated) {
        return {
          status: 400,
          message: "Bölüme katılım sağlamadan prosesi başlatamazsınız.",
        };
      }
    }
    // bölüm ?

    let works = await WorkLog.findAll({
      where: {
        uniq_id: {
          [Op.in]: workIds,
        },
        work_status: "7",
      },
    });

    if (!works || works.length === 0) {
      return {
        status: 404,
        message: "Proses başlatacağınız işler bulunamadı.",
      };
    }

    // ? update metodu sadece bır sayı dondurur... [] kullanarak dırekt dızı ıcındekı degerı alıyoruz.
    const [updatedCount] = await WorkLog.update(
      {
        work_status: "1",
        work_start_date: new Date().toISOString(),
        user_id_dec,
      },
      {
        where: {
          uniq_id: { [Op.in]: workIds },
        },
      }
    );

    if (updatedCount === 0) {
      return {
        status: 404,
        message: "Güncellenen iş bulunamadı.",
      };
    }
    return {
      status: 200,
      message: `İşlem başarıyla tamamlandı. Güncellenen iş sayısı: ${updatedCount}`,
    };
  } catch (err) {
    console.error("İç sunucu hatası:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//? CEKİC BOLUME KATILAM İŞLEMLERİ SON...
//! Bir işi devredecek servis
async function transferOrder(
  workIds,
  user_id_dec,
  area_name,
  op_username,
  currentDateTimeOffset
) {
  try {
    if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
      return {
        status: 400,
        message: "Geçerli bir iş ID listesi gönderilmedi.",
      };
    }

    const works = await WorkLog.findAll({
      where: {
        uniq_id: {
          [Op.in]: workIds,
        },
        work_status: "1",
      },
    });

    if (!works || works.length === 0) {
      return {
        status: 404,
        message: "Devredeceğiniz işler bulunamadı.",
      };
    }

    const latestWorkLog = await WorkLog.findOne({
      order: [["uniq_id", "DESC"]],
    });

    let currentUniqId = latestWorkLog
      ? parseInt(latestWorkLog.uniq_id, 10) + 1
      : 1;
    const updatedWorks = [];

    for (const work of works) {
      newUniqId = String(currentUniqId).padStart(6, "0");
      const newWorkData = { ...work.dataValues };
      delete newWorkData.id;
      delete newWorkData.op_username;

      await WorkLog.update(
        {
          work_status: "8",
          work_end_date: currentDateTimeOffset,
          work_finished_op_dec: user_id_dec,
        },
        {
          where: {
            uniq_id: work.uniq_id,
          },
        }
      );

      await WorkLog.create({
        ...newWorkData,
        uniq_id: newUniqId,
        work_status: "1",
        work_start_date: currentDateTimeOffset,
        user_id_dec,
        op_username,
      });
      updatedWorks.push(newUniqId);
      currentUniqId++;
    }

    return {
      status: 200,
      message: `İşlem başarıyla tamamlandı. Devredilen iş sayısı: ${updatedWorks.length}`,
    };
  } catch (err) {
    console.log("Error in forwardWork function:", err);
    return { status: 500, message: "İç sunucu hatası: " + err.message };
  }
}

//! Filtreli worklog verilerini getirecek servis
async function getWorksLogData(
  areaName,
  section,
  machine,
  process,
  startDate,
  endDate
) {
  const where = {};

  if (
    areaName === "all" &&
    section === "all" &&
    machine === "all" &&
    process === "all"
  ) {
    return {
      status: 400,
      message: "En az bir filtre seçmelisiniz.",
    };
  }

  if (startDate && endDate) {
    where.work_start_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else {
    return {
      status: 400,
      message: "Başlangıç ve bitiş tarihleri gereklidir.",
    };
  }

  if (areaName && areaName !== "all") {
    where.area_name = areaName;
  }
  if (section && section !== "all") {
    where.section = section;
  }
  if (machine && machine !== "all") {
    where.machine_name = machine;
  }

  if (process && process !== "all") {
    where.process_name = process;
  }

  try {
    const works = await WorkLog.findAll({ where });
    const aktif = works.filter((work) => work.work_status === "1");
    const tamamlanmis = works.filter((work) => work.work_status === "4");
    const iptal = works.filter((work) => work.work_status === "2");
    const durdurulmus = works.filter((work) => work.work_status === "3");

    const result = [
      { status: "all", data: works },
      { status: "aktif", data: aktif },
      { status: "tamamlanmis", data: tamamlanmis },
      { status: "iptal", data: iptal },
      { status: "durdurulmus", data: durdurulmus },
    ];

    return { status: 200, message: "Veriler başarıyla çekildi", data: result };
  } catch (error) {
    console.error("Error in getWorksLogData function:", error);
    return { status: 500, message: "İç sunucu hatası: " + error.message };
  }
}

module.exports = {
  getOrderById,
  createOrderGroup,
  getGroupList,
  mergeGroups,
  removeOrdersFromGroup,
  closeSelectedGroup,
  addToGroup,
  getWorksToBuzlama,
  sendToMachine,
  createMeasurementData,
  getAllMeasurements,
  deliverSelectedOrder,
  finishTheGroup,
  finishSelectedOrders,
  getConditionalReason,
  conditionalFinish,
  getClosedGroups,
  getFinishedOrders,
  restartGroupProcess,
  startToProcess,
  stopToSelectedMachine,
  restartToMachine,
  cancelOrderInGroup,
  deliverTheGroup,
  addReadOrderToGroup,
  getWorksWithoutId,
  getMetarialMeasureData,
  getMeasureWithOrderId,
  deleteMeasurement,
  scrapMeasure,
  getScrapMeasure,
  deleteScrapMeasure,
  joinSection,
  checkParticipation,
  exitSection,
  getPersonInTheField,
  finishedToSetup,
  updateMeasure,
  fwork,
  startToSetup,
  startToProces,
  getStopReason,
  getCancelReason,
  cancelWork,
  getRepairReason,
  getProcessList,
  getMachineList,
  getOrder,
  createWork,
  getWorks,
  getStoppedWorks,
  stopWork,
  rWork,
  finishedWork,
  transferOrder,
  getWorksLogData,
};
