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
  const today = new Date().toISOString().split("T")[0]; // Bugünün tarihi (YYYY-MM-DD)
  try {
    const result = await ShiftLog.findAll({
      where: {
        shift_status: {
          [Op.in]: ["1", "3", "4", "5"], // Belirli shift_status değerlerini filtrele
        },
        start_date: {
          [Op.gte]: today, // start_date bugünün tarihi veya sonrası olanları al
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
  console.log(vasıtaForm);
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

//! servis bilgilerini guncelleyecek fonksıyon...
const updatedVehicleInfo = async (vasıtaForm, service_key) => {
  try {
    if (!service_key || !vasıtaForm.driver_name || !vasıtaForm.driver_no) {
      return {
        status: 400,
        message: "Eksik bilgi gönderildi (Servis Key, sürücü ismi, sürücü no).",
      };
    }

    const result = await ShiftLog.update(
      {
        driver_name: vasıtaForm.driver_name,
        driver_no: vasıtaForm.driver_no,
        vehicle_licance: vasıtaForm.vehicle_licance || null,
        station_name: vasıtaForm.station_name || null,
        service_time: vasıtaForm.service_time || null,
        evening_service_time: vasıtaForm.evening_service_time || null,
        morning_service_hours: vasıtaForm.morning_service_time || null,
        vehicle: vasıtaForm.vehicle,
      },
      { where: { service_key } }
    );

    if (result[0] === 0) {
      return { status: 404, message: "Servis bilgisi bulunamadı." };
    }

    return {
      status: 200,
      message: "Servis bilgileri güncelleme işlemi başarılı.",
    };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç Sunucu Hatası" };
  }
};

//! servis içindeki bir kullanıcıyı yenı bır servıse tasıyacak fonksıyon...
const moveToDiffService = async (draggedShiftItem, item) => {
  const {
    service_key,
    vehicle,
    morning_service_time,
    evening_service_time,
    start_date,
    driver_name,
    start_time,
    end_date,
    opproved_time,
    vehicle_plate_no,
  } = item;
  try {
    await ShiftLog.update(
      {
        service_key,
        vehicle,
        evening_service_time,
        morning_service_time,
        start_date,
        driver_name,
        start_time,
        end_date,
        opproved_time,
        vehicle_plate_no,
      },
      {
        where: {
          shift_uniq_id: draggedShiftItem.shift_uniq_id,
        },
      }
    );
    return {
      status: 200,
      message: `${draggedShiftItem.User.op_username} ${vehicle}'e taşındı.`,
    };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç Sunucu Hatası" };
  }
};
//! Servisten kullanıcı cıkarakcak servis...
const userOutOfService = async (selectedShift) => {
  const { shift_uniq_id } = selectedShift;
  try {
    await ShiftLog.update(
      {
        driver_name: "",
        driver_no: "",
        evening_service_time: "",
        morning_service_time: "",
        service_key: "",
        service_time: "",
        shift_status: "",
        station_name: "",
        vehicle: "",
        vehicle_plate_no: "",
        shift_status: "3",
      },
      {
        where: {
          shift_uniq_id,
        },
      }
    );
    return {
      status: 200,
      message: `${selectedShift.User.op_username} ${selectedShift.User.vehidle}'den çıkarıldı`,
    };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "İç Sunucu Hatası" };
  }
};
//! Servise kullanıcı ekleyecek servis...
const addUserToService = async (selection_shift, selectedShiftReport) => {
  console.log(selectedShiftReport);
  try {
    for (const shift of selection_shift) {
      await ShiftLog.update(
        {
          driver_name: selectedShiftReport.driver_name,
          driver_no: selectedShiftReport.driver_no,
          evening_service_time: selectedShiftReport.evening_service_time,
          morning_service_time: selectedShiftReport.morning_service_hours,
          service_key: selectedShiftReport.service_key,
          service_time: selectedShiftReport.service_time,
          vehicle: selectedShiftReport.vehicle,
          vehicle_plate_no: selectedShiftReport.vehicle_plate_no,
          station_name: selectedShiftReport.station_names?.[0] || null,
          shift_status:selectedShiftReport.shift_status
        },
        {
          where: {
            shift_uniq_id: shift.uniq_id,
          },
        }
      );
    }

    return {
      status: 200,
      message: `${selectedShiftReport.vehicle}'e kayıtlar eklendi`,
    };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç Sunucu Hatası" };
  }
};
module.exports = {
  createShift,
  getShiftLogs,
  cancelShift,
  approveShift,
  addVehicleInfo,
  savedShiftIndex,
  updatedVehicleInfo,
  moveToDiffService,
  userOutOfService,
  addUserToService,
};
