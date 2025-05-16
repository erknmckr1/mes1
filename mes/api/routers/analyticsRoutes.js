const express = require("express");
const router = express.Router();
const {
  getWorksLogSummary,
  getDailyProductionStats,
  getWorkStatusData,
  getMachineStatusOverview,
  getOpenDurationOfActiveWorks,
  getRepairReasonStats,
  getStoppedWorksDuration,
  getWorkLogData
} = require("../services/analyticsServices.js");

router.get("/getWorksCountSummary", async (req, res) => {
  const { section, areaName, machine, process, startDate, endDate } = req.query;
  const result = await getWorksLogSummary(
    section,
    areaName,
    process,
    machine,
    startDate,
    endDate
  );
  return res.status(result.status).json({
    message: result.message,
    data: result.data,
  });
});

// Günlük üretim istatistiği
router.get("/getDailyProductionStats", async (req, res) => {
  const { section, areaName, process, machine, startDate, endDate } = req.query;
  try {
    const result = await getDailyProductionStats(
      section,
      areaName,
      process,
      machine,
      startDate,
      endDate
    );
    res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Daily production stats error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! İş durumlarına göre sayıyı verecek endpoint...
router.get("/getWorkStatusData", async (req, res) => {
  const { section, areaName, process, machine, startDate, endDate } = req.query;
  try {
    const result = await getWorkStatusData(
      section,
      areaName,
      process,
      machine,
      startDate,
      endDate
    );
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! Tüm makinelerin mevcut durumlarını gösterecek endpoint
router.get("/getMachineStatusOverview", async (req, res) => {
  try {
    const result = await getMachineStatusOverview();
    res.status(200).json({ message: "", data: result.data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! Aktif işlerin ne kadar süredir acık oldugunu dönen endpoint dakika cinsinden dönecekk.
router.get("/getOpenDurationOfActiveWorks", async (req, res) => {
  try {
    const result = await getOpenDurationOfActiveWorks();
    res.status(200).json({
      message: "Aktif sipariş üretim süre bilgileri çekildi.",
      data: result.data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! tamir nedenlerini neden - count bazında getırecek endpoint
router.get("/getRepairReasonStats", async (req, res) => {
  const { work_start_date, work_end_date } = req.params;
  try {
    const result = await getRepairReasonStats(work_start_date, work_end_date);
    res.status(200).json({
      message: "Tamir nedenlerine göre en cık karsılasılan hatalar cekildi.",
      data: result.data,
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({ message: "Internal Server Error" });
  }
});

//! stoppenWorks tablosundan hangi iş ne kadar süredir durmus onu dönecek endpoint...
router.get("/getStoppedWorksDuration", async (req, res) => {
  const {} = req.params;
  try {
    const result = await getStoppedWorksDuration();
    res
      .status(result.status)
      .json({ message: result.message, data: result.data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! work_log verisini cekecek olan endpoint...
router.get("/getWorkLogData", async (req, res) => {
  const { section, area_name, machine, process, startDate, endDate } =
    req.query.params;
    try {
      const result = await getWorkLogData(section, area_name, machine, process, startDate, endDate );
      return res.status(result.status).json({
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
