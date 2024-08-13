const OrderTable = require("../../models/OrderTable");
const WorkLog = require("../../models/WorkLog");
const StoppedWorksLogs = require("../../models/StoppedWorksLog");
const GroupRecords = require("../../models/GroupRecords");
const User = require("../../models/User");
const { Op, json } = require("sequelize");
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

//! Buzlama işlerini çekecek fonksiyon
const getWorksToBuzlama = async () => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: "buzlama",
      },
    });

    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: "Buzlama alanında iş bulunamadı.",
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Yenı grup olustacak fonksıyon...
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
    const user = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: operatorId }, { id_hex: operatorId }],
      },
    });

    if (!user) {
      return { status: 403, message: "Girilen kullanıcı id geçersiz." };
    }

    let orders = JSON.parse(orderList);

    // Her bir order_id için kontrol yapıyoruz
    for (const order of orders) {
      const existingOrder = await WorkLog.findOne({
        where: {
          order_no: order.ORDER_ID,
        },
      });

      if (existingOrder) {
        // Eğer herhangi bir order_id için WorkLog tablosunda kayıt varsa, direkt return yapıyoruz
        return {
          status: 400,
          message: `Sipariş ID ${order.ORDER_ID} için zaten mevcut bir kayıt var. Grup oluşturulmadı.`,
        };
      }
    }

    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    const orderIds = orders.map((order) => order.ORDER_ID).join(",");

    const newGroupRecord = await GroupRecords.create({
      group_record_id: newGroupNo,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_start_date: currentDateTimeOffset,
      group_status: "1",
      // starting_order_numbers: orderIds,
      process_name: selectedProcess,
      machine_name: selectedMachine,
      section,
      area_name: areaName,
    });

    if (newGroupRecord) {
      for (const order of orders) {
        const sorder = await OrderTable.findOne({
          where: {
            ORDER_ID: order.ORDER_ID,
          },
        });

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
          group_no: newGroupNo,
        };

        await createWork({ work_info, currentDateTimeOffset });
      }
    }

    return {
      status: 200,
      message: "Sipariş grubu başarıyla oluşturuldu.",
      createdGroupNo: newGroupNo,
    };
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
    console.log(parsedGroupIds)
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

    console.log(newGroupNo);
      // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
      let allOrderIds = [];
      for (const groupId of parsedGroupIds) {
        const orders = await WorkLog.findAll({
          where: { group_no: groupId },
        });
  
        // Eğer group_no'ya bağlı order'lar varsa, bunları allOrderIds dizisine ekle
        if (orders && orders.length > 0) {
          allOrderIds = allOrderIds.concat(orders.map(order => order.order_no));
        } else {
          throw new Error(`Grup bulunamadı veya içinde sipariş yok: ${groupId}`);
        }
      }

    // Yeni grup kaydını oluştur
    const newGroupRecord = await GroupRecords.create({
      group_record_id: newGroupNo,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_start_date: new Date().toISOString(),
      group_status: "1",
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

//! Gruptan sipariş çıkaracak servis...
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

      console.log({ order }); // order nesnesini kontrol edelim

      if (order && order.work_status === "0") {
        ordersToDelete.push(orderId);

        // Grup numarasını ve order'ı ekle
        if (order.group_no) {
          if (!groupsToUpdate[order.group_no]) {
            groupsToUpdate[order.group_no] = [];
          }
          groupsToUpdate[order.group_no].push(orderId);
        } else {
          console.log(`Order ${orderId} has no group_no`);
        }
      }
    }

    console.log({ groupsToUpdate: groupsToUpdate });

    // 2. Order'ları sil
    if (ordersToDelete.length > 0) {
      await WorkLog.destroy({
        where: {
          order_no: ordersToDelete,
        },
      });
    }

    // 3. Grup kayıtlarını güncelle (Optional)
    // Eğer gruptan çıkarılan siparişlerin `GroupRecords` üzerinde başka bir etkisi yoksa bu adımı tamamen atlayabiliriz.
    // Eğer grupların durumu güncellenmesi gerekiyorsa, burada yapılacak işlemleri belirleyebilirsiniz.
    // Örneğin, grup içindeki tüm siparişler kaldırıldıysa grubu da kaldırabilirsiniz.

    return { status: 200, message: "Orders removed from groups successfully" };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};


//!
const closeSelectedGroup = async (params) => {
  const { groupNos } = params;
  let parsedGroupNos = JSON.parse(groupNos);
  try {
    if (parsedGroupNos.length !== 1) {
      return {
        status: 402,
        message: "Birden fazla grubu kapatmaya çalışmayın.",
      };
    }

    // Grup numarasına ait tüm order'ları WorkLog tablosundan aldık
    const orders = await WorkLog.findAll({
      where: {
        group_no: parsedGroupNos[0], // Tek grup numarasına göre filtreleme
      },
    });

      // Tüm order'ların work_status ve area_name kontrolü
      const canCloseGroup = orders.every(
        (order) => order.work_status === "0" && order.area_name === "buzlama"
      );

      if (canCloseGroup) {
        // Tüm uygun order'ları sil
        await WorkLog.destroy({
          where: {
            group_no: parsedGroupNos[0],
            work_status: "0",
          },
        });

        // Grubu kapatma işlemi, örneğin group_status alanını güncelleyerek veya grubu silerek
        await GroupRecords.destroy({ where: { group_no: parsedGroupNos[0] } });

        return { status: 200, message: "Grup başarıyla kapatıldı." };
      } else {
        return {
          status: 400,
          message: "Grup içerisindeki işler başlatılmış veya yanlış alanda.",
        };
      }
    
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};


const addToGroup = async (params) => {
  const { group_no, selectedOrderId } = params;
  let parsedOrdersId = JSON.parse(selectedOrderId);

  try {
    const group = await GroupRecords.findOne({
      where: {
        group_no,
      },
    });

    if (!group) {
      return {
        status: 400,
        message: `Eklemeye calıstıgınız ${group_no} grup numarası bulunamadı...`,
      };
    } else {
      const orders = await WorkLog.findAll({
        where: {
          order_no: parsedOrdersId,
          area_name: "buzlama",
        },
      });
      console.log(orders);
      const allOrdersValid = orders.every(
        (order) => order.area_name === "buzlama" && order.work_status === "0"
      );

      if (allOrdersValid) {
        for (const order of orders) {
          await WorkLog.update(
            { group_no: group_no },
            { where: { order_no: order.order_no, area_name: "buzlama" } }
          );
        }

        return { status: 200, message: "Siparişler başarıyla gruba eklendi." };
      } else {
        return {
          status: 400,
          message: "Siparişler arasında uygun olmayanlar var.",
        };
      }
    }
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
  closeSelectedGroup,
  addToGroup,
  getWorksToBuzlama,
};
