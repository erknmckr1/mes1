const LeaveReason = require("../../models/LeaveReasons");
const LeaveRecords = require("../../models/LeaveRecords");
const User = require("../../models/User");
const sendMail = require("./mailService");
const { Op } = require("sequelize");
const dotenv = require("dotenv");
const Permission = require("../../models/Permissions");
const Role = require("../../models/Roles");
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

    // yenı izin kaydı..
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

    // izin talebı olusturan kullanıcının 1. onaycısınının mailini bul
    const auth1Email = await User.findOne({
      where: {
        id_dec: String(auth1),
      },
      attributes: ["e_mail"],
    });

    if (auth1Email) {
      const approvalLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${newUniqId}&id_dec=${auth1}`;
      const cancelLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/cancelPendingApprovalLeave?leave_uniq_id=${newUniqId}&id_dec=${auth1}`;

      const emailContent = `
      <p>Yeni bir izin talebi oluşturuldu:</p>
      <ul>
        <li>Kullanıcı ID: ${id_dec}</li>
        <li>Kullanıcı Adı: ${op_username}</li>
        <li>Başlangıç Tarihi: ${new Date(baslangicTarihi).toLocaleDateString(
          "tr-TR",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )}</li>
        <li>Dönüş Tarihi: ${new Date(donusTarihi).toLocaleDateString("tr-TR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
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
      await sendMail(
        auth1Email.e_mail,
        "Yeni İzin Talebi 1. Onay",
        emailContent
      );
    }

    return result;
  } catch (err) {
    console.error({ hata: err });
  }
};

//! Ik kullanıcı için yeni bir izin oluşturursa...
async function createNewLeaveByIK(
  formData,
  id_dec,
  op_username,
  auth1,
  auth2,
  userInfo
) {
  const { baslangicTarihi, donusTarihi, aciklama, izinSebebi } = formData;
  const currentDateTimeOffset = new Date().toISOString();
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
      leave_reason: izinSebebi,
      leave_description: aciklama,
      leave_status: "3",
      auth1: userInfo.id_dec,
      auth2: userInfo.id_dec,
      first_approver_approval_time: currentDateTimeOffset,
      second_approver_approval_time: currentDateTimeOffset,
    });

    console.log(result);

    if (result) {
      return { status: 200, message: "İzin talebi başarıyla oluşturuldu." };
    } else {
      return { status: 400, message: "İzin talebi oluşturulamadı." };
    }
  } catch (err) {
    console.log(err);
    return { status: 500, message: "İç sunucu hatası." };
  }
}

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
      order: [["leave_creation_date", "DESC"]],
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
      order: [["leave_creation_date", "DESC"]],
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
    const user = await User.findOne({
      where: {
        id_dec,
      },
      include: {
        model: Role,
        include: {
          model: Permission,
        },
      },
    });

    if (!user) {
      console.error("User not found");
      return { status: 404, message: "User not found" };
    }

    const permissions = user.Role.Permissions.map(
      (permission) => permission.name
    );
    const isIK =
      permissions.includes("Görme") &&
      permissions.includes("1. Onay") &&
      permissions.includes("2. Onay") &&
      permissions.includes("İptal");

    const isRevir =
      permissions.includes("1. Onay") &&
      permissions.includes("2. Onay") &&
      permissions.includes("İptal");

    if (isIK || isRevir) {
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
            leave_status: {
              [Op.in]: ["1", "2", "3"],
            },
          },
        }
      );
      return updatedRowsCount > 0;
    } else {
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
            leave_status: {
              [Op.in]: ["1", "2"],
            },
          },
        }
      );
      return updatedRowsCount > 0;
    }
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
      order: [["leave_creation_date", "DESC"]],
    });
    return pendingLeaves;
  } catch (err) {
    console.error("Error fetching pending approval leaves:", err);
  }
}

//! İlgili talebi onaylayacak servis...
async function approveLeave(id_dec, leave_uniq_id, currentDateTimeOffset) {
  try {
    // gonderılen ıd ıle ılgılı kaydı bul...
    const leaveRecord = await LeaveRecords.findOne({
      where: {
        leave_uniq_id,
      },
    });

    // kayıt bulunamadıysa
    if (!leaveRecord) {
      console.error("Leave record not found");
      return {
        status: 200,
        message: `
          <div style="width: 300px; height: 100px; display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;">
            <p style='color:yellow; text-align: center;'>İzin Kaydı Bulunamadı.</p>
          </div>
        `,
      };
    }

    const user = await User.findOne({
      where: {
        id_dec,
      },
      include: {
        model: Role,
        include: {
          model: Permission,
        },
      },
    });

    if (!user) {
      console.error("User not found");
      return { status: 404, message: "User not found" };
    }

    const permissions = user.Role.Permissions.map(
      (permission) => permission.name
    );

    const isIK =
      permissions.includes("Görme") &&
      permissions.includes("1. Onay") &&
      permissions.includes("2. Onay");

    const auth2Email = await User.findOne({
      where: {
        auth2: leaveRecord.auth2,
      },
      attributes: ["e_mail"], // Sadece e_mail alanını çekmek için
    });

    // if (!auth2Email) {
    //   console.error("Auth2 email not found");
    //   return { status: 404, message: "Auth2 email not found" };
    // }

    const guvenlik_email = await User.findOne({
      where: {
        part: "Guvenlik",
      },
      attributes: ["e_mail"], // Sadece e_mail alanını çekmek için
    });

    // if (!guvenlik_email) {
    //   console.error("Security email not found");
    //   return { status: 404, message: "Security email not found" };
    // }

    if (
      (leaveRecord.auth1 === id_dec || isIK) &&
      leaveRecord.leave_status === "1"
    ) {
      if (!leaveRecord.auth2) {
        leaveRecord.leave_status = "3";
        leaveRecord.first_approver_approval_time = currentDateTimeOffset;
        leaveRecord.second_approver_approval_time = currentDateTimeOffset;

        const güvenlikEmailContent = `
        <p>Yeni bir izin talebi oluşturuldu:</p>
        <ul>
          <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
          <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
          <li>Başlangıç Tarihi: ${new Date(
            leaveRecord.leave_start_date
          ).toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</li>
          <li>Dönüş Tarihi: ${new Date(
            leaveRecord.leave_end_date
          ).toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</li>
          <li>İzin Sebebi: ${leaveRecord.leave_reason}</li>
          <li>Açıklama: ${leaveRecord.leave_description}</li>
        </ul>
      `;

        if (guvenlik_email) {
          await sendMail(
            guvenlik_email.e_mail,
            "Çikis Yapacak Personel (İZİN)",
            güvenlikEmailContent
          );
        }
      } else {
        leaveRecord.leave_status = "2";
        leaveRecord.first_approver_approval_time = currentDateTimeOffset;

        const approvalLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave?leave_uniq_id=${leave_uniq_id}&id_dec=${leaveRecord.auth2}`;
        const cancelLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/cancelPendingApprovalLeave?leave_uniq_id=${leave_uniq_id}&id_dec=${leaveRecord.auth2}`;
        const emailContent = `
        <p>Yeni bir izin talebi oluşturuldu:</p>
        <ul>
          <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
          <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
         <li>Başlangıç Tarihi: ${new Date(
           leaveRecord.leave_start_date
         ).toLocaleDateString("tr-TR", {
           weekday: "long",
           year: "numeric",
           month: "long",
           day: "numeric",
           hour: "2-digit",
           minute: "2-digit",
         })}</li>
        <li>Dönüş Tarihi: ${new Date(
          leaveRecord.leave_end_date
        ).toLocaleDateString("tr-TR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
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
        if (auth2Email) {
          await sendMail(
            auth2Email.e_mail,
            "Yeni İzin Talebi 2. Onay",
            emailContent
          );
        }
      }
    } else if (
      (leaveRecord.auth2 === id_dec || isIK) &&
      leaveRecord.leave_status === "2"
    ) {
      leaveRecord.leave_status = "3";
      leaveRecord.second_approver_approval_time = currentDateTimeOffset;

      const güvenlikEmailContent = `
      <p>Yeni bir izin talebi oluşturuldu:</p>
      <ul>
        <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
        <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
        <li>Başlangıç Tarihi: ${new Date(
          leaveRecord.leave_start_date
        ).toLocaleDateString("tr-TR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
        <li>Dönüş Tarihi: ${new Date(
          leaveRecord.leave_end_date
        ).toLocaleDateString("tr-TR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
        <li>İzin Sebebi: ${leaveRecord.leave_reason}</li>
        <li>Açıklama: ${leaveRecord.leave_description}</li>
      </ul>
    `;

      if (guvenlik_email) {
        await sendMail(
          guvenlik_email.e_mail,
          "Çikis Yapacak Personel (İZİN)",
          güvenlikEmailContent
        );
      }
    } else {
      console.error("Invalid approver or leave status");
      return { status: 400, message: "Invalid approver or leave status" };
    }

    await leaveRecord.save();
    return {
      status: 200,
      message: `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: green;">
          <p style='color:#ffffff; font-family: "Times New Roman", Times, serif; font-weight: bold; font-size: 50px; text-align: center;'>${leaveRecord.op_username} için izin talebi onaylandı</p>
        </div>
      `,
    };
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
      order: [["leave_creation_date", "DESC"]],
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
      order: [["leave_creation_date", "DESC"]],
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
        leave_status: {
          [Op.in]: [1, 2, 3, 4],
        },
      },
      order: [["leave_creation_date", "DESC"]],
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

/**
 * confirmSelections - Seçili izin taleplerini toplu olarak onaylayan bir fonksiyon.
 *
 * Bu servis, verilen seçim modeline göre izin taleplerini bulur ve onaylar.
 * İzin talepleri 1. onaylayıcı tarafından onaylanırsa 2. onaylayıcıya bir e-posta gönderir,
 * 2. onaylayıcı tarafından onaylanırsa güvenlik departmanına toplu bir e-posta gönderir.
 */
//! Toplu talep onaylayacak servis.
async function confirmSelections(selectionModel, id_dec) {
  try {
    // Seçili izin taleplerini veritabanından alır
    const leaveRecords = await LeaveRecords.findAll({
      where: {
        leave_uniq_id: selectionModel,
      },
    });

    // Güvenlik departmanının e-posta adresini alır
    const guvenlik_email = await User.findOne({
      where: {
        op_section: "Guvenlik",
      },
      attributes: ["e_mail"],
    });

    if (leaveRecords.length === 0) {
      console.log("Leave records not found");
      return { status: 404, message: "Leave records not found" };
    }

    const currentDateTimeOffset = new Date().toISOString();
    let emailContent = `<p>Yeni bir izin talebi oluşturuldu:</p>`;
    let guvenlikEmailContent = `<p>Yeni bir izin talebi oluşturuldu:</p>`;
    let who = 1; // Varsayılan olarak auth2'ye e-posta gönderilecek
    const approvalLink = `${
      process.env.NEXT_PUBLIC_API_BASE_URL
    }/api/leave/confirmSelections?leaveIds=${selectionModel.join(",")}&id_dec=${
      leaveRecords[0].auth2
    }`;
    const cancelLink = `${
      process.env.NEXT_PUBLIC_API_BASE_URL
    }/api/leave/cancelSelectionsLeave?leaveIds=${selectionModel.join(
      ","
    )}&id_dec=${leaveRecords[0].auth2}`;

    // Her bir izin kaydını dön
    for (const leaveRecord of leaveRecords) {
      if (leaveRecord.auth1 === id_dec && leaveRecord.leave_status === "1") {
        // 1. onaylayıcı tarafından onaylanmış izinler
        leaveRecord.leave_status = "2";
        leaveRecord.first_approver_approval_time = currentDateTimeOffset;
        emailContent += `
          <ul>
            <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
            <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
            <li>Başlangıç Tarihi: ${leaveRecord.leave_start_date}</li>
            <li>Dönüş Tarihi: ${leaveRecord.leave_end_date}</li>
            <li>İzin Sebebi: ${leaveRecord.leave_reason}</li>
            <li>Açıklama: ${leaveRecord.leave_description}</li>
          </ul>
        `;

        await leaveRecord.save();
      } else if (
        leaveRecord.auth2 === id_dec &&
        leaveRecord.leave_status === "2"
      ) {
        // 2. onaylayıcı tarafından onaylanmış izinler
        leaveRecord.leave_status = "3";
        leaveRecord.second_approver_approval_time = currentDateTimeOffset;
        who = 2; // Eğer 2. onaylayıcı tarafından onaylanmışsa, guvenlik'e e-posta gönderilecek

        guvenlikEmailContent += `
          <ul>
            <li>Kullanıcı ID: ${leaveRecord.id_dec}</li>
            <li>Kullanıcı Adı: ${leaveRecord.op_username}</li>
            <li>Başlangıç Tarihi: ${leaveRecord.leave_start_date}</li>
            <li>Dönüş Tarihi: ${leaveRecord.leave_end_date}</li>
            <li>İzin Sebebi: ${leaveRecord.leave_reason}</li>
            <li>Açıklama: ${leaveRecord.leave_description}</li>
          </ul>
        `;

        await leaveRecord.save(); // Değişiklikleri kaydet
      } else {
        console.error("Invalid approver or leave status");
        continue; // Geçerli olmayan onaylayıcı veya izin durumu, döngüye devam et
      }
    }

    // Eğer onaylar auth1 tarafından yapılmışsa, auth2'ye e-posta gönderir
    if (who === 1) {
      const auth2Email = await User.findOne({
        where: {
          id_dec: leaveRecords[0].auth2,
        },
        attributes: ["e_mail"],
      });

      if (!auth2Email) {
        console.error("Auth2 email not found");
        return { status: 404, message: "Auth2 email not found" };
      }

      emailContent += `
        <p>İzin talebini onaylamak için aşağıdaki butona tıklayın:</p>
        <div style="padding: 10px 20px; color: white; text-decoration: none; display:flex;">
          <a href="${approvalLink}" style="padding: 10px 20px; background-color: green; color: white; text-decoration: none;">Onayla</a>
          <a href="${cancelLink}" style="padding: 10px 20px; background-color: red; color: white; text-decoration: none;">İptal Et</a>
        </div>
      `;

      await sendMail(
        auth2Email.e_mail,
        "Yeni İzin Talebi 2. Onay",
        emailContent
      );
    } else if (who === 2) {
      // Eğer onaylar 2. onaylayıcı tarafından yapılmışsa, guvenlik'e e-posta gönderir
      await sendMail(
        guvenlik_email.e_mail,
        "Çikis Yapacak Personel (İZİN)",
        guvenlikEmailContent
      );
    }

    return { status: 200, message: "Seçili izin talepleri onaylandı." };
  } catch (error) {
    console.error("Error in confirmSelections function:", error);
    return { status: 500, message: "Internal Server Error" };
  }
}

//! Toplu izin iptal
async function cancelSelectionsLeave(selections, id_dec) {
  try {
    const currentDateTimeOffset = new Date().toISOString();
    const leaveRecords = await LeaveRecords.findAll({
      where: {
        leave_status: {
          [Op.in]: [1, 2],
        },
        leave_uniq_id: selections,
      },
    });

    if (leaveRecords.length === 0) {
      return { status: 404, message: "İzin talepleri bulunamadı." };
    }

    for (const leaveRecord of leaveRecords) {
      leaveRecord.leave_status = "4";
      leaveRecord.user_who_cancelled = id_dec;
      leaveRecord.leave_cancel_date = currentDateTimeOffset;
      await leaveRecord.save();
    }

    return { status: 200, message: "İzin talepleri başarıyla iptal edildi." };
  } catch (error) {
    console.error("Error in cancelSelectionsLeave function:", error);
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//! Revirin onayladığı izinleri çekecek servis...
async function leavesApprovedByTheInfirmary(id_dec, roleId) {
  try {
    let result = null;

    // Sadece roleId 7 olanlar için sorgu çalışacak
    if (roleId === "7") {
      result = await LeaveRecords.findAll({
        where: {
          auth1: id_dec,
          auth2: id_dec,
        },
        order: [["leave_creation_date", "DESC"]],
      });
    }

    // Eğer sonuç varsa 200, yoksa 404 döndür
    if (result && result.length > 0) {
      return { status: 200, message: result };
    } else {
      return { status: 404, message: "Onaylanan izin bulunamadı." };
    }
  } catch (err) {
    console.log(err); // Hata durumunu logla
    return { status: 500, message: "İç sunucu hatası." }; // 500 Internal Server Error döndür
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
  confirmSelections,
  cancelSelectionsLeave,
  createNewLeaveByIK,
  leavesApprovedByTheInfirmary,
};
