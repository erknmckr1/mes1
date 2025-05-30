const express = require("express");
const router = express.Router();
const {
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
  personelToBeChecked
} = require("../services/leaveServices");

//! İzin sebeplerini dönen endpoint
router.get("/getLeaveReasons", async (req, res) => {
  try {
    const result = await getLeaveReasons();
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Invalid req error." });
  }
});

//! Yeni izin oluşturma endpoint
router.post("/createNewLeave", async (req, res) => {
  const { formData, selectedReason, id_dec, op_username, auth1, auth2 } =
    req.body;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    if (!formData || !selectedReason || !id_dec || !op_username) {
      return res.status(400).json({ message: "Gerekli alanlar eksik." });
    }
    const result = await createNewLeave(
      formData,
      selectedReason,
      id_dec,
      op_username,
      currentDateTimeOffset,
      auth1,
      auth2
    );
    res.status(200).json({ message: "İzin talebi başarıyla oluşturuldu." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Invalid request error." });
  }
});

//! İK tarafından ızın olusturacak endpoint
router.post("/createNewLeaveByIK", async (req, res) => {
  const { formData, id_dec, op_username, auth1, auth2, userInfo } = req.body;
  const result = await createNewLeaveByIK(
    formData,
    id_dec,
    op_username,
    auth1,
    auth2,
    userInfo
  );
  res.status(result.status).json(result.message);
});

//! kullanıcının bekleyen izinlerini çekecek query
router.get("/getPendingLeaves", async (req, res) => {
  const { id_dec } = req.query;
  try {
    const result = await getPendingLeaves({ id_dec });
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No records found for the given ID." });
    }
  } catch (err) {
    console.error("Error fetching leave records:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

//! Aktif kullanıcının onaylanmıs ızınlerını çekecek endpoint...
router.get("/getApprovedLeaves", async (req, res) => {
  const { id_dec } = req.query;

  try {
    const result = await getApprovedLeaves({ id_dec });
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No records found for the given ID." });
    }
  } catch (err) {
    console.error("Error fetching leave records:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

//! Aktıf kullanıcının onaylanmıs ve ıptal edılmıs ızınlerını cekecek endpoint
router.get("/getPastLeaves", async (req, res) => {
  const { id_dec } = req.query;
  try {
    const result = await getPastLeaves({ id_dec });
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No records found for the given ID." });
    }
  } catch (err) {
    console.error("Error fetching leave records:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

//! Onay bekleyen izinleri alacak endpoint
router.get("/getPendingApprovalLeaves", async (req, res) => {
  const { id_dec } = req.query;
  try {
    const result = await getPendingApprovalLeaves({ id_dec });

    if (result && result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No pending approval leaves found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

//! ilgili talebi onayyacak endpointd...
router.get("/approveLeave", async (req, res) => {
  const currentDateTimeOffset = new Date().toISOString();
  const { id_dec, leave_uniq_id } = req.query;
  const result = await approveLeave(
    id_dec,
    leave_uniq_id,
    currentDateTimeOffset
  );
  res.status(result.status).send(result.message);
});

router.get("/getManagerApprovedLeaves", async (req, res) => {
  const { id_dec } = req.query;
  const result = await getManagerApprovedLeaves({ id_dec });
  res.status(result.status).json(result.message);
});

//! Kullanıcı bır ızın talebı olusturdu ve bu ızın talebınıni kendızı iptal etmek ıstıyorsa...
router.get("/cancelPendingApprovalLeave", async (req, res) => {
  const { id_dec, leave_uniq_id } = req.query;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const result = await cancelPendingApprovalLeave({
      id_dec,
      leave_uniq_id,
      currentDateTimeOffset,
    });
    if (result) {
      res.status(200).json({ message: "Talep iptal işlemi başarılı..." });
    } else {
      res.status(404).json({ message: "No records found for the given ID." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

router.get("/getDateRangeLeave", async (req, res) => {
  const { leave_start_date, leave_end_date } = req.query;
  const result = await getDateRangeLeave(leave_start_date, leave_end_date);
  res.status(result.status).json(result.message);
});

//! Bütün izinleri çekecek  route
router.get("/alltimeoff", async (req, res) => {
  const result = await getAllTimeOff();
  res.status(result.status).json(result.message);
});

//! Seçili izin taleplerini toplu onaylayacak query...
router.get("/confirmSelections", async (req, res) => {
  const { leaveIds, id_dec } = req.query;
  // Stringi diziye çeviriyoruz
  const selectionModel = leaveIds.split(",");

  const result = await confirmSelections(selectionModel, id_dec);
  res.status(result.status).json(result.message);
});

//! Toplu talep iptal route
router.get("/cancelSelectionsLeave", async (req, res) => {
  const { leaveIds, id_dec } = req.query;
  const selections = leaveIds.split(",");
  const result = await cancelSelectionsLeave(selections, id_dec);
  res.status(result.status).json(result.message);
});

//! Revir tarafından onaylanan izinleri çekecek route...
router.get("/leavesApprovedByTheInfirmary", async (req, res) => {
  const { id_dec, roleId } = req.query; // Query parametrelerini alıyoruz
  const result = await leavesApprovedByTheInfirmary(id_dec, roleId); // Servisi çağırıyoruz
  res.status(result.status).json(result.message); // Sonucu döndürüyoruz
});
//! Çıkış yapacak personeli dönen endpoint izinler onaylanmıs ve bana çıkıs yapmaya yaklasan personelleri döner
router.get("/personelToBeChecked",async(req,res)=>{
  const {status} = req.query;
  const result = await personelToBeChecked(status);
  res.status(result.status).json(result.message);
})

module.exports = router;
