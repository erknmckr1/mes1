const express = require("express");
const router = express.Router();
const { getWorksLogSummary,getDailyProductionStats } = require("../services/analyticsServices.js");

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
      const result = await getDailyProductionStats(section, areaName, process, machine, startDate, endDate);
      res.status(result.status).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Daily production stats error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

module.exports = router;
