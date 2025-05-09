const WorkLog = require("../../models/WorkLog.js");
const { Op } = require("sequelize");
const sequelize = require("../../lib/dbConnect.js");
const Machines = require("../../models/Machines.js");
const RepairSection = require("../../models/RepairReason.js");
const { StoppedWorksLogs } = require("../../models/syncDBmodels.js");
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
  if (startDate || endDate) {
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

// İş durumlarına göre data cekecek servis
const getWorkStatusData = async (
  section,
  areaName,
  process,
  machine,
  startDate,
  endDate
) => {
  try {
    const whereConditions = {};
    if (section) whereConditions.section = section;
    if (areaName) whereConditions.area_name = areaName;
    if (process) whereConditions.process_name = process;
    if (machine) whereConditions.machine_name = machine;
    if (endDate && startDate) {
      whereConditions.work_start_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const result = await WorkLog.findAll({
      attributes: ["work_status", [fn("COUNT", col("work_status")), "total"]],
      group: ["work_status"],
      where: whereConditions,
    });

    return {
      status: 200,
      message: "İş durumuna göre gruplama işlemi başarılı.",
      data: result,
    };
  } catch (err) {
    return { status: 500, message: "İş durumlarına göre veriler çekilemedi" };
  }
};

//! Makine durumlarını cekecek servis
const getMachineStatusOverview = async () => {
  try {
    const machines = await Machines.findAll({
      attributes: ["machine_name", "section", "area_name", "process_name"],
      include: [
        {
          model: WorkLog,
          required: false,
          attributes: ["work_status"],
          where: {
            work_status: {
              [Op.in]: ["1", "2"],
            },
          },
        },
      ],
    });

    let active = 0;
    let stopped = 0;
    let passive = 0;

    machines.forEach((machine) => {
      const statuses = machine.WorkLogs.map((log) => log.work_status);
      if (statuses.includes("1")) active++;
      else if (statuses.includes("2")) stopped++;
      else passive++;
    });

    const machineStatus = {
      total: machines.length,
      active: active,
      stopped: stopped,
      passive: passive,
    };

    console.log(machineStatus);

    return {
      status: 200,
      message: "Makine durumları çekildi getMachineStatusOverview.",
      data: machineStatus,
    };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "" };
  }
};

//! Aktif işlerde geçen süreyi getirecek servis
const getOpenDurationOfActiveWorks = async () => {
  try {
    const activeWorks = await WorkLog.findAll({
      where: { work_status: "1" },
      attributes: [
        "id",
        "order_no",
        "user_id_dec",
        "machine_name",
        "process_name",
        "area_name",
        "section",
        "work_start_date",
        [
          sequelize.literal("DATEDIFF(MINUTE, work_start_date, GETDATE())"),
          "acik_sure_dakika",
        ],
      ],
    });
    return {
      status: 200,
      message: "Aktif işlerin açık kalma süreleri getirildi.",
      data: activeWorks,
    };
  } catch (err) {
    return { status: 500, message: "" };
  }
};

//!
const getRepairReasonStats = async (work_start_date, work_end_date) => {
  try {
    const whereClause = {
      repair_reason: { [Op.ne]: null },
      work_status: "4",
    };

    if (work_start_date && work_end_date) {
      whereClause.work_start_date = {
        [Op.between]: [new Date(work_start_date), new Date(work_end_date)],
      };
    }

    const workLogs = await WorkLog.findAll({
      attributes: ["repair_reason"],
      where: whereClause,
      raw: true,
    });

    const reasonCounts = {};

    for (const log of workLogs) {
      try {
        const reasons = JSON.parse(log.repair_reason); // string → dizi
        reasons.forEach((reason) => {
          if (reason && reason.trim()) {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          }
        });
      } catch (err) {
        console.warn("repair_reason parse hatası:", log.repair_reason);
      }
    }

    // Objeyi diziye çevirip sıralayalım
    const result = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      status: 200,
      message: "Tamir nedenleri başarıyla gruplandı.",
      data: result,
    };
  } catch (err) {
    console.error("Repair reason istatistik hatası:", err);
    return {
      status: 500,
      message: "Tamir nedenleri çekilirken bir hata oluştu.",
    };
  }
};

//! Aktif duran iş süresinin verisini çekecek servis...
const getStoppedWorksDuration = async () => {
  try {
    const whereClause = {
      stop_end_date: null,
    };
    const stoppedDuration = await StoppedWorksLogs.findAll({
      attributes: [
        "order_id",
        "work_log_uniq_id",
        "stop_start_date",
        [
          sequelize.literal(`DATEDIFF(MINUTE, stop_start_date, GETDATE())`),
          "durus_suresi_dakika",
        ],
      ],
      where: whereClause,
      order: [[sequelize.literal("durus_suresi_dakika"), "DESC"]],
      raw: true,
    });

    return {status : 200,message:"Duran iş süreleri başarıyla çekildi.",data:stoppedDuration}
  } catch (err) {
    console.log(err);
  }
};

// Machine modelinde
Machines.hasMany(WorkLog, {
  foreignKey: "machine_name",
  sourceKey: "machine_name",
});
WorkLog.belongsTo(Machines, {
  foreignKey: "machine_name",
  targetKey: "machine_name",
});

module.exports = {
  getWorksLogSummary,
  getDailyProductionStats,
  getWorkStatusData,
  getMachineStatusOverview,
  getOpenDurationOfActiveWorks,
  getRepairReasonStats,
  getStoppedWorksDuration,
};
