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
    // Kullanıcının aktif molası var mı?
    const isStart = await BreakLog.findOne({
      where: { operator_id, end_date: null },
    });

    let isSectionParticipated = null;
    let field = null;

    // Eğer telcekme ya da cekic alanındaysa çıkış işlemi yapılır
    if (["telcekme", "cekic"].includes(area_name)) {
      isSectionParticipated = await SectionParticiptionLogs.findOne({
        where: {
          operator_id,
          exit_time: null,
        },
      });

      if (isSectionParticipated) {
        field = isSectionParticipated.field;

        await SectionParticiptionLogs.update(
          {
            exit_time: currentDateTimeOffset,
            status: "5", // mola sebebiyle çıkış
          },
          {
            where: {
              operator_id,
              exit_time: null,
            },
          }
        );
      }
    }

    // Aynı makine/tezgah alanında başka çalışan var mı kontrolü
    let activeParticipantsOnSameMachines = [];
    let activeParticipantsOnSameField = [];

    if (area_name === "telcekme" && isSectionParticipated) {
      activeParticipantsOnSameMachines = await SectionParticiptionLogs.findAll({
        where: {
          exit_time: null,
          section,
          area_name,
          machine_name: isSectionParticipated.machine_name,
          operator_id: { [Op.ne]: operator_id },
        },
      });
    }

    if (area_name === "cekic" && isSectionParticipated?.field) {
      activeParticipantsOnSameField = await SectionParticiptionLogs.findAll({
        where: {
          exit_time: null,
          section,
          area_name,
          field: isSectionParticipated.field,
          operator_id: { [Op.ne]: operator_id },
        },
      });
    }

    // İş durdurulmalı mı?
    const shouldStopWorks =
      (area_name === "telcekme" &&
        activeParticipantsOnSameMachines.length === 0) ||
      (area_name === "cekic" && activeParticipantsOnSameField.length === 0) ||
      !["telcekme", "cekic"].includes(area_name);

    let works = [];

    if (shouldStopWorks) {
      console.log("✅ İşler durduruluyor...");

      // Artık iş durdurma için işi başlatan kullanıcı değil, o field’daki işler sorgulanmalı
      const workWhereClause = {
        area_name,
        section,
        work_status: "1",
      };

      if (area_name === "cekic" && field) {
        workWhereClause["field"] = field;
      }

      works = await WorkLog.findAll({ where: workWhereClause });

      await Promise.all(
        works.map((work) =>
          StoppedWorksLog.create({
            order_id: work.order_no,
            stop_start_date: currentDateTimeOffset,
            work_log_uniq_id: work.uniq_id,
            stop_reason_id: "9",
            user_who_stopped: operator_id, // işi durduran
          })
        )
      );

      await Promise.all(
        works.map((work) =>
          WorkLog.update(
            { work_status: "9" },
            { where: { uniq_id: work.uniq_id } }
          )
        )
      );
    } else {
      console.log(
        `⏸ İş durdurulmadı: ${area_name} alanında aynı field/machine’de çalışanlar mevcut.`
      );
    }

    // Eğer daha önce mola yoksa log oluştur
    if (!isStart) {
      const createBreak = await BreakLog.create({
        break_reason_id,
        operator_id,
        start_date: currentDateTimeOffset,
        section,
        area_name,
        op_name,
      });
      return { createBreak, isAlreadyOnBreak: false };
    } else {
      return { isAlreadyOnBreak: true, existingBreak: isStart };
    }
  } catch (err) {
    console.error("Molaya çıkışta hata:", err);
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
    // 1. Molayı bitir
    await BreakLog.update(
      { end_date: end_time },
      {
        where: {
          end_date: null,
          operator_id,
        },
      }
    );

    // 2. Bu kullanıcı tarafından başlatılmış ve durdurulmuş işler varsa -> geri başlat
    const works = await WorkLog.findAll({
      where: {
        user_id_dec: operator_id,
        work_status: "9",
      },
    });

    if (works.length > 0) {
      await Promise.all([
        ...works.map((work) =>
          StoppedWorksLog.update(
            {
              stop_end_date: end_time,
              user_who_started: operator_id,
            },
            {
              where: {
                work_log_uniq_id: work.uniq_id,
                order_id: work.order_no,
              },
            }
          )
        ),
        ...works.map((work) =>
          WorkLog.update(
            { work_status: "1" },
            {
              where: {
                user_id_dec: operator_id,
                uniq_id: work.uniq_id,
              },
            }
          )
        ),
      ]);
    }

    // 3. molada destekçi olarak çıkmış ama işi aktif olan kullanıcıları telcekme/cekic için tekrar bölüme al
    const exitedDuringBreak = await SectionParticiptionLogs.findAll({
      where: {
        operator_id,
        exit_time: { [Op.not]: null },
        status: "5",
        area_name: { [Op.in]: ["telcekme", "cekic"] },
      },
    });

    for (const sectionLog of exitedDuringBreak) {
      const { area_name, uniq_id, order_no, section, machine_name, field } =
        sectionLog.get();

      const isHammerArea = area_name === "cekic";

      // Eğer çekiç alanındaysa uniq_id/order_no olmadan da kayıt yapılmalı
      let shouldInsert = false;

      if (isHammerArea) {
        shouldInsert = true;
      } else {
        const relatedWork = await WorkLog.findOne({
          where: {
            uniq_id,
            order_no,
            work_status: { [Op.in]: ["1", "2", "9"] },
          },
        });

        if (relatedWork) shouldInsert = true;
      }

      if (!shouldInsert) continue;

      const alreadyParticipating = await SectionParticiptionLogs.findOne({
        where: {
          operator_id,
          exit_time: null,
          ...(uniq_id ? { uniq_id } : {}),
        },
      });

      if (!alreadyParticipating) {
        await SectionParticiptionLogs.create({
          operator_id,
          join_time: end_time,
          exit_time: null,
          status: "1",
          uniq_id,
          order_no,
          section,
          machine_name,
          area_name,
          field,
        });

        console.log("Kullanıcı bölüme tekrar dahil edildi:", {
          operator_id,
          area_name,
          section,
          status: 1,
        });
      }

      // Sadece uniq_id ve order_no doluysa stop ve work güncellemesi yapılmalı
      if (uniq_id && order_no) {
        await StoppedWorksLog.update(
          {
            stop_end_date: end_time,
            user_who_started: operator_id,
          },
          {
            where: {
              work_log_uniq_id: uniq_id,
              order_id: order_no,
              stop_end_date: null,
            },
          }
        );

        await WorkLog.update(
          { work_status: "1" },
          {
            where: {
              uniq_id,
              order_no,
              work_status: "9",
            },
          }
        );
      }

      // 🔧 ÇEKİÇ alanı için: aynı field'deki işler durmuşsa ve bu kullanıcı dönen ilk kişiyse -> işi başlat
      if (isHammerArea) {
        const othersActive = await SectionParticiptionLogs.findAll({
          where: {
            area_name: "cekic",
            field,
            section,
            exit_time: null,
            operator_id: { [Op.ne]: operator_id },
          },
        });

        if (othersActive.length === 0) {
          const stoppedWorksInField = await WorkLog.findAll({
            where: {
              section,
              work_status: "9",
            },
          });

          if (stoppedWorksInField.length > 0) {
            await Promise.all([
              ...stoppedWorksInField.map((work) =>
                StoppedWorksLog.update(
                  {
                    stop_end_date: end_time,
                    user_who_started: operator_id,
                  },
                  {
                    where: {
                      work_log_uniq_id: work.uniq_id,
                      order_id: work.order_no,
                      stop_end_date: null,
                    },
                  }
                )
              ),
              ...stoppedWorksInField.map((work) =>
                WorkLog.update(
                  { work_status: "1" },
                  {
                    where: {
                      uniq_id: work.uniq_id,
                      order_no: work.order_no,
                      work_status: "9",
                    },
                  }
                )
              ),
            ]);

            console.log(
              `[çekic - ${field}] alanındaki işler tekrar başlatıldı.`
            );
          }
        }
      }
    }

    return 1;
  } catch (err) {
    console.error("Moladan dönüş hatası:", err);
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
