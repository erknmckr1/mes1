const express = require("express");
const router = express.Router();
const {
  createShift,
  getShiftLogs,
  cancelShift,
  approveShift,
  addVehicleInfo,
  savedShiftIndex,
} = require("../services/shiftServices");

//! yenı mesaı olusturmak ıcın kullanılacak route...
router.post("/createShift", async (req, res) => {
  const {
    operator_id,
    created_by,
    start_date,
    end_date,
    start_time,
    end_time,
    route,
    address,
    stop_name,
  } = req.body;
  console.log(req.body);
  const result = await createShift(
    operator_id,
    created_by,
    start_date,
    end_date,
    start_time,
    end_time,
    route,
    address,
    stop_name
  );
  res.status(result.status).json(result.message);
});

//! mesai kaydını iptal edecek iptal edecek route
router.put("/cancelShift", async (req, res) => {
  const { shift_uniq_id, cancelled_by } = req.body;
  const result = await cancelShift(shift_uniq_id, cancelled_by);
  res.status(result.status).json(result.message);
});

//! tüm mesai verısını cekecek route...
router.get("/getShiftLogs", async (req, res) => {
  const result = await getShiftLogs();
  res.status(result.status).json(result.message);
});

//! mesai kaydını onaylayacak route...
router.put("/approveShift", async (req, res) => {
  const { shift_uniq_id, approved_by } = req.body;
  const result = await approveShift(shift_uniq_id, approved_by);
  res.status(result.status).json(result.message);
});
//! vasıta bılgılerını ekleyecek route
router.put("/addVehicleInfo", async (req, res) => {
  const { shiftUnıqIds, vasıtaForm } = req.body;
  const result = await addVehicleInfo(shiftUnıqIds, vasıtaForm);
  res.status(result.status).json(result.message);
  ("");
});
//! Servisteki kişilerin sırasını guncelleyecek route
router.put("/savedShiftIndex", async (req, res) => {
  const { selectedServiceIndex } = req.body;
  console.log({x:selectedServiceIndex})
  // Gelen verinin kontrolü
  if (
    !Array.isArray(selectedServiceIndex) ||
    selectedServiceIndex.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Geçerli bir sıralama verisi gönderilmedi." });
  }

  const result = await savedShiftIndex(selectedServiceIndex);
  res.status(result.status).json(result.message);
  ("");
});

module.exports = router;
