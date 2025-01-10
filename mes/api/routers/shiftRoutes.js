const express = require("express");
const router = express.Router();
const {
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
  updateShiftCell
} = require("../services/shiftServices");

//! yenı mesaı olusturmak ıcın kullanılacak route...
router.post("/createShift", async (req, res) => {
  const {
    created_by,
    start_date,
    end_date,
    start_time,
    end_time,
    route,
    address,
    stop_name,
    selectedShiftUser,
  } = req.body;

  if (!Array.isArray(selectedShiftUser)) {
    return res.status(400).json({
      message: "selectedShiftUser bir dizi olmalıdır.",
    });
  }

  const result = await createShift(
    {created_by,
    start_date,
    end_date,
    start_time,
    end_time,
    route,
    address,
    stop_name,
    selectedShiftUser}
  );

  res.status(result.status).json({ message: result.message });
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
//! servıs bılgılerını guncelleyecek route...
router.put("/updatedVehicleInfo", async (req, res) => {
  try {
    const { vasıtaForm, service_key } = req.body;

    if (!service_key) {
      return res.status(400).json({ message: "Servis anahtarı eksik." });
    }

    const result = await updatedVehicleInfo(vasıtaForm, service_key);

    res.status(result.status).json(result.message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası. Lütfen tekrar deneyin." });
  }
});
//! servise personel taşıma işlemini gerçekleştirecek route...
router.put("/moveToDiffService", async (req, res) => {
  const { draggedShiftItem, item } = req.body;
  const result = await moveToDiffService(draggedShiftItem, item);
  res.status(result.status).json(result.message);
});

//! servisten personel cıkaracak route...
router.put("/userOutOfService", async (req, res) => {
  const { selectedShift } = req.body;
  const result = await userOutOfService(selectedShift);
  res.status(result.status).json(result.message);
});
//! kullanıcıları bır servıse tasıyacak 
router.put("/addUserToService",async(req,res)=>{
  const{selection_shift,selectedShiftReport,vasıtaForm} = req.body;
  const result = await addUserToService(selection_shift,selectedShiftReport,vasıtaForm);
  res.status(result.status).json(result.message);
});
//! Degıstırılen hucreyı guncelleyecek fonksıyon... 
router.put("/updateShiftCell",async(req,res)=>{
  const { shift_uniq_id, columnKey, value } = req.body;
  console.log(req.body)
  const result = await updateShiftCell(shift_uniq_id, columnKey, value );
  res.status(result.status).json(result.message);
})
module.exports = router;
