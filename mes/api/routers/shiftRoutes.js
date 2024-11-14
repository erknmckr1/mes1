const express = require("express");
const router = express.Router();
const { createShift, getShiftLogs } = require("../services/shiftServices");

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

//! tüm mesai verısını cekecek route...
router.get("/getShiftLogs", async (req, res) => {
  const result = await getShiftLogs();
  res.status(result.status).json(result.message);
});

module.exports = router;
