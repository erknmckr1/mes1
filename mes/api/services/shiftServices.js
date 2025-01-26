const ShiftLog = require("../../models/ShiftLog");
const { Op } = require("sequelize");
const User = require("../../models/User");
//! Yenı bır mesai verisi olusturacak servis
const createShift = async ({
  created_by,
  start_date,
  end_date,
  start_time,
  end_time,
  selectedShiftUser,
}) => {
  try {
    let successCount = 0;
    let errors = [];

    for (const user of selectedShiftUser) {
      try {
        // Kullanıcının aynı gün içinde shift_status'u 2 (iptal edilmiş) olmayan bir mesai kaydı var mı?
        const userShift = await ShiftLog.findOne({
          where: {
            operator_id: user.id_dec,
            start_date, // Aynı gün için kontrol
            shift_status: {
              [Op.ne]: "2", // shift_status 2 değilse
            },
          },
        });

        // Eğer kullanıcı için geçerli bir mesai kaydı varsa, hata listesine ekle ve devam et
        if (userShift) {
          errors.push({
            user: user.op_username,
            message:
              "Bu kullanıcı için zaten aktif bir mesai kaydı mevcut (iptal edilmemiş).",
          });
          continue; // İşleme devam et
        }

        // Mesai kaydı oluştur
        await ShiftLog.create({
          operator_id: user.id_dec,
          created_by,
          start_date,
          end_date,
          start_time,
          end_time,
          shift_status: "1", // Varsayılan başlangıç durumu
        });

        successCount++;
      } catch (error) {
        console.error(`Hata: ${user.op_username}`, error);
        errors.push({
          user: user.op_username,
          message: error.message,
        });
      }
    }

    if (successCount === selectedShiftUser.length) {
      return { status: 200, message: "Tüm mesailer başarıyla oluşturuldu." };
    } else if (successCount > 0) {
      return {
        status: 206,
        message: `${successCount} mesai başarıyla oluşturuldu, ancak ${errors
          .map((item) => item.user)
          .join(
            ", "
          )} için mesai kaydı oluşturulamadı. Aynı gün içinde zaten aktif bir mesai kaydı olabilir.`,
      };
    } else if (errors.length > 0) {
      return {
        status: 206,
        message: `Hiçbir mesai oluşturulamadı. Aynı gün içinde zaten aktif bir mesai kaydı olan kullanıcılar: ${errors
          .map((item) => item.user)
          .join(", ")}`,
      };
    } else {
      return { status: 400, message: "Hiçbir mesai oluşturulamadı." };
    }
  } catch (err) {
    console.error(err);
    return { status: 500, message: "İç sunucu hatası." };
  }
};

module.exports = { createShift };

//! Tüm mesai verisini çekecek servis...
async function getShiftLogs(id_dec, permissions) {
  const today = new Date().toISOString().split("T")[0]; // Bugünün tarihi (YYYY-MM-DD)
  try {
    // Temel sorgu koşulları
    const whereConditions = {
      shift_status: {
        [Op.in]: ["1", "2", "3", "4", "5"], // Belirli shift_status değerlerini filtrele
      },
      start_date: {
        [Op.gte]: today, // Bugün veya sonrası
      },
    };

    // Permissions'a göre filtreleme yap
    if (permissions.includes("Mesaidarisler")) {
      // Mesaidarisler izni varsa ek bir filtreleme yapma, tüm kayıtları getir
    } else if (
      permissions.includes("MesaiOlusturma") ||
      permissions.includes("MesaiOnaylama")
    ) {
      // Mesai oluşturma veya onaylama izni varsa sadece kullanıcıya ait kayıtları getir
      whereConditions.created_by = id_dec;
    } else {
      // İzin yoksa boş bir sonuç döndür veya hata fırlat
      return { status: 403, message: "Erişim izniniz yok." };
    }
    // Veritabanı sorgusu
    const result = await ShiftLog.findAll({
      where: whereConditions,
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

    // Sonuç kontrolü
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
    vehicle,
    service_period,
  } = vasıtaForm;
  try {
    // Yeni bir service_key oluştur
    const newServiceKey = await getNextServiceKey();

    const selectedShifts = await ShiftLog.findAll({
      where: {
        shift_uniq_id: shiftUnıqIds,
      },
      attributes: ["shift_uniq_id", "start_date"],
    });

    // selectedShift te servıs olusturalacak kayıların start dateleri birbirinden farklı olmamalı...
    // new Set([...]) ile unique bir dizi oluşturulur ve bu dizi içindeki elemanlar birbirinden farklı olur.
    const uniqueDates = [
      ...new Set(selectedShifts.map((item) => item.start_date)),
    ];

    if (uniqueDates.length > 1) {
      return {
        status: 400,
        message:
          "Seçilen kayıtlar farklı tarihlere sahip. Lütfen aynı tarihli kayıtları seçin.",
      };
    }

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

    // Sabah veya akşam servisine göre shift_status belirle
    let shift_status = "";
    if (service_period === "Sabah") {
      shift_status = "4";
    } else if (service_period === "Aksam") {
      shift_status = "5";
    }
    // Kayıtları güncelle
    await ShiftLog.update(
      {
        driver_name,
        driver_no,
        station_name,
        service_time,
        vehicle_plate_no: vehicle_licance,
        vehicle,
        shift_status,
        service_key: newServiceKey,
        service_period,
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
        vehicle: vasıtaForm.vehicle,
        service_period: vasıtaForm.service_period || null,
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
const addUserToService = async (
  selection_shift,
  selectedShiftReport,
  vasıtaForm
) => {
  const { station_name, service_time } = vasıtaForm;
  try {
    for (const shift of selection_shift) {
      await ShiftLog.update(
        {
          driver_name: selectedShiftReport.driver_name,
          driver_no: selectedShiftReport.driver_no,
          service_key: selectedShiftReport.service_key,
          service_time: service_time,
          vehicle: selectedShiftReport.vehicle,
          vehicle_plate_no: selectedShiftReport.vehicle_plate_no,
          station_name: station_name,
          shift_status: selectedShiftReport.shift_status,
          service_period: selectedShiftReport.service_period,
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
//! Seçili hücreyi güncelleyecek fonksiyon...
const updateShiftCell = async (shift_uniq_id, columnKey, value) => {
  try {
    await ShiftLog.update(
      {
        [columnKey]: value,
      },
      {
        where: {
          shift_uniq_id,
        },
      }
    );

    return { status: 200, message: `${columnKey} başarıyla güncellendi.` };
  } catch (error) {
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
  updateShiftCell,
};
