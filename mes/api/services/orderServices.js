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
            ORDER_ID: order.ORDER_ID,
          },
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

    if (result.length === 0) {
      return { status: 404, message: "Grup bulunamadı" };
    }
    return { status: 200, message: result };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Grupları birleştirecek servis...
const mergeGroups = async (params) => {
  const { groupIds, operatorId, section, areaName } = params;

  try {
    // Gönderilen grup ID'lerini parse et (dizi olarak aldık)
    const parsedGroupIds = JSON.parse(groupIds);

    // Son kaydın grup_no sunu al
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    // Unıq bır grup ıd sı olustur..
    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    // Grup ID'lerine ait starting_order_numbers'u birleştir
    let allOrderIds = [];
    for (const groupId of parsedGroupIds) {
      const groupRecord = await GroupRecords.findOne({
        where: { group_no: groupId },
      });

      // Alınan sipariş numaraları, split(",") metodu ile diziye dönüştürülür
      // ve concat metodu kullanılarak allOrderIds dizisine eklenir.
      if (groupRecord) {
        const orderIds = groupRecord.starting_order_numbers.split(",");
        allOrderIds = allOrderIds.concat(orderIds);
      } else {
        throw new Error(`Grup bulunamadı: ${groupId}`);
      }
    }

    // Tüm sipariş numaralarını birleştir
    const combinedOrderIds = allOrderIds.join(",");

    // Yeni grup kaydını oluştur
    const newGroupRecord = await GroupRecords.create({
      group_record_id: newGroupNo,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_start_date: new Date().toISOString(),
      group_status: "1",
      starting_order_numbers: combinedOrderIds,
      section,
      area_name: areaName,
    });

    // WorkLog tablosundaki her siparişin group_no sütununu güncelle
    for (const orderId of allOrderIds) {
      await WorkLog.update(
        { group_no: newGroupNo },
        { where: { order_no: orderId } }
      );
    }

    // Eski grupları sil
    await GroupRecords.destroy({
      where: {
        group_no: parsedGroupIds,
      },
    });

    return { status: 200, message: "Gruplar başarıyla birleştirildi." };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Gruptan sipariş cıkaracak servis...
const removeOrdersFromGroup = async (params) => {
  const { orderIds } = params;
  try {
    const parsedOrderIds = JSON.parse(orderIds);
    let ordersToDelete = [];
    let groupsToUpdate = {};

    // 1. Order'ları bul ve silinmesi gerekenleri belirle
    for (const orderId of parsedOrderIds) {
      const order = await WorkLog.findOne({
        where: {
          order_no: orderId,
        },
      });

      if (order && order.work_status === "0") {
        ordersToDelete.push(orderId);

        // Grup numarasını ve order'ı ekle
        if (order.group_no) {
          if (!groupsToUpdate[order.group_no]) {
            groupsToUpdate[order.group_no] = [];
          }
          groupsToUpdate[order.group_no].push(orderId);
        }
      }
    }

    // 2. Order'ları sil
    if (ordersToDelete.length > 0) {
      await WorkLog.destroy({
        where: {
          order_no: ordersToDelete,
        },
      });
    }

    // 3. Grup kayıtlarını güncelle
    for (const [groupNo, orderIdsToRemove] of Object.entries(groupsToUpdate)) {
      const groupRecord = await GroupRecords.findOne({
        where: { group_no: groupNo },
      });

      if (groupRecord) {
        const startingOrderNumbers = groupRecord.starting_order_numbers.split(",");
        const updatedOrderNumbers = startingOrderNumbers.filter(
          (orderNo) => !orderIdsToRemove.includes(orderNo)
        ).join(","); // virgülle ayrılmıs strınge donustur.

        await GroupRecords.update(
          { starting_order_numbers: updatedOrderNumbers },
          { where: { group_no: groupNo } }
        );
      }
    }

    return { status: 200, message: "Orders removed from groups successfully" };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

module.exports = {
  getOrderById,
  createOrderGroup,
  getGroupList,
  mergeGroups,
  removeOrdersFromGroup,
};
