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
  getAllMeasurements,
  deliverSelectedOrder,
  finishTheGroup,
  finishSelectedOrders,
  getConditionalReason,
  conditionalFinish,
  getClosedGroups,
  getFinishedOrders,
  restartGroupProcess,
  startToProcess,
  stopToSelectedMachine,
  restartToMachine,
  cancelOrderInGroup,
  deliverTheGroup,
  addReadOrderToGroup,
  getWorksWithoutId,
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

//! Grup listesini çekecek route...
router.get("/getClosedGroups", async (req, res) => {
  const result = await getClosedGroups();
  return res.status(result.status).json(result.message);
});

//! Grup birlestirmek için istek atılacak route
router.post("/mergeGroups", async (req, res) => {
  const { groupIds, operatorId, section, areaName } = req.body;
  const result = await mergeGroups({ groupIds, operatorId, section, areaName });
  return res.status(result.status).json(result.message);
});

//! Gruptan order cıkarak route...
router.post("/removeOrdersFromGroup", async (req, res) => {
  const { orderUniqIds, groupNo, operatorId } = req.body;
  const result = await removeOrdersFromGroup({
    orderUniqIds,
    groupNo,
    operatorId,
  });
  return res.status(result.status).json(result.message);
});

//! Grubu kapatacak route
router.post("/closeSelectedGroup", async (req, res) => {
  const { groupNos } = req.body;
  const result = await closeSelectedGroup({ groupNos });
  return res.status(result.status).json(result.message);
});

//! Bir siparişi farklı bır gruba ekleyecek route...
router.post("/addToGroup", async (req, res) => {
  const { group_record_id, selectedOrderId } = req.body;
  const result = await addToGroup({ group_record_id, selectedOrderId });
  return res.status(result.status).json(result.message);
});

router.get("/getWorkToBuzlama", async (req, res) => {
  const { areaName } = req.query;
  const result = await getWorksToBuzlama(areaName);
  return res.status(result.status).json(result.message);
});

//! Grubu makineye yollayacak route
router.post("/sendToMachine", async (req, res) => {
  const { id_dec, machine_name, process_name, process_id, group_record_id } =
    req.body;
  const result = await sendToMachine({
    id_dec,
    machine_name,
    process_name,
    process_id,
    group_record_id,
  });
  return res.status(result.status).json(result.message);
});

//! Makineye gönderilen prosesi baslatacak route
router.put("/startToProcess", async (req, res) => {
  const { id_dec, group_record_id } = req.body;
  const result = await startToProcess({
    id_dec,
    group_record_id,
  });
  return res.status(result.status).json(result.message);
});

//! Ölçüm verilerini yollayacagımız route
router.post("/measurements", async (req, res) => {
  const measurementsInfo = req.body;
  console.log("x");
  const result = await createMeasurementData(measurementsInfo);
  return res.status(result.status).json(result.message);
});

//! Ölçüm verilerini cekecek route
router.get("/getMeasurements", async (req, res) => {
  const { areaName } = req.query;
  const result = await getAllMeasurements(areaName);
  return res.status(result.status).json(result.message);
});

//! Grup yonetımınde seçili siparişi bitirecek route...
router.put("/deliverSelectedOrder", async (req, res) => {
  const { order, id_dec, op_username, group_no } = req.body;
  const result = await deliverSelectedOrder(
    order,
    id_dec,
    op_username,
    group_no
  );
  return res.status(result.status).json(result.message);
});

//! Gruptaki siparişleri bitirecek route
router.put("/finishTheGroup", async (req, res) => {
  const { orders, groups, id_dec } = req.body;
  console.log(groups);
  const result = await finishTheGroup({ groups, id_dec });
  return res.status(result.status).json(result.message);
});

//! Seçili siparişleri bitirecek rota
router.put("/finishSelectedOrders", async (req, res) => {
  const { orders, id_dec } = req.body;
  const result = await finishSelectedOrders({ orders, id_dec });
  return res.status(result.status).json(result.message);
});

//! Şartlı bitirme nedenlerini çekecek rota
router.get("/getConditionalReason", async (req, res) => {
  const result = await getConditionalReason();
  return res.status(result.status).json(result.message);
});

//! Siparişleri şartlı bıtırecek rota
router.put("/conditionalFinish", async (req, res) => {
  const { orders, id_dec, conditional_finish, end_desc } = req.body;
  const result = await conditionalFinish(
    orders,
    id_dec,
    conditional_finish,
    end_desc
  );
  return res.status(result.status).json(result.message);
});

//! Siparişleri şartlı bıtırecek rota
router.get("/getFinishedOrders", async (req, res) => {
  const { area_name } = req.query;
  const result = await getFinishedOrders(area_name);
  return res.status(result.status).json(result.message);
});

//! kapanmıs bır grubu ve siparişlerini tekrardan aynı yada baska bir proseste baslatacak route..
router.post("/restartGroupProcess", async (req, res) => {
  const {
    areaName,
    section,
    id_dec,
    machine_name,
    group_no,
    group_record_id,
    process_id,
    process_name,
  } = req.body;
  console.log(req.body);
  const result = await restartGroupProcess(
    areaName,
    section,
    id_dec,
    machine_name,
    group_no,
    group_record_id,
    process_id,
    process_name
  );
  return res.status(result.status).json(result.message);
});

//! Makineyi durduracak route...
router.put("/stopToSelectedMachine", async (req, res) => {
  const { selectedGroup, id_dec, stop_reason_id, area_name } = req.body;
  const result = await stopToSelectedMachine(
    selectedGroup,
    id_dec,
    stop_reason_id,
    area_name
  );
  return res.status(result.status).json(result.message);
});

//! Makineyi tekrardan baslataca router...
router.put("/restartToMachine", async (req, res) => {
  const { selectedGroup, id_dec, area_name } = req.body;
  const result = await restartToMachine(selectedGroup, id_dec, area_name);
  return res.status(result.status).json(result.message);
});

//! GRUPLU EKRANLARDA siparişi iptal edecek route...
router.put("/cancelOrderInGroup", async (req, res) => {
  const { orders, id_dec } = req.body;
  const result = await cancelOrderInGroup(orders, id_dec);
  return res.status(result.status).json(result.message);
});

//! GRUPLU EKRANLARDA grubu teslim edece route... gs
router.put("/deliverTheGroup", async (req, res) => {
  const { group, id_dec } = req.body;
  const result = await deliverTheGroup(group, id_dec);
  return res.status(result.status).json(result.message);
});

//! Okutulan siparişleri bir gruba ekleyecek route...
router.put("/addReadOrderToGroup", async (req, res) => {
  const { group, orderList, user, areaName, section } = req.body;
  const result = await addReadOrderToGroup(
    group,
    orderList,
    user,
    areaName,
    section
  );
  return res.status(result.status).json(result.message);
});

router.get("/getWorksWithoutId", async (req, res) => {
  const { areaName } = req.query;
  try {
    const result = await getWorksWithoutId(areaName);
    return res.status(result.status).json(result.message);
  } catch (error) {
    console.error("Error fetching works without ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
