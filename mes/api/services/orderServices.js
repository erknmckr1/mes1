const OrderTable = require("../../models/OrderTable");
const WorkLog = require("../../models/WorkLog");
const GroupRecords = require("../../models/GroupRecords");
const User = require("../../models/User");
const StoppedWorksLogs = require("../../models/StoppedWorksLog");
const { Op, json } = require("sequelize");
const { createWork, stopWork, rWork } = require("../orderOperations");
const MeasureData = require("../../models/MeasureData");
const ConditionalFinishReason = require("../../models/ConditionalFinishReasons");
const Zincir50CMGR = require("../../models/Zincir50CMGR");
const sequelize = require("../../lib/dbConnect");

//! Bölümdeki tüm durmuş ve aktif işleri çekecek query...
async function getWorksWithoutId(areaName) {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: areaName,
        work_status: {
          [Op.in]: ["1", "2"], // '1' veya '2' durumundaki işleri getir
        },
      },
    });

    // Eğer sonuç varsa 200 status ve sonuçları dön
    if (result.length > 0) {
      return {
        status: 200,
        message: result,
      };
    }
    // Eğer sonuç yoksa 404 status ve mesaj dön
    else {
      return {
        status: 404,
        message: "No works found",
      };
    }
  } catch (err) {
    console.error("Database error:", err);
    // Hata oluşursa 500 status ve hata mesajı döndür
    return {
      status: 500,
      message: "Database query failed",
    };
  }
}

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

