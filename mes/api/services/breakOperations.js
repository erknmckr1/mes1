const BreakReason = require("../../models/BreakReason");
const SectionParticiptionLogs = require("../../models/SectionParticiptionLogs");
const BreakLog = require("../../models/BreakLog");
const WorkLog = require("../../models/WorkLog");
const { Op } = require("sequelize");
const pool = require("../../lib/dbConnect");
const sequelize = require("../../lib/dbConnect");

const createBreakReason = async (breakReason) => {
  try {
    const existingBreakReason = await BreakReason.findOne({
      where: { break_reason: breakReason.break_reason },
    });

    if (existingBreakReason) {
      console.log("Break reason already exists:", existingBreakReason);
      return existingBreakReason;
    } else {
      const newBreakReason = await BreakReason.create(breakReason);
      return newBreakReason;
    }
  } catch (err) {
    console.error("Error creating break reason:", err);
    throw err;
  }
};

//! Özel ara sebeblerini çekecek query
const getBreakReason = async () => {
  try {
    const breakReason = BreakReason.findAll();
    return breakReason;
  } catch (err) {
    console.log(err);
  }
};

// //! tüm break loglarını getırecek query
// const getBreakReasonLog = async () => {
//   try {
//     const breakLog = await pool.query(`SELECT *
//     FROM public.break_log;`);
//     return breakLog.rows;
//   } catch (err) {
//     console.log(err);
//   }
// };

//! Belirli bir kullanıcıyı molada mı dıye sorgulayacak query... Eğer yoksa yenı bır log atacak
//! varsa mevcut logu donecek...
const getIsUserOnBreak = async (startLog, currentDateTimeOffset) => {
  const { area_name, operator_id, break_reason_id, op_name, section } =
    startLog;
  try {
    // Kullanıcı molada mı onu kontrol ediyoruz...
    const isStart = await BreakLog.findOne({
      where: {
        operator_id: operator_id,
        end_date: null,
      },
    });

    const isSectionParticipated = await SectionParticiptionLogs.findOne({
      where: {
        operator_id,
        exit_time: null,
      },
    });

    //? Eğer bir kullanıcı zaten bir bölümde çalışıyorsa molaya çıkacağı zaman bölümdeki çıkış zamanını güncelle
    if (isSectionParticipated) {
      const sectionParticipated = await SectionParticiptionLogs.update(
        {
          exit_time: currentDateTimeOffset,
          status: "5", // status 5 bolumden mola sebebi ile çıktı
        },
        {
          where: {
            exit_time: null,
            operator_id: operator_id,
          },
        }
      );
    }

    // Molada değilse yeni mola oluştur
    if (!isStart) {
      const createBreak = await BreakLog.create({
        break_reason_id: break_reason_id,
        operator_id: operator_id,
        start_date: currentDateTimeOffset,
        section: section,
        area_name: area_name,
        op_name: op_name,
      });
      return { createBreak, isAlreadyOnBreak: false }; // Eklenen molayı döndürüyoruz
    } else {
      return { isAlreadyOnBreak: true, existingBreak: isStart }; // Zaten kullanıcının aktif bir molası var.
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

//! Aktıf olarak molada olan kullanıcıları donecek metot...
const onBreakUsers = async (areaName) => {
  try {
    const isBreakUsers = await BreakLog.findAll({
      where: {
        end_date: null,
        area_name: areaName,
      },
    });
    return isBreakUsers;
  } catch (err) {
    console.log(err);
  }
};
//! Giriş yapan kullancı moladaysa moladan donus ıcın gereklı fonksıyon. end_time doldugu zaman mola
//! bitmiş sayılacak...
const returnToBreak = async ({ operator_id, end_time }) => {
  try {
    // Güncelleme işlemini gerçekleştirin
    const result = await BreakLog.update(
      { end_date: end_time },
      {
        where: {
          end_date: null,
          operator_id: operator_id,
        },
      }
    );

    // Güncellenen kayıtları kontrol et
    const updatedRecords = await BreakLog.findAll({
      where: {
        end_date: end_time,
        operator_id: operator_id,
      },
    });

    // Mola sebebi ile bölümden çıkan kullanıcıyı kontrol et
    const exitedDuringBreak = await SectionParticiptionLogs.findAll({
      where: {
        operator_id: operator_id,
        exit_time: {
          [Op.not]: null,
        },
        status: "5",
      },
    });

    if (exitedDuringBreak.length > 0) {
      for (const sectionLog of exitedDuringBreak) {
        // Sipariş hala aktifse bölüme tekrar giriş yap
        const isActiveOrder = await WorkLog.findOne({
          where: {
            uniq_id: sectionLog.uniq_id,
            work_status: {
              [Op.or]: ["1", "2"],
            },
          },
        });

        if (isActiveOrder) {
          const updateSectionLog = await SectionParticiptionLogs.create({
            operator_id: sectionLog.operator_id,
            join_time: end_time,
            exit_time: null,
            status: "1", // status 1 normal giriş
            uniq_id: sectionLog.uniq_id,
            order_no: sectionLog.order_no,
            section: sectionLog.section,
            machine_name: sectionLog.machine_name,
            area_name: sectionLog.area_name,
            field: sectionLog.field,
          });
        }
      }
    }

    if (updatedRecords.length > 0) {
      return updatedRecords.length; // Güncelleme başarılı, güncellenen kayıt sayısını döner
    } else {
      console.log("No records found with updated end_date");
      return 0; // Güncelleme başarısız
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  getBreakReason,
  getIsUserOnBreak,
  onBreakUsers,
  returnToBreak,
  createBreakReason,
};
