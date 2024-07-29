const LeaveReason = require("../../models/LeaveReasons");
const LeaveRecords = require("../../models/LeaveRecords");
const User = require("../../models/User");
const sendMail = require("./mailService");
const { Op } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

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

    const auth1Email = await User.findOne({
      where: {
        id_dec: auth1,
      },
      attributes: ["e_mail"], // Sadece e_mail alanını çekmek için
    });

    const approvalLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${newUniqId}&id_dec=${auth1}`;
    const cancelLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${newUniqId}&id_dec=${auth1}`;

    const emailContent = `
    <p>Yeni bir izin talebi oluşturuldu:</p>
    <ul>
      <li>Kullanıcı ID: ${id_dec}</li>
      <li>Kullanıcı Adı: ${op_username}</li>
      <li>Başlangıç Tarihi: ${baslangicTarihi}</li>
      <li>Dönüş Tarihi: ${donusTarihi}</li>
      <li>İzin Türü: ${izinTuru}</li>
      <li>İzin Sebebi: ${selectedReason}</li>
      <li>Açıklama: ${aciklama}</li>
    </ul>
    <p>İzin talebini onaylamak için aşağıdaki butona tıklayın:</p>
    <div style="padding: 10px 20px; color: white; text-decoration: none; display:flex;" >
    <a href="${approvalLink}" style="padding: 10px 20px; background-color: green; color: white; text-decoration: none;">Onayla</a>
    <a href="${cancelLink}" style="padding: 10px 20px; background-color: red; color: white; text-decoration: none;">İptal Et</a>
    </div>
   
  `;

    // Mail gönderim işlemi
    await sendMail(auth1Email.e_mail, "Yeni İzin Talebi 1. Onay", emailContent);

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
      where: {
        id_dec,
        leave_status: {
          [Op.in]: ["1", "2"], // Sadece `1` ve `2` durumundaki izinler
        },
      },
    });

    if (Array.isArray(result) && result.length > 0) {
      return result;
    } else {
      return false;
    }
  } catch (err) {
    console.error("Error fetching records:", err);
    throw err;
  }
};

