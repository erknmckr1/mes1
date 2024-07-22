const express = require("express");
const router = express.Router();
const {
  getLeaveReasons,
  createNewLeave,
  getPendingLeaves,
  getPendingApprovalLeaves,
  getApprovedLeaves,
  getPastLeaves,
  cancelPendingApprovalLeave
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

//! Onaycının görmesi gereken izinleri çekecek endpoint...
router.get("/getPendingApprovalLeaves", async (req, res) => {
  const { id_dec } = req.query;
  try {
    const result = await getPendingApprovalLeaves({ id_dec });
    if (result !== false) {
      res.status(200).json(result);
    } else if (result === false) {
      res.status(404).json({ message: "" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

//! Kullanıcı bır ızın talebı olusturdu ve bu ızın talebınıni kendızı iptal etmek ıstıyorsa...
router.put("/cancelPendingApprovalLeave", async (req, res) => {
  const { id_dec, leave_uniq_id } = req.body;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const result = await cancelPendingApprovalLeave({ id_dec, leave_uniq_id, currentDateTimeOffset });
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

module.exports = router;
