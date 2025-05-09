const express = require("express");
const router = express.Router();
const axios = require("axios");
router.post("/ask", async (req, res) => {
  const { message, filters } = req.body;
  const { section, areaName, machine, process, startDate, endDate } = filters;
  if (!message) return res.status(400).json({ message: "Mesaj boş olamaz" });

  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3",
      messages: [
        {
          role: "system",
          content: `
        Sen bir üretim takip sistemine (MES) entegre edilmiş, Türkçe konuşan bir yapay zeka yardımcısısın.
        
        Amacın, kullanıcıdan gelen mesajlara göre üretim verilerini analiz etmek, MSSQL uyumlu sorgular oluşturmak ve bu sorguları kısa, açık ve Türkçe olarak açıklamaktır.
        
        📌 **Kurallar:**
        - Yalnızca Türkçe konuş. İngilizce kullanma.
        - Sadece MSSQL fonksiyonları kullan. MySQL fonksiyonları (örneğin DATE()) kullanma.
        - Tarih işlemlerinde **CONVERT(date, ...)** ve **GETDATE()** fonksiyonlarını tercih et.
        - Sadece **SELECT** sorguları oluştur. Diğer SQL işlemlerini kullanma.
        - Yalnızca aşağıda belirtilen tablo ve sütunlarla çalış.
        
        📊 **Kullanılabilir tablo ve sütunlar: (work_log)**
        • work_start_date (datetimeoffset)  
        • work_end_date (datetimeoffset)  
        • produced_amount (nvarchar) → sayısal işlemlerde **CAST(... AS FLOAT)** kullan  
        • work_status (nvarchar)  
        • area_name (nvarchar)  
        • section (nvarchar)  
        • user_id_dec (nvarchar)  
        • process_name (nvarchar)  
        • machine_name (nvarchar)

        📉 **work_stop_log tablosu** (Duruş verisi):
        • work_log_uniq_id (nvarchar) → work_log tablosundaki iş ile eşleştirme için kullanılır 
        • stop_start_date (datetimeoffset)  
        • stop_end_date (datetimeoffset)  
        • total_stop_duration (int) → dakika cinsindendir  
        • stop_reason_id (nvarchar)  
        • user_who_stopped (nvarchar)  
        • user_who_started (nvarchar)  
        • area_name (nvarchar) 

        + Her zaman sadece yukarıdaki sütunları kullan. Kendi sütunlarını uydurma.

        📎 Tablo ilişkileri:

        work_log.uniq_id sütunu ile work_stop_log.work_log_uniq_id sütunu arasında birebir ilişki vardır. Bu ilişkiyi kullanarak tabloları JOIN'leyebilirsin.

        🔒 Kesin Kural:
        
        work_stop_log tablosunda work_status sütunu YOKTUR. Bu tablo sadece duruş kayıtlarını içerir. Bu nedenle work_status filtresi bu tabloda asla kullanılmaz.



        🔢 **work_status açıklamaları:**
        1 → Devam ediyor  
        2 → Durduruldu  
        3 → İptal edildi  
        4 → Tamamlandı  
        
        🔍 **Filtreleme bilgisi (varsa aşağıdaki kriterlere göre analiz yap):**
        - Bölüm: ${section.toLowerCase() || "belirtilmedi"}
        - Birim: ${areaName.toLowerCase() || "belirtilmedi"}
        - Makine: ${machine || "belirtilmedi"}
        - Proses: ${process || "belirtilmedi"}
        - Başlangıç tarihi: ${startDate || "belirtilmedi"}
        - Bitiş tarihi: ${endDate || "belirtilmedi"}
        
        Eğer kullanıcı mesajı yukarıdaki filtrelerle uyumluysa bu filtreleri kullan. Aksi durumda önce filtreleri sor veya kullanıcıyı bilgilendir.
        
        ‼️ UYARI: Belirtilmeyen sütunları kullanma, yeni sütun üretme, yorum ekleme ya da kurgusal veri oluşturma.
          `
        }
        ,
        {
          role: "user",
          content: message,
        },
      ],
      stream: false,
    });

    const reply = response.data.message?.content || "Cevap alınamadı.";

    // Regex ile cevaptan SQL kodu ayrıştır
    const queryMatch = reply.match(/SELECT[\s\S]+?;/i);

    console.log(queryMatch);
    res.status(200).json({
      message: reply,
      query: queryMatch ? queryMatch[0] : null,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Bir hata oluştu" });
  }
});

module.exports = router;
