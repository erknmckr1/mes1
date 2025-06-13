const BreakReason = require("../../models/BreakReason");
const SectionParticiptionLogs = require("../../models/SectionParticiptionLogs");
const BreakLog = require("../../models/BreakLog");
const WorkLog = require("../../models/WorkLog");
const StoppedWorksLog = require("../../models/StoppedWorksLog");
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

//! Kullanıcı molası olup olmadığını kontrol edecek query
const checkUserBreakStatus = async (operator_id) => {
  if (!operator_id) throw new Error("operator_id is required");

  const breakLog = await BreakLog.findOne({
    where: {
      operator_id,
      end_date: null,
    },
  });

  return !!breakLog; // true ya da false döner
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

    const works = await WorkLog.findAll({
      where: {
        user_id_dec: operator_id,
        work_status: "1",
      },
    });

    let activeParticipantsOnSameMachines = [];

    // Bölümde (makine seviyesinde kullanıcı arıyoruz) molaya cıkan kullanıcı harıcınde calısan personel var mı ?
    if (area_name === "telcekme") {
      activeParticipantsOnSameMachines = await SectionParticiptionLogs.findAll({
        where: {
          exit_time: null,
          section: section,
          area_name: area_name,
          machine_name: { [Op.in]: works.map((w) => w.machine_name) },
          operator_id: { [Op.ne]: operator_id },
        },
      });
    }

    // Eğer telçekme'deyse ve aynı makinede başka biri varsa → işler durdurulmasın
    const shouldStopWorks =
      area_name !== "telcekme" || activeParticipantsOnSameMachines.length === 0;

    if (shouldStopWorks) {
      // 1. Tüm insert işlemleri paralel yapılır
      await Promise.all(
        works.map((work) =>
          StoppedWorksLog.create({
            order_id: work.order_no,
            stop_start_date: currentDateTimeOffset,
            work_log_uniq_id: work.uniq_id,
            stop_reason_id: "9",
            user_who_stopped: work.user_id_dec,
          })
        )
      );

      // 2. Tüm güncellemeler paralel yapılır
      await Promise.all(
        works.map((work) =>
          WorkLog.update(
            { work_status: "9" },
            { where: { user_id_dec: work.user_id_dec, uniq_id: work.uniq_id } }
          )
        )
      );
    } else {
      console.log(
        `İş durdurma atlandı: ${area_name} alanında aynı makinede başka çalışanlar var.`
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
    // 1. BreakLog end_date güncelle
    await BreakLog.update(
      { end_date: end_time },
      {
        where: {
          end_date: null,
          operator_id: operator_id,
        },
      }
    );
    // 2. Eğer işi başlatan kişi ise work_status: 9 olan işleri geri başlat
    const works = await WorkLog.findAll({
      where: {
        user_id_dec: operator_id,
        work_status: "9",
      },
    });

    if (works.length > 0) {
      await Promise.all(
        works.map((work) =>
          StoppedWorksLog.update(
            {
              stop_end_date: end_time,
              user_who_started: work.user_id_dec,
            },
            {
              where: {
                work_log_uniq_id: work.uniq_id,
                order_id: work.order_no,
              },
            }
          )
        )
      );

      await Promise.all(
        works.map((work) => {
          WorkLog.update(
            {
              work_status: "1",
            },
            {
              where: {
                user_id_dec: operator_id,
                uniq_id: work.uniq_id,
              },
            }
          );
        })
      );
    }

    // 3. SectionParticipationLogs'ta status: 5 (mola nedeniyle çıkmış) olan kayıtları bul
    const exitedDuringBreak = await SectionParticiptionLogs.findAll({
      where: {
        operator_id,
        exit_time: { [Op.not]: null },
        status: "5",
      },
    });

    if (exitedDuringBreak.length > 0) {
      for (const sectionLog of exitedDuringBreak) {
        // 4. Bu iş hala aktif mi? (başkası başlatmış olsa bile)
        const relatedWork = await WorkLog.findOne({
          where: {
            uniq_id: sectionLog.uniq_id,
            order_no: sectionLog.order_no,
            work_status: { [Op.in]: ["1", "2", "9"] },
          },
        });

        if (relatedWork) {
          // Aynı uniq_id ile hâlihazırda aktif kayıt var mı kontrol et
          // 5. Zaten aynı uniq_id ile tekrar giriş yapılmış mı?
          const existingParticipation = await SectionParticiptionLogs.findOne({
            where: {
              operator_id,
              uniq_id: sectionLog.uniq_id,
              exit_time: null,
            },
          });

          // 6. Bölüme tekrar katılımı kaydet
          if (!existingParticipation) {
            await SectionParticiptionLogs.create({
              operator_id: sectionLog.operator_id,
              join_time: end_time,
              exit_time: null,
              status: "1",
              uniq_id: sectionLog.uniq_id,
              order_no: sectionLog.order_no,
              section: sectionLog.section,
              machine_name: sectionLog.machine_name,
              area_name: sectionLog.area_name,
              field: sectionLog.field,
            });
          }

          // 7. Katılımcı mola sebebiyle durdurulmuş işe destek veriyorsa, stop kaydını güncelle
          await StoppedWorksLog.update(
            {
              stop_end_date: end_time,
              user_who_started: operator_id,
            },
            {
              where: {
                work_log_uniq_id: sectionLog.uniq_id,
                order_id: sectionLog.order_no,
                stop_end_date: null,
              },
            }
          );
        }
      }
    }

    return 1; // Başarılı dönüş
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
  checkUserBreakStatus,
};
