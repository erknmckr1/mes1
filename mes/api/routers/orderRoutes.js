const express = require("express");
const router = express.Router();
const {
  getOrderById,
  createOrderGroup,
  getGroupList,
  mergeGroups,
  removeOrdersFromGroup,
  closeSelectedGroup,
  addToGroup,
  getWorksToBuzlama,
  sendToMachine,
  createMeasurementData,
  getAllMeasurements
} = require("../services/orderServices");

//!

//! İd ile sipariş cekecek route...
router.get("/getOrderById", async (req, res) => {
  const { orderId } = req.query;
  const result = await getOrderById(orderId);
  return res.status(result.status).json(result.message);
});

//! Ilgılı order id ler ile group olusturacak route...
router.post("/createOrderGroup", async (req, res) => {
  const {
    orderList,
    machine_name,
    process_name,
    process_id,
    operatorId,
    section,
    areaName,
  } = req.body;

  try {
    const result = await createOrderGroup({
      orderList,
      machine_name,
      process_name,
      process_id,
      operatorId,
      section,
      areaName,
    });

    return res.status(result.status).json(result.message);
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal Server Error");
  }
});

//! Grup listesini çekecek route...
router.get("/getGroupList", async (req, res) => {
  const result = await getGroupList();
  return res.status(result.status).json(result.message);
});

//! Grup birlestirmek için istek atılacak route
router.post("/mergeGroups", async (req, res) => {
  const { groupIds, operatorId, section, areaName } = req.body;
  const result = await mergeGroups({ groupIds, operatorId, section, areaName });
  return res.status(result.status).json(result.message);
});

//! Gruptan order cıkarak route...
router.post("/removeOrdersFromGroup",async(req,res)=>{
  const {orderIds} = req.body;
  const result = await removeOrdersFromGroup({orderIds});
  return res.status(result.status).json(result.message);
});

//! Grubu kapatacak route
router.post("/closeSelectedGroup",async(req,res)=>{
  const {groupNos} = req.body;
  const result = await closeSelectedGroup({groupNos});
  return res.status(result.status).json(result.message);
});

//! Bir siparişi farklı bır gruba ekleyecek route... 
router.post("/addToGroup",async(req,res)=>{
  const {group_no,selectedOrderId} = req.body;
  const result = await addToGroup({group_no,selectedOrderId});
  return res.status(result.status).json(result.message);
})

router.get("/getWorkToBuzlama", async (req, res) => {
  const { areaName } = req.query;
  const result = await getWorksToBuzlama(areaName);
  return res.status(result.status).json(result.message);
});


//! Grubu makineye yollayacak route
router.post("/sendToMachine", async (req, res) => {
  const { id_dec, machine_name, process_name,process_id, group_no } = req.body;
  const result = await sendToMachine({ id_dec,  machine_name, process_name,process_id, group_no });
  return res.status(result.status).json(result.message);
});

//! Ölçüm verilerini yollayacagımız route
router.post("/measurements",async(req,res)=>{
  const measurementsInfo = req.body;
  console.log("x")
  const result = await createMeasurementData(measurementsInfo);
  return res.status(result.status).json(result.message);
})

//! Ölçüm verilerini cekecek route
router.get("/getMeasurements", async (req, res) => {
    const {areaName} = req.query
    const result = await getAllMeasurements(areaName);
    return res.status(result.status).json(result.message);
});

module.exports = router;
