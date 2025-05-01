const WorkLog = require("../../models/WorkLog.js");
const { Op } = require("sequelize");
const sequelize = require("../../lib/dbConnect.js");
const fn = sequelize.fn;
const col = sequelize.col;
const literal = sequelize.literal;

// Verilen filtrelerle WorkLog üzerinde work_status dağılımını ve aktif operatör sayısını verir.
const getWorksLogSummary = async (
  section,
  areaName,
  process,
  machine,
  startDate,
  endDate
) => {
  const whereClause = {};

  if (section && section !== "all") whereClause.section = section;
  if (areaName && areaName !== "all") whereClause.area_name = areaName;
  if (process && process !== "all") whereClause.process_name = process;
  if (machine && machine !== "all") whereClause.machine_name = machine;
  if (startDate && endDate) {
    whereClause.work_start_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  try {
    // work_status 1: aktif, 2: pasif, 3: beklemede, 4: tamamlandı, 5: iptal edildi
    const counts = await WorkLog.findAll({
      where: whereClause,
      attributes: [
        "work_status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["work_status"],
      raw: true,
    });

    // disting olarak aktif operator sayısı... daha sonra section_part dan da veri eklecek.
    const activeOperatorCount = await WorkLog.count({
      where: {
        ...whereClause,
        work_status: "1",
      },
      distinct: true,
      col: "user_id_dec",
    });
    return {
      status: 200,
      message: "Çalışma günlüğü özeti başarıyla alındı",
      data: {
        statusCount: counts,
        activeOperatorCount: activeOperatorCount,
      },
    };
  } catch (err) {
    console.error("Summary error:", err);
    return { status: 500, message: "Error while fetching works log summary" };
  }
};

// Tarih aralığı içinde günlük produced_amount toplamlarını verir (grafik için).
const getDailyProductionStats = async (
  section,
  areaName,
  process,
  machine,
  startDate,
  endDate
) => {
  const whereClause = {};

  if (section && section !== "all") whereClause.section = section;
  if (areaName && areaName !== "all") whereClause.area_name = areaName;
  if (process && process !== "all") whereClause.process_name = process;
  if (machine && machine !== "all") whereClause.machine_name = machine;
  if (startDate && endDate) {
    whereClause.work_start_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  try {
    const dailyProduction = await WorkLog.findAll({
      where: whereClause,
      attributes: [
        [
          sequelize.fn(
            "CONVERT",
            sequelize.literal("date"),
            sequelize.col("work_start_date")
          ),
          "work_start_date",
        ],
        [
          sequelize.literal("SUM(CAST(produced_amount AS FLOAT))"),
          "produced_amount",
        ],
      ],
      group: [
        sequelize.fn(
          "CONVERT",
          sequelize.literal("date"),
          sequelize.col("work_start_date")
        ),
      ],
      order: [
        [
          sequelize.fn(
            "CONVERT",
            sequelize.literal("date"),
            sequelize.col("work_start_date")
          ),
          "ASC",
        ],
      ],
      raw: true,
    });

    return {
      status: 200,
      message: "Günlük üretim verileri başarıyla alındı",
      data: dailyProduction,
    };
  } catch (error) {
    console.error("Daily production error:", error);
    return {
      status: 500,
      message: "Error while fetching daily production stats",
    };
  }
};

module.exports = { getWorksLogSummary, getDailyProductionStats };
