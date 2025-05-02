const express = require("express");
const router = express.Router();
const axios = require("axios");
router.post("/ask", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ message: "Mesaj boş olamaz" });

  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3",
      messages: [
        {
          role: "system",
          content: `Sen bir üretim takip sistemine (MES) entegre edilmiş bir yapay zeka yardımcısısın.
          Amacın, kullanıcıdan gelen mesajlara dayanarak üretim verileriyle ilgili anlamlı analizler yapmak, SQL benzeri sorgular oluşturmak ve Türkçe açıklamalar üretmektir.
          
          Konuşma dilin Türkçedir. İngilizce asla kullanma. Cevaplarını kısa, açık ve kullanıcı dostu bir şekilde Türkçe ver. 
          
          Aşağıda analiz yapabileceğin tablolar tanımlanmıştır:
          
          Kullanabileceğin tablolar aşağıdaki gibidir:

          1. work_log: work_start_date, work_end_date, produced_amount, work_status, area_name, section, user_id_dec, process_name, machine_name
             work_status: 1 devam ediyor, 2 durduruldu, 3 iptal edildi,4 tamamlandı

          Sadece Select sorguları yapabilirsin.

          Sadece belirttiğim sutunları kullanabilirsin. Kendi kafana göre yeni sutunlar ekleyemezsin.

          Sadece yukarıdaki tablolara göre analiz yapabilirsin.

          Yalnızca yukarıdaki tablolara göre analiz yapabilirsin.

          Kullanıcıdan gelen mesajları anlamlı bir şekilde analiz et ve SQL benzeri sorgular oluştur.`,
        },
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
    
    console.log(queryMatch)
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
