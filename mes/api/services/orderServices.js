const OrderTable = require("../../models/OrderTable");
const WorkLog = require("../../models/WorkLog");
const StoppedWorksLogs = require("../../models/StoppedWorksLog");
const GroupRecords = require("../../models/GroupRecords");
const User = require("../../models/User");
const { Op } = require("sequelize");
const { createWork } = require("../orderOperations");

//! id ye gore sıparısı getırecek servis...
async function getOrderById(orderId) {
  try {
    const result = await OrderTable.findOne({
      where: {
        ORDER_ID: orderId,
      },
    });

    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: "Girilen id ile ilgili bir sipariş bulunamadı",
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
}

//! Grup olusturacak servis...
async function createOrderGroup(params) {
  if (!params || typeof params !== "object") {
    return { status: 400, message: "Invalid parameters." };
  }

  const {
    orderList,
    selectedMachine,
    selectedProcess,
    operatorId,
    section,
    areaName,
  } = params;

  console.log(params)

  if (!orderList || !selectedMachine || !selectedProcess || !operatorId) {
    return { status: 400, message: "Missing required parameters." };
  }

  const currentDateTimeOffset = new Date().toISOString();

  try {
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    const user = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: operatorId }, { id_hex: operatorId }],
      },
    });

    if (!user) {
      return { status: 403, message: "Girilen kullanıcı id geçersiz." };
    }

    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    let orderNumbers;
    try {
      orderNumbers = JSON.parse(orderList);
    } catch (error) {
      return { status: 400, message: "orderList is not a valid JSON string." };
    }
    // Client tarafından gelen dızideki order id leri string olarak aldık db ye gonderebılmek ıcın.
    const orderIds = orderNumbers.map((order) => order.ORDER_ID).join(",");

    const newGroupRecord = await GroupRecords.create({
      group_record_id: newGroupNo,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_start_date: currentDateTimeOffset,
      group_status: "1",
      starting_order_numbers: orderIds,
      process_name: selectedProcess,
      machine_name: selectedMachine,
      section,
      area_name: areaName,
    });

    if (newGroupRecord) {
      const orders = JSON.parse(orderList);
      for (const order of orders) {
        const sorder = await OrderTable.findOne({
          where: {
            ORDER_ID: order.ORDER_ID
          }
        });

        console.log(sorder);
        if (!sorder) {
          throw new Error(`Order not found for ORDER_ID: ${order.ORDER_ID}`);
        }
        const work_info = {
          section,
          area_name: areaName,
          work_status: "0",
          process_name: selectedProcess,
          machine_name: selectedMachine,
          production_amount: sorder.PRODUCTION_AMOUNT,
          order_id: sorder.ORDER_ID,
          process_id: "0",
          user_id_dec: user.id_dec,
          op_username: user.op_username,
        };
        await createWork({ work_info, currentDateTimeOffset });
      }
    }

    return { status: 200, message: "Sipariş grubu başarıyla oluşturuldu." };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Sipariş grubu oluşturulamadı." };
  }
}

//! Grupları çekecek servis...

const getGroupList = async () => {
  try {
    const result = await GroupRecords.findAll();
    console.log(result)
    if (result.length === 0) {
      return { status: 404, message: "Grup bulunamadı" };
    }
    return { status: 200, message: result };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};



module.exports = { getOrderById, createOrderGroup,getGroupList };
