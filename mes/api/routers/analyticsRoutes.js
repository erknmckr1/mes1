const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const sendMail = require("../services/mailService");
const {
  getWorksLogSummary,
  getDailyProductionStats,
  getWorkStatusData,
  getMachineStatusOverview,
  getOpenDurationOfActiveWorks,
  getRepairReasonStats,
  getStoppedWorksDuration,
  getWorkLogData,
} = require("../services/analyticsServices.js");

router.get("/getWorksCountSummary", async (req, res) => {
  const {
    section,
    areaName,
    machine,
    process,
    startDate,
    endDate,
    metarial_no,
    order_no,
  } = req.query;
  const result = await getWorksLogSummary(
    section,
    areaName,
    process,
    machine,
    startDate,
    endDate,
    metarial_no,
    order_no
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
  const {
    section,
    area_name,
    machine,
    process,
    startDate,
    endDate,
    dataType,
    material_no,
    order_no,
  } = req.query;

  try {
    const result = await getWorkLogData(
      section,
      area_name,
      machine,
      process,
      startDate,
      endDate,
      dataType,
      material_no,
      order_no
    );

    console.log(material_no)
    return res.status(result.status).json({
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//! export sayfasında olusturulan tabloyu excell formatında ındırecek endpoint
router.post("/export-data", async (req, res) => {
  try {
    const { headers, rows } = req.body;

    if (!headers || !rows || rows.length === 0) {
      return res.status(400).json({ message: "Veri eksik veya boş." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    // 📸 1. LOGO EKLEME (üst A1:C4 aralığına)
    const logoPath = path.join(__dirname, "../../public/midas_logo.png");
    const imageId = workbook.addImage({
      filename: logoPath,
      extension: "png",
    });

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 }, // sol üst
      ext: { width: 150, height: 60 }, // logo boyutu (px)
      editAs: "oneCell",
    });

    // 📦 2. BAŞLIKLARI 5. SATIRDAN BAŞLAT
    const startRow = 5;
    worksheet.spliceRows(
      startRow,
      0,
      headers.map((h) => h.replace(/_/g, " ").toUpperCase())
    );

    worksheet.getRow(startRow).font = { bold: true };

    // 🧾 3. VERİLERİ EKLE (6. satırdan itibaren)
    rows.forEach((row, index) => {
      const rowData = headers.map((h) => row[h]);
      worksheet.insertRow(startRow + 1 + index, rowData);
    });

    // Sütun genişliği ayarla
    headers.forEach((_, i) => {
      worksheet.getColumn(i + 1).width = 20;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ozel-export-logo.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ message: "Excel oluşturma hatası." });
  }
});

//! Maile ek yollayacak fonksiyon...
router.post("/send-export-mail", async (req, res) => {
  try {
    const { headers, rows, email } = req.body;

    if (!email || !headers || !rows || rows.length === 0) {
      return res.status(400).json({ message: "Eksik veri gönderildi." });
    }

    // Excel oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    worksheet.columns = headers.map((key) => ({
      header: key.replace(/_/g, " ").toUpperCase(),
      key,
      width: 20,
    }));

    rows.forEach((row) => {
      const filteredRow = {};
      headers.forEach((key) => {
        filteredRow[key] = row[key];
      });
      worksheet.addRow(filteredRow);
    });

    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `export-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    // Mail içeriği
    const emailBody = `
      <p>Aşağıda dışa aktarılmış Excel dosyanız bulunmaktadır.</p>
      <p>İyi çalışmalar.</p>
    `;

    await sendMail(email, "Excel Verisi - Midas", emailBody, filePath);

    // Temizlik
    fs.unlinkSync(filePath);

    return res.status(200).json({ message: "E-posta gönderildi." });
  } catch (error) {
    console.error("Excel e-posta gönderimi hatası:", error);
    return res.status(500).json({ message: "E-posta gönderilemedi." });
  }
});

module.exports = router;
