const ShiftLog = require("../../models/ShiftLog");

//! Yenı bır mesai verisi olusturacak servis
async function createShift(
  operator_id,
  created_by,
  start_date,
  end_date,
  start_time,
  end_time,
  route,
  address,
  stop_name
) {
  try {
    const result = await ShiftLog.create({
      operator_id,
      created_by,
      start_date,
      end_date,
      start_time,
      end_time,
      shift_status: "1",
      route,
      address,
      stop_name,
    });

    if (result) {
      return { status: 200, message: "Mesai başarıyla onaya gönderildi" };
    } else {
      return { status: 400, message: "Mesai oluşturulamadu." };
    }
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//! Tüm mesai verisini çekecek servis...
async function getShiftLogs() {
  try {
    const result = await ShiftLog.findAll();
    if (result.length > 0) {
      return {
        status: 200,
        message: "Mesai başarıyla alındı",
        message: result,
      };
    } else {
      return { status: 404, message: "Kayıt bulunamadı." };
    }
  } catch (err) {
    console.error("Veritabanı hatası:", err);
    return { status: 500, message: "İç sunucu hatası." };
  }
}

module.exports = {
  createShift,
  getShiftLogs,
};
