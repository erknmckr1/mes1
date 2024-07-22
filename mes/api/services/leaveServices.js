const LeaveReason = require("../../models/LeaveReasons");
const LeaveRecords = require("../../models/LeaveRecords");

//! İzin sebeplerini dönecek fonksiyon
const getLeaveReasons = async () => {
  try {
    const result = await LeaveReason.findAll();
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//! Yeni izin oluşturacak fonksiyon
const createNewLeave = async (
  formData,
  selectedReason,
  id_dec,
  op_username,
  currentDateTimeOffset,
  auth1,
  auth2
) => {
  const { izinTuru, baslangicTarihi, donusTarihi, aciklama } = formData;
  try {
    const latestLeaveRecord = await LeaveRecords.findOne({
      order: [["leave_uniq_id", "DESC"]],
    });

    let newUniqId;
    if (latestLeaveRecord) {
      const latestId = parseInt(latestLeaveRecord.leave_uniq_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0"); // 6 haneli sıralı ID oluştur
    } else {
      newUniqId = "000001"; // Eğer kayıt yoksa ilk ID'yi oluştur
    }

    const result = await LeaveRecords.create({
      op_username,
      id_dec,
      leave_uniq_id: newUniqId,
      leave_creation_date: currentDateTimeOffset,
      leave_start_date: baslangicTarihi,
      leave_end_date: donusTarihi,
      leave_reason: selectedReason,
      leave_description: aciklama,
      leave_status: "1",
      leave_type: izinTuru,
      auth1,
      auth2,
    });

    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//!İlgili kullanıcının bekleyen izin kayıtlarını donecek servis
const getPendingLeaves = async ({ id_dec }) => {
  try {
    const result = await LeaveRecords.findAll({
      where: { id_dec, leave_status: "1" },
    });

    // result dizi mi ve 0 dan buyuk mu ?
    if (Array.isArray(result) && result.length > 0) {
      return result;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Error fetching records:", err);
  }
};

//! aktif kullanıcının onaylanmıs ızınlerını cekecek servis...
const getApprovedLeaves = async ({ id_dec }) => {
  try {
    const result = await LeaveRecords.findAll({
      where: {
        id_dec,
        leave_status: "2", // 2 bekleyen durumu...
      },
    });
    if (Array.isArray(result) && result.length > 0) {
      return result;
    } else {
      false;
    }
  } catch (err) {
    console.error("Error fetching records:", err);
  }
};

//! aktıf kullanıcnın bekleyen haric ıslemlerını gosterecek servis...
const getPastLeaves = async ({ id_dec }) => {
  try {
    const result = await LeaveRecords.findAll({
      where: {
        id_dec,
        leave_status: "3",
      },
    });
    if (Array.isArray(result) && result.length > 0) {
      return result;
    } else {
      false;
    }
  } catch (err) {
    console.error("Error fetching records:", err);
  }
};

async function cancelPendingApprovalLeave ({id_dec,leave_uniq_id,currentDateTimeOffset}) {
  try {
    const updatedRowsCount = await LeaveRecords.update({ // burada donen deger 1 yada 0 mıs 
      leave_status:"3",
      user_who_cancelled:id_dec,
      leave_cancel_date:currentDateTimeOffset
    },{
      where:{
        leave_uniq_id:leave_uniq_id,
        leave_status:"1"
      }
    })

    return updatedRowsCount > 0;
  } catch (err) {
    console.error("Error fetching records:", err);
  }
}

//! İlgili yonetıcının onayına dusen ızınlerını cekecek query... auth(1)
const getPendingApprovalLeaves = async ({ id_dec }) => {
  try {
    const updatedRowsCount = await LeaveRecords.findAll({
      where: { auth1: id_dec },
    });

    return updatedRowsCount > 0;
  } catch (err) {
    console.error("Error fetching records:", err);
  }
};

module.exports = {
  getLeaveReasons,
  createNewLeave,
  getPendingLeaves,
  getPendingApprovalLeaves,
  getApprovedLeaves,
  getPastLeaves,
  cancelPendingApprovalLeave
};
