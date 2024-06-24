const BreakReason = require("../models/BreakReason");
const BreakLog = require("../models/BreakLog");
const pool = require("../lib/dbConnect");
const sequelize = require("../lib/dbConnect");

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

//! tüm break loglarını getırecek query
const getBreakReasonLog = async () => {
  try {
    const breakLog = await pool.query(`SELECT *
    FROM public.break_log;`);
    return breakLog.rows;
  } catch (err) {
    console.log(err);
  }
};

//! Belirli bir kullanıcıyı molada mı dıye sorgulayacak query... Eğer yoksa yenı bır log atacak
//! varsa mevcut logu donecek...
const getIsUserOnBreak = async (startLog) => {
  const { area_name, operator_id, break_reason_id, op_name,section } = startLog;
  const start_date = new Date().toISOString();
  try {

    // Kullanıcı molada mı onu kontrol edıyoruz...
    const isStart = await BreakLog.findOne({
      where: {
        operator_id: operator_id,
        end_date:null
      },
    });

    // molada degılse
    if (!isStart) {
      const createBreak = await BreakLog.create({
        break_reason_id: break_reason_id,
        operator_id: operator_id,
        start_date: start_date,
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
const onBreakUsers = async () => {
  try {
    const isBreakUsers = await BreakLog.findAll({
      where: {
        end_date: null,
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
  console.log('Updating break for operator:', operator_id, 'with end time:', end_time);

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

    console.log('Update result:', result);

    // Güncellenen kayıtları kontrol et
    const updatedRecords = await BreakLog.findAll({
      where: {
        end_date: end_time,
        operator_id: operator_id,
      },
    });
    console.log('Updated records:', updatedRecords);

    if (updatedRecords.length > 0) {
      console.log('Records successfully updated:', updatedRecords);
      return updatedRecords.length; // Güncelleme başarılı, güncellenen kayıt sayısını döner
    } else {
      console.log('No records found with updated end_date');
      return 0; // Güncelleme başarısız
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};


module.exports = {
  getBreakReason,
  getBreakReasonLog,
  getIsUserOnBreak,
  onBreakUsers,
  returnToBreak,
  createBreakReason,
};
