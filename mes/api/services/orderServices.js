const OrderTable = require("../../models/OrderTable");
const WorkLog = require("../../models/WorkLog");
const GroupRecords = require("../../models/GroupRecords");
const User = require("../../models/User");
const { Op, json } = require("sequelize");
const { createWork } = require("../orderOperations");
const MeasureData = require("../../models/MeasureData");
const ConditionalFinishReason = require("../../models/ConditionalFinishReasons");
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
        work_status: {
          [Op.in]: ["0", "1", "2"],
        },
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

//! Bölümdeki bitmiş yada iptal olan işleri çek...
const getFinishedOrders = async (area_name) => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name,
        work_status: {
          [Op.in]: ["3", "4", "5"],
        },
      },
    });

    if (result.length > 0) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: `${area_name} alanında iş bulunamadı.`,
      };
    }
  } catch (err) {
    console.log("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Yenı grup olustacak fonksıyon...
async function createOrderGroup(params) {
  console.log(params);
  if (!params || typeof params !== "object") {
    return { status: 400, message: "Invalid parameters." };
  }

  const {
    orderList,
    machine_name,
    process_id,
    process_name,
    operatorId,
    section,
    areaName,
  } = params;

  if (!orderList || !operatorId) {
    return { status: 400, message: "Missing required parameters." };
  }

  const currentDateTimeOffset = new Date().toISOString();

  try {
    // Giriş yapan kullanıcı olusturmayacaksa ekstra bır ıd alma popup ı yapacağız.
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

      if (
        existingOrder &&
        existingOrder.work_status !== "3" &&
        existingOrder.area_name === "buzlama" &&
        existingOrder.work_status !== "4"
      ) {
        // Eğer mevcut bir kayıt varsa ve work_status 3 değilse, direkt return yapıyoruz.
        return {
          status: 400,
          message: `Sipariş ID ${order.ORDER_ID} için zaten mevcut bir kayıt var. Grup oluşturulmadı.`,
        };
      }
    }

    // Benzersiz group_no oluşturma
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

    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    const orderIds = orders.map((order) => order.ORDER_ID).join(",");

    const newGroupRecord = await GroupRecords.create({
      group_record_id: newUniqId,
      group_no: newGroupNo,
      who_started_group: operatorId,
      group_creation_date: currentDateTimeOffset,
      group_status: "1",
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
          // process_name: process_name || "Default", // Eğer process_name boşsa, "Default Process Name" kullanılır
          // machine_name: machine_name || "Default", // Eğer machine_name boşsa, "Default Machine Name" kullanılır
          production_amount: sorder.PRODUCTION_AMOUNT,
          order_id: sorder.ORDER_ID,
          // process_id: process_id || "Default", // Eğer process_id boşsa, "Default Process ID" kullanılır
          user_id_dec: user.id_dec,
          op_username: user.op_username,
          group_no: newGroupNo,
          group_record_id: newUniqId,
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
    const result = await GroupRecords.findAll({
      where: {
        group_status: "1",
      },
    });

    if (result.length === 0) {
      return { status: 404, message: "Grup bulunamadı" };
    }
    return { status: 200, message: result };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Kapanmıs Grupları cekecek servis
//! Grupları çekecek servis...
const getClosedGroups = async () => {
  try {
    const result = await GroupRecords.findAll({
      where: {
        group_status: "2",
      },
    });

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
  const currentDateTimeOffset = new Date().toISOString();

  try {
    // Gönderilen grup ID'lerini parse et (dizi olarak aldık)
    const parsedGroupIds = JSON.parse(groupIds);
    console.log(parsedGroupIds);
    // Son kaydın grup_no sunu al
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    if (parsedGroupIds.length < 2) {
      return {
        status: 400,
        message: "Birleştirmek için birden fazla sipariş seçiniz.",
      };
    }

    // Unıq bır grup ıd sı olustur..
    let newGroupNo;
    if (latestGroupNo) {
      const latestId = parseInt(latestGroupNo.group_no, 10);
      newGroupNo = String(latestId + 1).padStart(5, "0");
    } else {
      newGroupNo = "00001";
    }

    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderIds = [];
    for (const groupId of parsedGroupIds) {
      const orders = await WorkLog.findAll({
        where: { group_no: groupId },
      });

      // Eğer group_no'ya bağlı order'lar varsa, bunları allOrderIds dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const ongoingOrder = orders.find((order) => order.work_status === "1");
        if (ongoingOrder) {
          return {
            status: 400,
            message: `Bu grupta devam eden yada bitmiş bir sipariş var: ${groupId}`,
          };
        }

        allOrderIds = allOrderIds.concat(orders.map((order) => order.uniq_id));
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupId}`,
        };
      }
    }

    if (allOrderIds.length > 0) {
      // Yeni grup kaydını oluştur
      const newGroupRecord = await GroupRecords.create({
        group_record_id: newGroupNo,
        group_no: newGroupNo,
        who_started_group: operatorId,
        group_creation_date: new Date().toISOString(),
        group_start_date: currentDateTimeOffset,
        group_status: "1",
        section,
        area_name: areaName,
      });

      console.log(allOrderIds);
      // WorkLog tablosundaki her siparişin group_no sütununu güncelle
      for (const orderId of allOrderIds) {
        await WorkLog.update(
          { group_no: newGroupNo },
          { where: { uniq_id: orderId } }
        );
      }

      // Eski grupları sil
      await GroupRecords.destroy({
        where: {
          group_no: parsedGroupIds,
        },
      });
      return { status: 200, message: "Gruplar başarıyla birleştirildi." };
    } else {
      return { status: 400, message: "Birleştirilecek grupları seçiniz." };
    }
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Gruptan sipariş çıkaracak servis...
const removeOrdersFromGroup = async (params) => {
  const { orderUniqIds, groupNo, operatorId } = params;
  try {
    const parsedOrderIds = JSON.parse(orderUniqIds);
    const parsedGroupNo = JSON.parse(groupNo);
    console.log(parsedOrderIds);

    let ordersToDelete = []; // Gruptan çıkarılacak siparişleri topladığımız dizi
    let invalidOrders = []; // Başlamış siparişleri topladığımız dizi

    // 1. Order'ları bul ve silinmesi gerekenleri belirle
    for (const orderData of parsedOrderIds) {
      const order = await WorkLog.findOne({
        where: {
          uniq_id: orderData.uniq_id,
          work_status: "0",
        },
      });

      if (!order) {
        // Eğer sipariş bulunamazsa veya başlamışsa, invalidOrders dizisine order_no'yu ekleyin
        const startedOrder = await WorkLog.findOne({
          where: {
            uniq_id: orderData.uniq_id,
          },
        });

        if (startedOrder) {
          invalidOrders.push(startedOrder.order_no); // order_no'yu ekliyoruz
        } else {
          invalidOrders.push(orderData.order_no); // Eğer order_no bulunamazsa, order_no'yu ekliyoruz
        }
      } else if (order.work_status === "0") {
        ordersToDelete.push(order.uniq_id);
      }
    }

    // Eğer hatalı siparişler varsa, bir uyarı mesajı döndür
    if (invalidOrders.length > 0) {
      return {
        status: 403,
        message: `${invalidOrders.join(
          ", "
        )} no lu sipariş(ler) başlamış. Gruptan çıkarmak istediğiniz siparişleri tekrardan seçip işlemi gerçekleştirin.`,
      };
    }

    console.log(ordersToDelete);

    // 2. Order'ları sil
    if (ordersToDelete.length > 0) {
      await WorkLog.destroy({
        where: {
          uniq_id: ordersToDelete,
        },
      });
    }

    // yollanan grup no da hiç sipariş yoksa 0 lar yukarıda silindi grubu sil...
    const orderByGroup = await WorkLog.findAll({
      where: {
        group_no: parsedGroupNo,
      },
    });

    if (orderByGroup.length === 0) {
      await GroupRecords.destroy({
        where: {
          group_no: parsedGroupNo,
        },
      });
      return {
        status: 200,
        message: "Grup kapatıldı ve tüm siparişler silindi",
      };
    } else {
      // grup içinde daha onceden iptal edilen ve bitmiş işler var ve devam eden bir iş yok ise grubu otomatik kapatmak ıcın arama yapıyoruz
      const isFinishedOrder = orderByGroup.some(
        (item) =>
          (item.work_status === "3" || item.work_status === "4") &&
          item.work_status !== "1"
      );

      if (isFinishedOrder) {
        await GroupRecords.update(
          {
            group_status: "2",
            group_end_date: new Date().toISOString(),
            who_ended_group: operatorId,
          },
          {
            where: {
              group_no: parsedGroupNo,
            },
          }
        );
        return {
          status: 200,
          message: "Grup kapatıldı ve siparişler güncellendi",
        };
      }
    }

    return {
      status: 200,
      message: "Siparişler gruptan başarıyla çıkarıldı, grup kapatılmadı",
    };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Grubu kapatacak servis...
const closeSelectedGroup = async (params) => {
  const currentDateTimeOffset = new Date().toISOString();
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

    // Eğer grup içerisinde bir sipariş yoksa grubu sil...
    if (orders.length < 0) {
      await GroupRecords.destroy({
        where: {
          group_no: parsedGroupNos[0],
        },
      });
    }

    // Eğer herhangi bir siparişin work_status'ü 1 veya 2 ise, grup kapatılamaz
    const hasActiveOrders = orders.some(
      (order) => order.work_status === "1" || order.work_status === "2"
    );

    if (hasActiveOrders) {
      return {
        status: 400,
        message: "Grup içerisindeki işler başlatılmış veya yanlış alanda.",
      };
    }

    // Eğer bütün siparişlerin work_status'ü 0 ise siparişler ve grup silinecek
    const allOrdersArePending = orders.every(
      (order) => order.work_status === "0"
    );

    if (allOrdersArePending) {
      await WorkLog.destroy({
        where: {
          group_no: parsedGroupNos[0],
          work_status: "0", // Sadece work_status "0" olan siparişleri sil
        },
      });

      await GroupRecords.destroy({ where: { group_no: parsedGroupNos[0] } });

      return { status: 200, message: "Grup ve siparişler başarıyla silindi." };
    }

    // Eğer bütün siparişlerin work_status'ü 3 (iptal) veya 4 (bitmiş) ise grup kapatılacak, ancak siparişler ve grup silinmeyecek
    const allOrdersCompletedOrCanceled = orders.every(
      (order) => order.work_status === "3" || order.work_status === "4"
    );

    if (allOrdersCompletedOrCanceled) {
      await GroupRecords.update(
        {
          group_status: 2, // Grup durumu kapatıldı olarak güncellenecek
          group_end_date: currentDateTimeOffset, // Grup bitiş tarihi güncellenecek
        },
        {
          where: { group_no: parsedGroupNos[0] },
        }
      );

      return { status: 200, message: "Grup başarıyla kapatıldı." };
    }

    return {
      status: 400,
      message: "Grup içerisindeki işler devam ediyor, grup kapatılamaz.",
    };
  } catch (err) {
    console.error("Internal server error", err);
    return { status: 500, message: "Internal server error" };
  }
};

//! Gruba sipariş ekleyecek servis
const addToGroup = async (params) => {
  const { group_no, selectedOrderId } = params;
  let parsedOrdersId = JSON.parse(selectedOrderId);
  console.log(parsedOrdersId);
  try {
    // yollayacagımız grubu bul...
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
      // yollanacak orderları al
      const orders = await WorkLog.findAll({
        where: {
          uniq_id: parsedOrdersId[0].uniq_id,
          area_name: "buzlama",
          work_status: "0",
        },
      });
      // Yollanacak orderların status u 0 mı ?
      const allOrdersValid = orders.every(
        (order) => order.area_name === "buzlama" && order.work_status === "0"
      );
      if (allOrdersValid) {
        for (const order of orders) {
          await WorkLog.update(
            { group_no: group_no },
            { where: { uniq_id: order.uniq_id, area_name: "buzlama" } }
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

//! Gönderilen grubu makineye yollayacak servis... work status 0'dan 1'e
const sendToMachine = async (params) => {
  const { id_dec, machine_name, process_name, process_id, group_no } = params;
  const currentDateTimeOffset = new Date().toISOString();

  try {
    const group = await GroupRecords.findOne({
      where: { group_no },
    });

    // grup no yoksa...
    if (!group) {
      return {
        status: 404,
        message: "Makineye gönderilecek grup numarası bulunamadı...",
      };
    }

    const orders = await WorkLog.findAll({
      where: { group_no, work_status: "0" },
    });

    // statusu 0 sipariş yoksa başlamıştır...
    if (orders.length === 0) {
      return {
        status: 404,
        message: "Grupta sipariş yok ya da bütün siparişler başlamış.",
      };
    }

    await GroupRecords.update(
      {
        group_start_date: currentDateTimeOffset,
      },
      {
        where: {
          group_no,
        },
      }
    );

    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "1",
          process_name,
          machine_name,
          process_id,
          work_start_date: currentDateTimeOffset,
          user_id_dec: id_dec,
        },
        {
          where: { order_no: order.order_no, work_status: "0" },
        }
      );
    }

    return { status: 200, message: "Grup başarıyla makineye gönderildi." };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası oluştu. Lütfen tekrar deneyiniz.",
    };
  }
};

//! Ölçüm veri girişi
async function createMeasurementData(measurementsInfo) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    // Yeni ölçüm verisini oluştur
    const newMeasurement = await MeasureData.create({
      order_no: measurementsInfo.order_no,
      material_no: measurementsInfo.material_no,
      operator: measurementsInfo.operator,
      area_name: measurementsInfo.area_name,
      entry_measurement: measurementsInfo.entry_measurement,
      exit_measurement: measurementsInfo.exit_measurement,
      entry_weight_50cm: measurementsInfo.entry_weight_50cm,
      exit_weight_50cm: measurementsInfo.exit_weight_50cm,
      data_entry_date: currentDateTimeOffset,
      description: measurementsInfo.description,
      measurement_package: measurementsInfo.measurement_package,
    });

    // Başarılı yanıt döndür
    return {
      status: 200,
      message: { success: true, message: newMeasurement },
    };
  } catch (err) {
    console.error("Error creating measurement data:", err);

    // Hata durumunda yanıt döndür
    return {
      status: 500,
      message: {
        success: false,
        error: "Ölçüm verisi kaydedilirken bir hata oluştu.",
      },
    };
  }
}

//! Ölçüm verilerini çekecek servis...
async function getAllMeasurements(areaName) {
  try {
    // Tüm ölçüm verilerini veritabanından çek
    const measurements = await MeasureData.findAll({
      where: {
        area_name: areaName,
      },
    });

    // Başarılı yanıt döndür
    return {
      status: 200,
      message: measurements,
    };
  } catch (error) {
    console.error("Error fetching measurements:", error);

    // Hata durumunda yanıt döndür
    return {
      status: 500,
      message: {
        success: false,
        message: "Ölçüm verileri çekilirken bir hata oluştu.",
      },
    };
  }
}

//! Seçili siparişi bitirecek servis...
async function deliverSelectedOrder(order, id_dec, op_username, group_no) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const selectedOrder = await WorkLog.findOne({
      where: {
        uniq_id: order.uniq_id,
      },
    });

    if (!selectedOrder) {
      return {
        status: 404,
        message: "Teslim etmeye çalıştığınız sipariş bulunamadı.",
      };
    }

    // Yollanan sipariş devam ediyorsa teslim edilebilir...
    if (selectedOrder.dataValues.work_status === "1") {
      await WorkLog.update(
        {
          work_end_date: currentDateTimeOffset,
          work_finished_op_dec: id_dec,
          work_status: "4",
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    } else if (selectedOrder.dataValues.work_status === "2") {
      return {
        status: 400,
        message:
          "Teslim etmeye çalıştığınız sipariş durdurulmuş. Öncelikle siparişi bitirin.",
      };
    } else if (selectedOrder.dataValues.work_status === "0") {
      return {
        status: 400,
        message:
          "Teslim etmeye çalıştığınız sipariş henüz başlamamış. Öncelikle siparişi bitirin.",
      };
    }

    // Yollanan gruptaki siparişleri al...
    const orders = await WorkLog.findAll({
      where: {
        group_no,
      },
    });

    // Gruptaki siparişlerin hepsi 4 ya da 3 mü?
    const allOrdersCompleted = orders.every(
      (order) => order.work_status === "3" || order.work_status === "4"
    );

    if (allOrdersCompleted) {
      await GroupRecords.update(
        {
          group_status: "2",
          group_end_date: currentDateTimeOffset,
          who_ended_group: id_dec,
        },
        {
          where: {
            group_no,
          },
        }
      );
    }

    return {
      status: 200,
      message: `${order.order_no}'lu sipariş başarıyla teslim edildi. `,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Sunucu hatası.",
    };
  }
}

//! Gruptaki işleri bitirip grubu guncelleyecek servis
async function finishTheGroup({ orders, groups, id_dec }) {
  const gruopsIds = JSON.parse(groups);
  try {
    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderUniqId = [];
    for (const groupId of gruopsIds) {
      const orders = await WorkLog.findAll({
        where: { group_no: groupId },
      });

      // Eğer group_no'ya bağlı order'lar varsa, bunları allOrderIds dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const stoppedOrder = orders.find((order) => order.work_status === "2");
        const emptyOrder = orders.find((order) => order.work_status === "0");
        const ongoingOrder = orders.find((order) => order.work_status === "1");

        if (stoppedOrder) {
          return {
            status: 400,
            message: `Bu grupta durdurulmus bir sipariş var. Öncelikle onu iptal edin yada işi bitirin: ${groupId}`,
          };
        } else if (emptyOrder) {
          return {
            status: 400,
            message: `Bu grupta başlamamış bir iş var grup teslim edilmedi. Yanlıs grupta işlem yapmıs olabilirsiniz.: ${groupId}`,
          };
        } else if (ongoingOrder) {
          allOrderUniqId = allOrderUniqId.concat(
            orders.map((order) => order.uniq_id)
          );
        }
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupId}`,
        };
      }
    }

    // Güncellemeyi yalnızca allOrderUniqId boş değilse yap
    if (allOrderUniqId.length > 0) {
      await WorkLog.update(
        {
          work_finished_op_dec: id_dec,
          work_end_date: new Date().toISOString(),
          work_status: "4",
        },
        {
          where: {
            uniq_id: allOrderUniqId,
          },
        }
      );
    }

    // Güncellemeden sonra grubu tekrar kontrol etmek için siparişleri yeniden topla
    let allGroupsCompleted = true;

    for (const groupId of gruopsIds) {
      const updatedOrders = await WorkLog.findAll({
        where: { group_no: groupId },
      });

      if (updatedOrders && updatedOrders.length > 0) {
        const incompleteOrder = updatedOrders.find(
          (order) => order.work_status !== "3" && order.work_status !== "4"
        );
        if (incompleteOrder) {
          allGroupsCompleted = false;
          break;
        }
      } else {
        return {
          status: 400,
          message: `Güncelleme sonrası grup bulunamadı veya içinde sipariş yok: ${groupId}`,
        };
      }
    }

    // Eğer tüm siparişler "3" veya "4" ise grubu güncelle

    if (allGroupsCompleted) {
      const [updatedRows] = await GroupRecords.update(
        {
          group_status: "2", // Grubun yeni durumu
          group_end_date: new Date().toISOString(),
        },
        {
          where: {
            group_no: gruopsIds,
          },
        }
      );

      console.log(`Güncellenen satır sayısı: ${updatedRows}`);
    }

    console.log(allGroupsCompleted, gruopsIds);

    return {
      status: 200,
      message: `Grup(lar) kapatıldı siparişler teslim edildi: ${gruopsIds}`,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Sunucu hatası.",
    };
  }
}

//! Seçili siparişleri bitirecek servis
async function finishSelectedOrders(params) {
  const { orders, id_dec } = params;

  try {
    // Bütün siparişler aynı grupta mı?
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const firstGroupNo = orders[0].group_no; // İlk order'ın grup numarasını alıyoruz
      return orders.every((order) => order.group_no === firstGroupNo);
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult !== true) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    // Aynı grupta olan siparişleri bitir
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "4",
          work_end_date: new Date().toISOString(),
          work_finished_op_dec: id_dec,
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    // Gruba ait tüm siparişleri kontrol et
    const groupOrder = await WorkLog.findAll({
      where: {
        group_no: orders[0].group_no,
      },
    });

    const allOrderOver = groupOrder.every(
      (item) =>
        item.work_status === "4" ||
        item.work_status === "3" ||
        item.work_status === "5"
    );

    if (allOrderOver) {
      await GroupRecords.update(
        {
          group_end_date: new Date().toISOString(),
          group_status: "2",
        },
        {
          where: {
            group_no: orders[0].group_no,
          },
        }
      );

      return {
        status: 200,
        message: "Gruptaki bütün siparişler bitirildi ve grup kapatıldı.",
      };
    }

    return { status: 200, message: "Siparişler başarıyla tamamlandı." };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! Şarrtlı bıtırme nedenlerını cekecek servis
async function getConditionalReason() {
  try {
    const result = await ConditionalFinishReason.findAll(); // Tüm nedenleri çek
    return { status: 200, message: result }; // Başarılı olduğunda 200 ve sonuçları dön
  } catch (err) {
    console.error("Error fetching conditional reasons:", err); // Hata logu
    return { status: 500, message: "Internal Server Error" }; // Hata durumunda 500 ve hata mesajı dön
  }
}

//! Gönderilen siparişleri şartlı bıtırecek popup...
async function conditionalFinish(orders, id_dec, conditional_finish, end_desc) {
  try {
    // Bütün siparişler aynı grupta mı?
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const firstGroupNo = orders[0].group_no; // İlk order'ın grup numarasını alıyoruz
      return orders.every((order) => order.group_no === firstGroupNo);
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult !== true) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    // Aynı grupta olan siparişleri bitir
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "5",
          work_end_date: new Date().toISOString(),
          work_finished_op_dec: id_dec,
          conditional_finish,
          end_desc,
        },
        {
          where: {
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    // Gruba ait tüm siparişleri kontrol et
    const groupOrder = await WorkLog.findAll({
      where: {
        group_no: orders[0].group_no,
      },
    });

    const allOrderOver = groupOrder.every(
      (item) =>
        item.work_status === "4" ||
        item.work_status === "3" ||
        item.work_status === "5"
    );

    if (allOrderOver) {
      await GroupRecords.update(
        {
          group_end_date: new Date().toISOString(),
          group_status: "2",
        },
        {
          where: {
            group_no: orders[0].group_no,
          },
        }
      );

      return {
        status: 200,
        message: "Gruptaki bütün siparişler bitirildi ve grup kapatıldı.",
      };
    }
    return { status: 200, message: "Siparişler başarıyla tamamlandı." };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! Kapatılan gruplar ve siparişleri ile aynı yada farklı proseslerde tekrardan iş baslatacak servis
async function restartGroupProcess(
  areaName,
  section,
  id_dec,
  machine_name,
  group_no,
  group_record_id,
  process_id,
  process_name
) {
  try {
    const orders = await WorkLog.findAll({
      where: {
        group_record_id,
      },
    });
    if (orders.length === 0) {
      return {
        status: 404,
        message: `${group_record_id} idsine ait geçmiş sipariş bulunamadı.`,
      };
    }

    console.log({orders:orders})
    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    const groupRecord = await GroupRecords.create({
      group_record_id: newUniqId,
      group_no: group_no,
      who_started_group: id_dec,
      group_creation_date: new Date().toISOString(),
      group_start_date:new Date().toISOString(),
      group_status: "1",
      section,
      area_name: areaName,
      process_name,
      machine_name,
    });

    const currentDateTimeOffset = new Date().toISOString();

    if (groupRecord) {
      for (const order of orders) {
        const sorder = await WorkLog.findOne({
          where: {
            order_no:order.order_no
          },
        });

        if (!sorder) {
          throw new Error(`Order not found for ORDER_ID: ${order.order_no}`);
        }

        const work_info = {
          section,
          area_name: areaName,
          work_status: "1",
          process_name,
          machine_name,
          production_amount: sorder.production_amount,
          order_id: sorder.order_no,
          process_id,
          user_id_dec: id_dec,
          group_record_id: newUniqId,
      group_no: group_no,
        };

        await createWork({ work_info, currentDateTimeOffset });
      };

      return {
        status: 200,
        message: "Grup ve siparişler başarıyla yeniden başlatıldı.",
      };
    }
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

module.exports = {
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
  restartGroupProcess
};
