  const LeaveReason = require("../../models/LeaveReasons");
  const LeaveRecords = require("../../models/LeaveRecords");
  const { Op } = require("sequelize");
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
          leave_status: "4",
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
    };
  };

  //! İlgili talepi onaylayacak servis...
  async function approveLeave(id_dec, leave_uniq_id,currentDateTimeOffset) {
    try {
      const leaveRecord = await LeaveRecords.findOne({
        where: {
          leave_uniq_id,
        },
      });

      if (!leaveRecord) {
        return { status: 404, message: "Leave record not found" };
      }

      if (leaveRecord.auth1 === id_dec && leaveRecord.leave_status === "1") {
        leaveRecord.leave_status = "2";
        leaveRecord.first_approver_approval_time=currentDateTimeOffset
      } else if (leaveRecord.auth2 === id_dec && leaveRecord.leave_status === "2") {
        leaveRecord.leave_status = "3";
        leaveRecord.second_approver_approval_time=currentDateTimeOffset
      } else {
        return { status: 400, message: "Invalid approver or leave status" };
      }

      await leaveRecord.save();
      return { status: 200, message: "Leave approved successfully" };
    } catch (error) {
      return { status: 500, message: "Internal Server Error" };
    }
  }

  //! Yöneticinin onayladıgı kayıtları cekecek query..
  async function getManagerApprovedLeaves({id_dec}){
    try {
      const approvedRecord = await LeaveRecords.findAll({
        where:{
          [Op.or]: [
            { auth1: id_dec, leave_status: "2" }, // auth1 onay bekleyen durum
            { auth2: id_dec, leave_status: "3" }, // auth2 onay bekleyen durum
          ],
        }
      })

      if(approvedRecord.length > 0) {
        return {status:200,message:approvedRecord}
      }else{
        return{status:404,message:"Leave approved not found"}
      }
    } catch (err) {
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
    getManagerApprovedLeaves
  };
