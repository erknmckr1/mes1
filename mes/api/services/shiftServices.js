const ShiftLog = require("../../models/ShiftLog");
const { Op } = require("sequelize");
const User = require("../../models/User");
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
  console.log("x");
  try {
    const result = await ShiftLog.findAll({
      where: {
        shift_status: {
          [Op.in]: ["1", "3"], // Belirli shift_status değerlerini filtrele
        },
      },
      include: [
        {
          model: User, // User tablosunu dahil et
          attributes: [
            "op_section",
            "title",
            "part",
            "address",
            "stop_name",
            "route",
          ], // Sadece gerekli sütunları seç
        },
      ],
    });

    if (result.length > 0) {
      return {
        status: 200,
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
//! Mesaiyi iptal edecek fonksiyon...
async function cancelShift(shift_uniq_id, cancelled_by) {
  const date = new Date().toISOString();
  try {
    await ShiftLog.update(
      {
        shift_status: "2",
        cancelled_by,
        cancelled_time: date,
      },
      {
        where: {
          shift_uniq_id,
        },
      }
    );

    return { status: 200, message: "Mesai başarıyla iptal edildi." };
  } catch (err) {
    console.error("Veritabanı hatası:", err);
    return { status: 500, message: "İç sunucu hatası." };
  }
}
//! Mesaiyi onaylayacak servis
async function approveShift(shift_uniq_id, approved_by) {
  const date = new Date().toLocaleString();

  try {
    const shift = await ShiftLog.findOne({
      where: {
        shift_uniq_id,
      },
    });

    if (!shift) {
      return {
        status: 404,
        message: "Mesai kaydı bulunamadı.",
      };
    }
    // Status kontrolü
    if (shift.shift_status === "2" || shift.shift_status === "3") {
      return {
        status: 400,
        message:
          "Bu mesai kaydı için işlem yapılamaz. Zaten onaylanmış veya iptal edilmiştir.",
      };
    }

    await ShiftLog.update(
      {
        approved_by,
        approve_time: date,
        shift_status: "3",
      },
      {
        where: {
          shift_uniq_id,
          shift_status: "1",
        },
      }
    );

    return { status: 200, message: "Mesai başarıyla onaylandı" };
  } catch (error) {
    console.error("Veritabanı hatası:", error);
    return { status: 500, message: "İç sunucu hatası." };
  }
}
module.exports = {
  createShift,
  getShiftLogs,
  cancelShift,
  approveShift,
};