//! Buzlama işlerini çekecek fonksiyon 6 ve 7 harıc  tum statu dekı ıslerı cekecek servis
const getWorksToBuzlama = async () => {
  try {
    const result = await WorkLog.findAll({
      where: {
        area_name: "buzlama",
        work_status: {
          [Op.in]: ["0", "1", "2", "4", "5"],
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
    // for (const order of orders) {
    //   const existingOrder = await WorkLog.findOne({
    //     where: {
    //       order_no: order.ORDER_ID,
    //     },
    //   });

    //   if (
    //     existingOrder &&
    //     existingOrder.work_status !== "3" &&
    //     existingOrder.area_name === "buzlama" &&
    //     existingOrder.work_status !== "4"
    //   ) {
    //     // Eğer mevcut bir kayıt varsa ve work_status 3 değilse, direkt return yapıyoruz.
    //     return {
    //       status: 400,
    //       message: `Sipariş ID ${order.ORDER_ID} için zaten mevcut bir kayıt var. Grup oluşturulmadı.`,
    //     };
    //   }
    // }

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
          production_amount: sorder.PRODUCTION_AMOUNT,
          order_id: sorder.ORDER_ID,
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
        group_status: {
          [Op.in]: ["1", "2", "3", "4", "5"], // Hem "1" hem de "2" olan grupları getirir
        },
      },
      order: [["group_creation_date", "DESC"]], // En yeni tarih en başta olacak şekilde sıralar
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

    if (parsedGroupIds.length < 2) {
      return {
        status: 400,
        message: "Birleştirmek için birden fazla grup seçiniz.",
      };
    }

    // Her bir grup için `group_status` kontrolü yap
    for (const groupUniqId of parsedGroupIds) {
      const group = await GroupRecords.findOne({
        where: { group_record_id: groupUniqId.group_record_id },
      });

      if (!group) {
        return {
          status: 404,
          message: `Grup bulunamadı: ${groupUniqId.group_record_id}`,
        };
      }

      // Eğer `group_status` 1 veya 2 değilse, işlemi durdur ve hata mesajı döndür
      if (group.group_status !== "1" && group.group_status !== "2") {
        return {
          status: 400,
          message: `Grup ${group.group_record_id} birleştirilemez çünkü işlem devam ediyor veya tamamlanmış: group_status = ${group.group_status}`,
        };
      }
    }

    // Son kaydın grup_no sunu al
    const latestGroupNo = await GroupRecords.findOne({
      order: [["group_no", "DESC"]],
    });

    // Uniq bir grup numarası oluştur
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

    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderIds = [];
    for (const groupUniqId of parsedGroupIds) {
      const orders = await WorkLog.findAll({
        where: { group_record_id: groupUniqId.group_record_id },
      });

      // Eğer group_record_id'ye bağlı order'lar varsa, bunları allOrderIds dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const ongoingOrder = orders.find((order) => order.work_status === "1");
        if (ongoingOrder) {
          return {
            status: 400,
            message: `Bu grupta devam eden ya da bitmiş bir sipariş var: ${groupUniqId.group_record_id}`,
          };
        }

        allOrderIds = allOrderIds.concat(orders.map((order) => order.uniq_id));
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupUniqId.group_record_id}`,
        };
      }
    }

    if (allOrderIds.length > 0) {
      // Yeni grup kaydını oluştur
      const newGroupRecord = await GroupRecords.create({
        group_no: newGroupNo,
        who_started_group: operatorId,
        group_creation_date: new Date().toISOString(),
        group_start_date: currentDateTimeOffset,
        group_status: "1",
        section,
        area_name: areaName,
        group_record_id: newUniqId,
      });

      console.log(allOrderIds);

      // WorkLog tablosundaki her siparişin group_no ve group_record_id sütununu güncelle
      for (const orderId of allOrderIds) {
        await WorkLog.update(
          { group_no: newGroupNo, group_record_id: newUniqId },
          { where: { uniq_id: orderId } }
        );
      }

      // Eski grupları sil
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupIds.map((item) => item.group_record_id),
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
        )} no lu sipariş(ler) işleme alınmış yada bitirilmiş. Gruptan çıkarmak istediğiniz siparişleri tekrardan seçip işlemi gerçekleştirin.`,
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
        group_record_id: parsedGroupNo[0].group_record_id,
      },
    });

    if (orderByGroup.length === 0) {
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupNo[0].group_record_id,
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
            group_status: "5",
            group_end_date: new Date().toISOString(),
            who_ended_group: operatorId,
          },
          {
            where: {
              group_record_id: parsedGroupNo[0].group_record_id,
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
        group_record_id: parsedGroupNos[0].group_record_id, // Tek grup numarasına göre filtreleme
      },
    });

    // Eğer grup içerisinde bir sipariş yoksa grubu sil...
    if (orders.length < 0) {
      await GroupRecords.destroy({
        where: {
          group_record_id: parsedGroupNos[0].group_record_id,
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
          group_record_id: parsedGroupNos[0].group_record_id,
          work_status: "0", // Sadece work_status "0" olan siparişleri sil
        },
      });

      await GroupRecords.destroy({
        where: { group_record_id: parsedGroupNos[0].group_record_id },
      });

      return { status: 200, message: "Grup ve siparişler başarıyla silindi." };
    }

    // Eğer bütün siparişlerin work_status'ü 3 (iptal) veya 4 (bitmiş) ise grup kapatılacak, ancak siparişler ve grup silinmeyecek
    const allOrdersCompletedOrCanceled = orders.every(
      (order) => order.work_status === "3" || order.work_status === "4"
    );

    if (allOrdersCompletedOrCanceled) {
      await GroupRecords.update(
        {
          group_status: 5, // Grup durumu kapatıldı olarak güncellenecek
          group_end_date: currentDateTimeOffset, // Grup bitiş tarihi güncellenecek
        },
        {
          where: { group_record_id: parsedGroupNos[0].group_record_id },
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
  const { group_record_id, selectedOrderId } = params;
  let parsedOrdersId = JSON.parse(selectedOrderId);

  try {
    // Eklemeye çalıştığınız grubu bulun
    const group = await GroupRecords.findOne({
      where: {
        group_record_id,
      },
    });

    if (!group) {
      return {
        status: 400,
        message: `Eklemeye çalıştığınız ${group_record_id} grup numarası bulunamadı...`,
      };
    } else {
      // Eklenmesi gereken siparişleri alın
      const orders = await WorkLog.findAll({
        where: {
          uniq_id: parsedOrdersId.map((order) => order.uniq_id), // Tüm uniq_id değerlerini kontrol eder
          area_name: "buzlama",
          work_status: "0",
        },
      });

      // Siparişlerin tümü uygun mu? (area_name: "buzlama" ve work_status: "0")
      const allOrdersValid = orders.every(
        (order) => order.area_name === "buzlama" && order.work_status === "0"
      );

      if (allOrdersValid) {
        for (const order of orders) {
          await WorkLog.update(
            { group_record_id: group_record_id, group_no: group.group_no },
            { where: { uniq_id: order.uniq_id, area_name: "buzlama" } }
          );
        }
      } else {
        return {
          status: 400,
          message: "Siparişler arasında uygun olmayanlar var.",
        };
      }

      const oldOrderGroupId = orders[0].group_record_id;
      console.log({ order: oldOrderGroupId, group_record_id });
      // Gruba ait kalan siparişleri kontrol et
      const remainingOrdersInGroup = await WorkLog.findAll({
        where: { group_record_id: oldOrderGroupId, area_name: "buzlama" },
      });

      // Eğer grupta kalan sipariş yoksa, grubu sil
      if (remainingOrdersInGroup.length === 0) {
        await GroupRecords.destroy({
          where: { group_record_id: oldOrderGroupId },
        });
        return {
          status: 200,
          message:
            "Siparişler başarıyla gruba eklendi ve grup boş olduğu için silindi.",
        };
      } else {
        return {
          status: 200,
          message: "Siparişler başarıyla gruba eklendi.",
        };
      }
    }
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
};

//! Gönderilen grubu makineye yollayacak servis...
const sendToMachine = async (params) => {
  const { id_dec, machine_name, process_name, process_id, group_record_id } =
    params;
  const currentDateTimeOffset = new Date().toISOString();

  try {
    // grup var mı ?
    const group = await GroupRecords.findOne({
      where: { group_record_id },
    });

    // grup no yoksa...
    if (!group) {
      return {
        status: 404,
        message: "Makineye gönderilecek grup numarası bulunamadı...",
      };
    }

    if (group.group_status === "2") {
      return {
        status: 404,
        message: `Bu grup makineye gönderilmiş ${group.machine_name}`,
      };
    }

    // Eğer varsa bu gurubun siparişlerini bul
    const orders = await WorkLog.findAll({
      where: { group_record_id, work_status: "0" },
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
        group_status: "2",
        process_name,
        machine_name,
      },
      {
        where: {
          group_record_id,
        },
      }
    );

    // bulunan siparişlerin uniq idsini kullanarak güncelle...
    for (const order of orders) {
      await WorkLog.update(
        {
          process_name,
          machine_name,
          process_id,
        },
        {
          where: { uniq_id: order.uniq_id, work_status: "0" },
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

//! Makineye gonderılmıs prosesi baslatacak servis work status 0dan 1 e  gs-3
async function startToProcess({ id_dec, group_record_id }) {
  try {
    const group = await GroupRecords.findOne({
      where: {
        group_record_id,
      },
    });

    if (!group) {
      return { status: 404, message: "İşlem yapılacak grup bulunamadı..." };
    }

    const orders = await WorkLog.findAll({
      where: {
        group_record_id,
        work_status: "0",
      },
    });

    if (orders.length < 0) {
      return {
        status: 404,
        message: "Bu grupta prosese gönderilecek sipariş yok",
      };
    }

    const isActiveOrder = orders.every((item) => item.work_status === "1");

    if (isActiveOrder && group.group_status === "3") {
      return { status: 400, message: "Proses başlatılmış" };
    }

    // grubu guncelle status vs...
    await GroupRecords.update(
      {
        group_status: "3",
        group_start_date: new Date().toISOString(),
      },
      {
        where: {
          group_record_id,
          group_status: "2",
        },
      }
    );

    // WorkLog'daki siparişleri güncelle
    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "1",
          user_id_dec: id_dec,
          work_start_date: new Date().toISOString(),
        },
        {
          where: {
            group_record_id,
            uniq_id: order.uniq_id,
            work_status: "0", // Sadece durumu 0 olan siparişleri güncelle
          },
        }
      );
    }

    return { status: 200, message: "Proses başlatıldı." };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Makineyi durduracak servis gs-4 ws-2
async function stopToSelectedMachine(
  selectedGroup,
  id_dec,
  stop_reason_id,
  area_name
) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const group = await GroupRecords.findOne({
      where: {
        group_record_id: selectedGroup.group_record_id,
        group_status: "3",
      },
    });

    if (!group) {
      return {
        status: 404,
        message:
          "Durdurmak istediğiniz makinede aktif bir iş yok yada durdurulmus.",
      };
    }

    const orders = await WorkLog.findAll({
      where: {
        group_record_id: selectedGroup.group_record_id,
        work_status: "1",
      },
    });

    // şartları sağlayan tum sıparıslerı guncelle
    if (!orders || orders.length === 0) {
      return { status: 400, message: "Grupta aktif sipariş yok" };
    } else {
      for (const order of orders) {
        await stopWork({
          work_log_uniq_id: order.uniq_id,
          currentDateTimeOffset,
          order_id: order.order_no,
          stop_reason_id,
          user_who_stopped: id_dec,
          group_record_id: order.group_record_id,
          area_name,
        });
      }
    }

    // şartları sağlayan tüm siparişleri de güncelle
    await GroupRecords.update(
      { group_status: "4" },
      {
        where: {
          group_record_id: selectedGroup.group_record_id,
          group_status: "3",
        },
      }
    );

    return {
      status: 200,
      message: `Makibe başarıyla durduruldu ${group.machine_name}`,
    };
  } catch (err) {
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Durdurulan makineyi yeniden başlatacak servis.. TRACSACTİON kullandık
async function restartToMachine(selectedGroup, id_dec, area_name) {
  const currentDateTimeOffset = new Date().toISOString();
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    // Seçilen grubu veritabanından buluyoruz
    const group = await GroupRecords.findOne({
      where: {
        group_record_id: selectedGroup.group_record_id,
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer grup bulunamazsa, işlem başarısız olur
    if (!group) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return {
        status: 400,
        message: `Durdurulacak grup bulunamadı ${selectedGroup?.group_no}...`,
      };
    }

    // Gruba ait durdurulmuş işleri buluyoruz
    const orders = await WorkLog.findAll({
      where: {
        group_record_id: selectedGroup.group_record_id,
        work_status: "2", // Sadece durdurulmuş işleri seçiyoruz
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer durdurulmuş iş yoksa, işlem başarısız olur
    if (!orders || orders.length === 0) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return { status: 400, message: "Grubun içinde durdurulmuş sipariş yok " };
    } else {
      // Durdurulmuş işler için gerekli güncellemeleri yapıyoruz
      for (const order of orders) {
        // Durdurulmuş işlerin sonlanma tarihini ve başlatan kullanıcıyı güncelliyoruz
        await StoppedWorksLogs.update(
          {
            stop_end_date: currentDateTimeOffset,
            user_who_started: id_dec,
          },
          {
            where: {
              work_log_uniq_id: order.uniq_id,
              stop_end_date: null, // Sadece durdurulmuş (bitmemiş) işleri seçiyoruz
            },
            transaction, // İşlemi transaction içinde yapıyoruz
          }
        );

        // İş durumunu '1' olarak güncelliyoruz, yani aktif hale getiriyoruz
        await WorkLog.update(
          {
            work_status: "1", // İş yeniden başlatıldığı için durum '1' oluyor
          },
          { where: { uniq_id: order.uniq_id }, transaction }
        );
      }

      // Grup durumunu '3' (aktif) olarak güncelliyoruz
      await GroupRecords.update(
        {
          group_status: "3",
        },
        {
          where: {
            group_record_id: selectedGroup.group_record_id,
          },
          transaction, // İşlemi transaction içinde yapıyoruz
        }
      );

      await transaction.commit(); // Tüm işlemler başarılı olduğunda transaction'ı tamamlıyoruz
      return { status: 200, message: "İşler başarıyla yeniden başlatıldı." };
    }
  } catch (err) {
    await transaction.rollback(); // Hata durumunda tüm işlemleri geri alıyoruz
    console.error("Internal server error", err);
    return {
      status: 500,
      message: "Sunucu hatası, lütfen daha sonra tekrar deneyin.",
    };
  }
}

//! Ölçüm veri girişi
async function createMeasurementData(measurementsInfo) {
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const group = await GroupRecords.findAll({
      where: {
        group_no: measurementsInfo.group_no,
      },
    });

    const sologroup = await GroupRecords.findOne({
      where: {
        group_no: measurementsInfo.group_no,
      },
    });

    if (sologroup.group_status === "3") {
      return {
        status: 404,
        message: "Ölçü alabilmek için önce prosesi bitirin",
      };
    }

    console.log(group);

    // Grup statüsü 5 ya da 7 olanların kontrolünü yap
    const areTheGroupsValid = group.every(
      (item) => item.group_status === "5" || item.group_status === "7"
    );

    if (!areTheGroupsValid) {
      return {
        status: 404,
        message:
          "Grubun diğer prosesleri bitirilmemiş öncelikle o grupları bitirin.",
      };
    }

    if (sologroup.group_status === "3") {
      return {
        status: 404,
        message: "Ölçü alabilmek için önce prosesi bitirin",
      };
    }

    const measure = await MeasureData.findOne({
      where: {
        order_no: measurementsInfo.order_no,
        group_no: measurementsInfo.group_no,
        measure_status: "1",
      },
    });

    if (measure) {
      return {
        status: 400,
        message: `${measure.order_no} numaralı siparişin daha önce ölçümü alınmış.`,
      };
    }

    // const allOrderNo = [];

    // for (const grp of group) {
    //   const orders = await WorkLog.findAll({
    //     where: {
    //       group_no: grp.group_no,
    //     },
    //   });

    //   orders.forEach((item) => {
    //     if (!allOrderNo.includes(item.order_no)) {
    //       allOrderNo.push(item.order_no);
    //     }
    //   });
    // };

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
      group_no: measurementsInfo.group_no,
      measure_status: "1",
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
      message: "Ölçüm verisi kaydedilirken bir hata oluştu.",
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
      order: [["data_entry_date", "DESC"]],
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

//! Gruptaki işleri bitirip grubu güncelleyecek servis
async function finishTheGroup({ groups, id_dec }) {
  const groupIds = groups;
  try {
    // Grup ID'lerine ait tüm order'ları WorkLog'dan topla
    let allOrderUniqId = [];

    for (const groupId of groupIds) {
      const orders = await WorkLog.findAll({
        where: { group_record_id: groupId.group_record_id },
      });

      // Eğer group_no'ya bağlı order'lar varsa, bunları allOrderUniqId dizisine ekle
      if (orders && orders.length > 0) {
        // work_status'u 1 olan bir order varsa, hata döndür
        const stoppedOrder = orders.find((order) => order.work_status === "2");
        const emptyOrder = orders.find((order) => order.work_status === "0");
        const ongoingOrder = orders.find((order) => order.work_status === "1");

        if (stoppedOrder) {
          return {
            status: 400,
            message: `Bu grupta durdurulmuş bir sipariş var. Öncelikle onu iptal edin ya da işi bitirin: ${groupId.group_no}`,
          };
        } else if (emptyOrder) {
          return {
            status: 400,
            message: `Bu grupta başlamamış bir iş var. Grup teslim edilmedi. Yanlış grupta işlem yapmış olabilirsiniz: ${groupId.group_no}`,
          };
        } else if (ongoingOrder) {
          allOrderUniqId = allOrderUniqId.concat(
            orders
              .filter((order) => order.work_status === "1") // Sadece work_status === "1" olan siparişleri dahil et
              .map((order) => order.uniq_id) // Bu siparişlerin uniq_id'sini al
          );
        }
      } else {
        return {
          status: 400,
          message: `Grup bulunamadı veya içinde sipariş yok: ${groupId.group_no}`,
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

    for (const groupId of groupIds) {
      const updatedOrders = await WorkLog.findAll({
        where: { group_record_id: groupId.group_record_id },
      });

      if (updatedOrders && updatedOrders.length > 0) {
        const incompleteOrder = updatedOrders.find(
          (order) =>
            order.work_status !== "3" &&
            order.work_status !== "4" &&
            order.work_status !== "5"
        );
        if (incompleteOrder) {
          allGroupsCompleted = false;
          break;
        }
      } else {
        return {
          status: 400,
          message: `Güncelleme sonrası grup bulunamadı veya içinde sipariş yok: ${groupId.group_no}`,
        };
      }
    }

    // Eğer tüm siparişler "3" veya "4" "5" ise grubu güncelle
    if (allGroupsCompleted) {
      const [updatedRows] = await GroupRecords.update(
        {
          group_status: "5", // Grubun yeni durumu
          group_end_date: new Date().toISOString(),
        },
        {
          where: {
            group_record_id: groupIds.map((group) => group.group_record_id),
          },
        }
      );

      console.log(`Güncellenen satır sayısı: ${updatedRows}`);
    }

    return {
      status: 200,
      message: `Siparişler bitirldi, gruplar kapatıldı: ${groupIds.map(
        (group) => group.group_no
      )}`,
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: "Sunucu hatası.",
    };
  }
}

//! Grubu teslim edecek servis gs-6 ws-4
async function deliverTheGroup(group, id_dec) {
  try {
    // Grup status "5" değilse işlem yapılmayacak
    if (group.group_status !== "5") {
      return {
        status: 400,
        message:
          "Grup teslim edilmeye uygun değil. Lütfen bitmiş bir grubu teslim edin.",
      };
    }

    // Teslim edilecek grupları al
    const groups = await GroupRecords.findAll({
      where: {
        group_no: group.group_no,
        group_status: "5",
      },
    });

    // Tüm iş emirlerini tek seferde al
    const allOrders = await WorkLog.findAll({
      where: {
        group_no: group.group_no,
      },
    });

    // İş emirlerini filtrele ve tekrar edenleri önle
    const uniqueOrders = Array.from(
      new Set(allOrders.map((item) => item.order_no))
    );

    // Eksik ölçümleri kontrol et
    const incompleteMeasurements = [];

    for (const order_no of uniqueOrders) {
      // Bu order_no için measure_status "1" olan bir kayıt var mı diye kontrol et
      const hasValidMeasurement = await MeasureData.findOne({
        where: {
          order_no: order_no,
          group_no: group.group_no,
          measure_status: "1",
        },
      });

      if (!hasValidMeasurement) {
        incompleteMeasurements.push(`order no: ${order_no}`);
      }
    }

    // Eğer eksik ölçümler varsa, teslim işlemini durdur
    if (incompleteMeasurements.length > 0) {
      return {
        status: 404,
        message: `Prosesi teslim edebilmek için eksik ölçümleri yapınız: ${incompleteMeasurements.join(
          ", "
        )}`,
      };
    }

    // Grup status "6" yapılıyor (teslim edilmiş)
    await GroupRecords.update(
      {
        group_status: "6",
      },
      {
        where: {
          group_record_id: group.group_record_id,
        },
      }
    );

    return { status: 200, message: "Grup başarıyla teslim edildi." };
  } catch (err) {
    console.error("Grup teslimi sırasında hata oluştu:", err);
    return {
      status: 500,
      message: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
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
      const groupRecordId = orders[0].group_record_id; // İlk order'ın grup numarasını alıyoruz
      return orders.every((order) => order.group_record_id === groupRecordId);
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
        group_record_id: orders[0].group_record_id,
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
          group_status: "5",
        },
        {
          where: {
            group_record_id: orders[0].group_record_id,
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
          group_status: "5",
        },
        {
          where: {
            group_record_id: orders[0].group_record_id,
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

//! GRUPLU EKRANLARDA siparişi iptal edecek fonksiyon
async function cancelOrderInGroup(orders, id_dec) {
  try {
    const areGroupsSimilar = (orders) => {
      if (orders.length === 0) {
        return { status: 400, message: "Sipariş listesi boş olamaz." };
      }
      const groupNo = orders[0].group_no;
      const allSameGroup = orders.every((order) => order.group_no === groupNo);
      if (!allSameGroup) {
        return {
          status: 400,
          message: "Tüm siparişler aynı grup içinde olmalı.",
        };
      }
      return { status: 200 };
    };

    const groupsSimilarResult = areGroupsSimilar(orders);

    if (groupsSimilarResult.status !== 200) {
      return groupsSimilarResult; // Eğer gruplar aynı değilse hata mesajını döner
    }

    for (const order of orders) {
      await WorkLog.update(
        {
          work_status: "3", // Sipariş iptal ediliyor
          group_no: "",
        },
        {
          where: {
            group_record_id: order.group_record_id,
            uniq_id: order.uniq_id,
          },
        }
      );
    }

    const allOrdersInGroup = await WorkLog.findAll({
      where: {
        group_record_id: orders[0].group_record_id,
      },
    });

    // Gruptaki tüm siparişler iptal edilmiş mi?
    const allOrdersCancelled = allOrdersInGroup.every(
      (order) => order.work_status === "3"
    );

    // Grupta hiçbir siparişin durumu "0", "1" veya "2" değil mi?
    const noPendingOrders = allOrdersInGroup.every(
      (order) =>
        order.work_status !== "0" &&
        order.work_status !== "1" &&
        order.work_status !== "2"
    );

    // Eğer tüm siparişler iptal edilmişse, grup statüsü 7 yapılacak
    if (allOrdersCancelled) {
      await GroupRecords.update(
        { group_status: "7" },
        {
          where: { group_record_id: orders[0].group_record_id },
        }
      );
      return {
        status: 200,
        message: "Gruptaki tüm siparişler iptal edildi...",
      };
    }

    // Eğer hiç "0", "1" veya "2" statüsünde sipariş yoksa, grup statüsü 5 yapılacak
    if (noPendingOrders) {
      await GroupRecords.update(
        { group_status: "5" },
        {
          where: { group_record_id: orders[0].group_record_id },
        }
      );
    }

    return { status: 200, message: "Sipariş başarıyla iptal edildi." };
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return { status: 500, message: "Sunucu hatası, lütfen tekrar deneyin." };
  }
}

//! Kapatılan gruplar ve siparişleri ile aynı yada farklı proseslerde tekrardan iş başlatacak servis
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
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    // Grubun orderlarını bul...
    const orders = await WorkLog.findAll({
      where: {
        group_record_id,
      },
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    // Eğer grupta sipariş yoksa
    if (orders.length === 0) {
      await transaction.rollback(); // İşlemi geri alıyoruz
      return {
        status: 404,
        message: `${group_no} nosuna ait geçmiş sipariş bulunamadı.`,
      };
    }

    console.log({ orders: orders });

    // Benzersiz group_record_id oluşturma
    const latestRecordId = await GroupRecords.findOne({
      order: [["group_record_id", "DESC"]],
      transaction, // İşlemi transaction içinde yapıyoruz
    });

    let newUniqId;
    if (latestRecordId) {
      const latestId = parseInt(latestRecordId.group_record_id, 10);
      newUniqId = String(latestId + 1).padStart(6, "0");
    } else {
      newUniqId = "000001";
    }

    // Aynı grup no ile grup kaydı oluştur...
    const groupRecord = await GroupRecords.create(
      {
        group_record_id: newUniqId,
        group_no: group_no,
        who_started_group: id_dec,
        group_creation_date: new Date().toISOString(),
        group_status: "2", // Yeni grup aktif
        section,
        area_name: areaName,
        process_name,
        machine_name,
      },
      { transaction }
    );

    const currentDateTimeOffset = new Date().toISOString();

    if (groupRecord) {
      for (const order of orders) {
        const sorder = await WorkLog.findOne({
          where: {
            order_no: order.order_no,
          },
          transaction, // İşlemi transaction içinde yapıyoruz
        });

        if (!sorder) {
          throw new Error(`Order not found for ORDER_ID: ${order.order_no}`);
        }

        const work_info = {
          section,
          area_name: areaName,
          work_status: "0", // İş henüz başlamadı
          process_name,
          machine_name,
          production_amount: sorder.production_amount,
          order_id: sorder.order_no,
          process_id,
          user_id_dec: id_dec,
          group_record_id: newUniqId,
          group_no: group_no,
        };

        await createWork({ work_info, currentDateTimeOffset, transaction });
      }

      await transaction.commit(); // Tüm işlemler başarılı olduysa transaction'ı tamamla
      return {
        status: 200,
        message: "Grup ve siparişler başarıyla yeniden başlatıldı.",
      };
    }
  } catch (err) {
    await transaction.rollback(); // Hata durumunda tüm işlemleri geri alıyoruz
    console.log(err);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

//! okutulan siparişi seçili gruba ekleyecek servis...
async function addReadOrderToGroup(group, orderList, user, areaName, section) {
  if (!orderList || !user) {
    return { status: 400, message: "Missing required parameters." };
  }

  const currentDateTimeOffset = new Date().toISOString();
  try {
    for (const order of orderList) {
      const work_info = {
        section,
        area_name: areaName,
        work_status: "0",
        production_amount: order.PRODUCTION_AMOUNT,
        order_id: order.ORDER_ID,
        user_id_dec: user.id_dec,
        op_username: user.op_username,
        group_no: group.group_no,
        group_record_id: group.group_record_id,
      };

      await createWork({ work_info, currentDateTimeOffset });
    }

    return {
      status: 200,
      message: `Okutulan siparişler başarıyla ${group.group_no}'lu gruba eklendi...`,
    };
  } catch (err) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

//! okutulan sıparısın olcu aralıgını getırecek servıs
async function getMetarialMeasureData(metarial_no) {
  try {
    const result = await Zincir50CMGR.findOne({
      where: {
        materialCode: metarial_no,
      },
    });

    // findOne bir obje veya null döner, bu nedenle length yerine null kontrolü yapılmalı
    if (result) {
      return { status: 200, message: result };
    } else {
      return {
        status: 404,
        message: `${metarial_no} için ölçü aralığı bulunamadı.`,
      };
    }
  } catch (err) {
    console.error("Error in getMetarialMeasureData function:", err); // Hatalı fonksiyon adını düzelttim
    return { status: 500, message: "İç sunucu hatası." };
  }
}

//! Malzeme no ya gore olcum cekecek query...
async function getMeasureWithOrderId(material_no, areaName) {
  try {
    const result = await MeasureData.findAll({
      where: {
        material_no,
        area_name: areaName,
        measure_status: "1",
      },
      order: [["data_entry_date", "DESC"]],
    });

    if (result && result.length > 0) {
      return { status: 200, message: result };
    } else {
      return {
        status: 200,
        message: `${material_no} ait geçmiş olçüm bulunamadı.`,
      };
    }
  } catch (error) {
    console.error("Error in getMeasureWithOrderId function:", error); // Hata adı düzeltilmiş
    return { status: 500, message: "İç sunucu hatası." };
  }
}
//! secılı olcumu sılecek servıs
async function deleteMeasurement(area_name, order_no, id, user) {
  console.log(id);
  try {
    const measure = await MeasureData.findOne({ where: { id } });

    if (!measure) {
      return { status: 404, message: "Silmek istediğiniz ölçüm bulunamadı" };
    }

    const result = await MeasureData.update(
      {
        delete_date: new Date().toISOString(),
        who_deleted_measure: user,
        measure_status: "2",
      },
      {
        where: { area_name, order_no, id },
      }
    );

    if (result[0] === 0) {
      return { status: 400, message: "Ölçüm silinemedi, işlem başarısız" };
    }

    return { status: 200, message: "Ölçüm silme işlemi başarılı" };
  } catch (err) {
    console.error("Error in deleteMeasurement function:", err);
    return { status: 500, message: "İç sunucu hatası." };
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
  restartGroupProcess,
  startToProcess,
  stopToSelectedMachine,
  restartToMachine,
  cancelOrderInGroup,
  deliverTheGroup,
  addReadOrderToGroup,
  getWorksWithoutId,
  getMetarialMeasureData,
  getMeasureWithOrderId,
  deleteMeasurement,
};