//! aktif kullanıcının onaylanmıs ızınlerını cekecek servis...
const getApprovedLeaves = async ({ id_dec }) => {
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

//! aktıf kullanıcnın bekleyen haric ıslemlerını gosterecek servis...
const getPastLeaves = async ({ id_dec }) => {
  try {
    const result = await LeaveRecords.findAll({
      where: {
        id_dec,
        leave_status: {
          [Op.in]: ["3", "4"],
        },
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

//! izni iptal edecek servis
async function cancelPendingApprovalLeave({
  id_dec,
  leave_uniq_id,
  currentDateTimeOffset,
}) {
  try {
    const updatedRowsCount = await LeaveRecords.update(
      {
        // burada donen deger 1 yada 0 mıs
        leave_status: "4",
        user_who_cancelled: id_dec,
        leave_cancel_date: currentDateTimeOffset,
      },
      {
        where: {
          leave_uniq_id: leave_uniq_id,
          leave_status: "1",
        },
      }
    );

    return updatedRowsCount > 0;
  } catch (err) {
    console.error("Error fetching records:", err);
  }
}

//! Yöneticinin onaylayacagı ızınlerı cekecek servis...
async function getPendingApprovalLeaves({ id_dec }) {
  try {
    const pendingLeaves = await LeaveRecords.findAll({
      where: {
        [Op.or]: [
          { auth1: id_dec, leave_status: "1" }, // auth1 onay bekleyen durum
          { auth2: id_dec, leave_status: "2" }, // auth2 onay bekleyen durum
        ],
      },
    });
    return pendingLeaves;
  } catch (err) {
    console.error("Error fetching pending approval leaves:", err);
  }
}

//! İlgili talepi onaylayacak servis...
async function approveLeave(id_dec, leave_uniq_id, currentDateTimeOffset) {
  try {
    const leaveRecord = await LeaveRecords.findOne({
      where: {
        leave_uniq_id,
      },
    });

    if (!leaveRecord) {
      console.error("Leave record not found");
      return { status: 404, message: "Leave record not found" };
    }

    const auth2Email = await User.findOne({
      where: {
        id_dec,
      },
      attributes: ["e_mail"], // Sadece e_mail alanını çekmek için
    });

    if (!auth2Email) {
      console.error("Auth2 email not found");
      return { status: 404, message: "Auth2 email not found" };
    }

    const guvenlik_email = await User.findOne({
      where: {
        op_section: "Guvenlik",
      },
      attributes: ["e_mail"], // Sadece e_mail alanını çekmek için
    });

    if (!guvenlik_email) {
      console.error("Security email not found");
      return { status: 404, message: "Security email not found" };
    }

    if (leaveRecord.auth1 === id_dec && leaveRecord.leave_status === "1") {
      leaveRecord.leave_status = "2";
      leaveRecord.first_approver_approval_time = currentDateTimeOffset;

      const approvalLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${leave_uniq_id}&id_dec=${leaveRecord.auth2}`;
      const cancelLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${leave_uniq_id}&id_dec=${leaveRecord.auth2}`;
      const emailContent = `
        <p>Yeni bir izin talebi oluşturuldu:</p>
        <ul>
          <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
          <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
          <li>Başlangıç Tarihi: ${leaveRecord.leave_start_date}</li>
          <li>Dönüş Tarihi: ${leaveRecord.leave_end_date}</li>
          <li>İzin Türü: ${leaveRecord.leave_type}</li>
          <li>İzin Sebebi: ${leaveRecord.leave_reason}</li>
          <li>Açıklama: ${leaveRecord.leave_description}</li>
        </ul>
        <p>İzin talebini onaylamak için aşağıdaki butona tıklayın:</p>
       <div style="padding: 10px 20px; color: white; text-decoration: none; display:flex;" >
    <a href="${approvalLink}" style="padding: 10px 20px; background-color: green; color: white; text-decoration: none;">Onayla</a>
    <a href="${cancelLink}" style="padding: 10px 20px; background-color: red; color: white; text-decoration: none;">İptal Et</a>
    </div>
      `;
      // Mail gönderim işlemi
      await sendMail(
        auth2Email.e_mail,
        "Yeni İzin Talebi 2. Onay",
        emailContent
      );
    } else if (
      leaveRecord.auth2 === id_dec &&
      leaveRecord.leave_status === "2"
    ) {
      leaveRecord.leave_status = "3";
      leaveRecord.second_approver_approval_time = currentDateTimeOffset;

      const güvenlikEmailContent = `
      <p>Yeni bir izin talebi oluşturuldu:</p>
      <ul>
        <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
        <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
        <li>Başlangıç Tarihi: ${leaveRecord.leave_start_date}</li>
        <li>Dönüş Tarihi: ${leaveRecord.leave_end_date}</li>
        <li>İzin Sebebi:${leaveRecord.leave_reason}</li>
        <li>Açıklama: ${leaveRecord.leave_description}</li>
      </ul>
      <p>İzin talebini onaylamak için aşağıdaki butona tıklayın:</p>
    `;

      await sendMail(
        guvenlik_email.e_mail,
        "Çikis Yapacak Personel (İZİN)",
        güvenlikEmailContent
      );
    } else {
      console.error("Invalid approver or leave status");
      return { status: 400, message: "Invalid approver or leave status" };
    }

    await leaveRecord.save();
    return { status: 200, message: "Leave approved successfully" };
  } catch (error) {
    console.error("Error in approveLeave function:", error);
    return { status: 500, message: "Internal Server Error" };
  }
}

//! Yöneticinin onayladıgı kayıtları cekecek query..
async function getManagerApprovedLeaves({ id_dec }) {
  try {
    const approvedRecord = await LeaveRecords.findAll({
      where: {
        [Op.or]: [
          { auth1: id_dec, leave_status: "2" }, // auth1 onay bekleyen durum
          { auth2: id_dec, leave_status: "3" }, // auth2 onay bekleyen durum
        ],
      },
    });

    if (approvedRecord.length > 0) {
      return { status: 200, message: approvedRecord };
    } else {
      return { status: 404, message: "Leave approved not found" };
    }
  } catch (err) {
    return { status: 500, message: "Internal Server Error" };
  }
}

//! Belırlı bır tarıh aralıgı ıle ızın cekecek servıs
async function getDateRangeLeave(leave_start_date, leave_end_date) {
  try {
    const leaveRecords = await LeaveRecords.findAll({
      where: {
        leave_status: 3,
        leave_start_date: {
          [Op.lte]: leave_end_date,
        },
        leave_end_date: {
          [Op.gte]: leave_start_date,
        },
      },
    });

    if (leaveRecords.length > 0) {
      return { status: 200, message: leaveRecords };
    } else {
      return {
        status: 404,
        message: "No authorized users were found in the range you specified",
      };
    }
  } catch (err) {
    console.error(err);
    return { status: 500, message: "Internal Server Error" };
  }
}

//! Bütün izinleri cekecek servis...
async function getAllTimeOff() {
  try {
    const allTimeOff = await LeaveRecords.findAll({
      where: {
        leave_status: 3,
      },
    });

    if (allTimeOff.length > 0) {
      return { status: 200, message: allTimeOff };
    } else {
      return { status: 404, message: "Hata ? " };
    }
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Internal Server Error" };
  }
}

module.exports = {
  getLeaveReasons,
  createNewLeave,
  getPendingLeaves,
  getPendingApprovalLeaves,
  getApprovedLeaves,
  getPastLeaves,
  cancelPendingApprovalLeave,
  approveLeave,
  getManagerApprovedLeaves,
  getDateRangeLeave,
  getAllTimeOff,
};
