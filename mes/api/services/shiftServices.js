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
  try {
    const result = await ShiftLog.findAll({
      where: {
        shift_status: {
          [Op.in]: ["1", "3", "4", "5"], // Belirli shift_status değerlerini filtrele
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
            "op_username",
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

//! Ardısık servis_key
async function getNextServiceKey() {
  try {
    // Mevcut en büyük service_key değerini bul
    const maxKey = await ShiftLog.max("service_key");

    // Yeni service_key'i döndür
    return maxKey ? maxKey + 1 : 1; // Eğer hiç yoksa 1 ile başla
  } catch (err) {
    console.error(err);
    throw new Error("Service key oluşturulamadı.");
  }
}

//! vasıta bılgılerını guncelleyecek servıs...
async function addVehicleInfo(shiftUnıqIds, vasıtaForm) {
  const {
    driver_name,
    driver_no,
    vehicle_licance,
    station_name,
    service_time,
    evening_service_time,
    morning_service_time,
    vehicle,
  } = vasıtaForm;

  try {
    // Yeni bir service_key oluştur
    const newServiceKey = await getNextServiceKey();

    // Onaylanmamış kayıtları kontrol et
    const unapprovedShifts = await ShiftLog.count({
      where: {
        shift_uniq_id: shiftUnıqIds,
        shift_status: { [Op.ne]: "3" }, // Bu ifade, SQL'deki "eşit değildir" (!= veya <>) anlamını taşır.
      },
    });

    if (unapprovedShifts > 0) {
      return {
        status: 403,
        message:
          "Sadece onaylanmış kayıtlara vasıta bilgilerini ekleyebilirsiniz. Sadece onaylı kayıtları seçin.",
      };
    }

    // shift_status belirle
    const shift_status = morning_service_time
      ? "4"
      : evening_service_time
      ? "5"
      : null;

    if (!shift_status) {
      return {
        status: 400,
        message: "Geçerli bir sabah veya akşam servis zamanı giriniz.",
      };
    }

    // Kayıtları güncelle
    await ShiftLog.update(
      {
        driver_name,
        driver_no,
        station_name,
        evening_service_time,
        morning_service_time,
        service_time,
        vehicle_plate_no: vehicle_licance,
        vehicle,
        shift_status,
        service_key: newServiceKey,
      },
      {
        where: {
          shift_uniq_id: shiftUnıqIds,
        },
      }
    );

    return { status: 200, message: "Vasıta bilgileri başarıyla güncellendi." };
  } catch (err) {
    console.error(err); // Hata ayıklama için
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//! Servis içindeki surayı guncelleyecek servis...
async function savedShiftIndex(selectedServiceIndex) {
  try {
    for (const item of selectedServiceIndex) {
      const { shift_uniq_id, shift_index } = item;
      await ShiftLog.update(
        {
          shift_index,
        },
        {
          where: {
            shift_uniq_id,
          },
        }
      );
    }

    return { status: 200, message: "Sıra güncelleme işlemi başarılı." };
  } catch (err) {
    return { status: 500, message: "İç Sunucu Hatası" };
  }
}

module.exports = {
  createShift,
  getShiftLogs,
  cancelShift,
  approveShift,
  addVehicleInfo,
  savedShiftIndex,
};
