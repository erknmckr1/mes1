const express = require("express");
const app = express();
const port = process.env.PORT || 3003;
const cors = require("cors");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sequelize = require("../lib/dbConnect");
const { syncModels } = require("../models/syncDBmodels");
const {
  getAllUser,
  getUserById,
  createUser,
} = require("../api/userOperations/userAuthOperations");
const {
  getBreakReason,
  getIsUserOnBreak,
  returnToBreak,
  onBreakUsers,
  getBreakReasonLog,
} = require("../api/breakOperations");
const getStopReason = require("../api/stopReasonOperation");
const {
  getCancelReason,
  getRepairReason,
  getOrder,
  getProcessList,
  getMachineList,
  createWork,
  getWorks,
  stopWork,
  rWork,
  finishedWork,
  cancelWork,
  getStoppedWorks,
  createCekicWorkLog,
} = require("../api/orderOperations");
const leaveRoutes = require("../api/routers/leaveRoutes");
const userRoutes = require("../api/routers/userRoutes");
const orderRoutes = require("../api/routers/orderRoutes");
const shiftRoutes = require("../api/routers/shiftRoutes");
const User = require("../models/User");
const Role = require("../models/Roles");
const Permissions = require("../models/Permissions");
app.use(express.json());
app.use(cookieParser());

const currentDate = new Date();
const currentDateTimeOffset = new Date().toISOString();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://192.168.3.5:3000",
    "http://192.168.3.7:3000",
    "http://localhost:3002",
    "http://192.168.0.78:3000",
    "http://192.168.1.246:3000",
  ], // Burada uygun origin'i belirleyin
  credentials: true, // Credentials (cookies, authorization headers vs.) ile isteklere izin ver
  methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP metodları
};

app.use(cors(corsOptions));
const SECRET_KEY = crypto.randomBytes(32).toString("hex");

//! Sequelize ORM kullanarak bir Microsoft SQL Server veritabanına bağlanma, bağlantıyı doğrulama ve veritabanı modellerini senkronize etme işlemlerini gerçekleştirir.
sequelize
  .authenticate() // veri tabanına baglantının basrılı olup olmadıgıı kontrol edılır basarılı ıse ısleme devam...
  .then(() => {
    console.log("MsSql veritabanına bağlantı başarılı.");
    return syncModels(); // model db senkronizasyonu
  })
  .then(() => {
    console.log("Veritabani ve tablolar senkronize edildi.");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MySQL veritabanına bağlantı başarısız:", err);
  });

//! Gelen operator_id (veri tabanında id_dec) ile kullanıcı eşleştirmesi yapıp cookie ye token olusturan metot
app.post("/login", async (req, res) => {
  const { operator_id } = req.body;
  try {
    const users = await getAllUser();
    const currentUser = users.find(
      (item) => item.id_dec === operator_id || item.id_hex === operator_id
    );
    if (currentUser) {
      const token = jwt.sign({ operator_id }, SECRET_KEY, { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: false, secure: false });
      res.status(200).json(currentUser);
    } else {
      res.status(401).send("Kullanici bulunamadi.");
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//! Oturum tokenını eğer token varsa decoded ettık user ıd yı verı tabanında aradık token varsa ve verı tabanında varsa gerı donus olarak true yolladık.
app.get("/check-login", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ isLoggedIn: false });
  }
  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const userId = decodedToken.operator_id; //? Token'dan operator_id'yi alıyoruz
    const currentUser = await getUserById(userId);
    if (currentUser) {
      res.json({ isLoggedIn: true, currentUser });
    } else {
      res.json({ isLoggedIn: false });
    }
  } catch (err) {
    console.error("Token doğrulama başarısız:", err);
    res.json({ isLoggedIn: false });
  }
});

//! check permission...
app.get("/check-permission", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN" formatını ayıkla
  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim" });
  }
  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, SECRET_KEY);
    const { operator_id } = decoded;

    // Kullanıcının izinlerini al (Kullanıcının ID'si üzerinden)
    const user = await User.findByPk(operator_id, {
      include: {
        model: Role, // Kullanıcının rolünü dahil et
        include: {
          model: Permissions, // Kullanıcının rolüne bağlı izinleri dahil et
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı veya rol bulunamadı" });
    }

    const permissions = user.Role.Permissions.map(
      (permission) => permission.name
    ); 
    return res.status(200).json(permissions); // İzinleri döndür
  } catch (err) {
    console.error("Token doğrulama hatası:", err); // Hata logu
    return res.status(403).json({ message: "Geçersiz token" });
  }
});

// //! Logout endpoint
app.post("/logout", async (req, res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: false,
  });
  res.status(200).json({ message: "Logout successful" });
});

//! mola sebeblerini dönen metot...
app.get("/breakReason", async (req, res) => {
  try {
    const break_reason = await getBreakReason();
    res.status(200).json(break_reason);
  } catch (err) {
    console.error("Error fetching stop reasons", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/createBreak", async (req, res) => {
  try {
    const startLog = req.body;
    const currentDateTimeOffset = new Date().toISOString(); // Bu değeri her istekte belirliyoruz Global olarak verınce her sey degısıyor.
    const breakLog = await getIsUserOnBreak(startLog, currentDateTimeOffset);
    res.status(200).json(breakLog);
  } catch (err) {
    console.error("Error creating break", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//! Moladaki kullanıcıları dönen metot...
app.get("/getBreakOnUsers", async (req, res) => {
  const { areaName } = req.query;
  try {
    const result = await onBreakUsers(areaName);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
    throw err;
  }
});

//! Molayı bitirecek metot...
app.post("/returnToBreak", async (req, res) => {
  console.log("x")
  const { operator_id, end_time } = req.body;
  console.log("Received request to return from break:", operator_id, end_time);
  try {
    const result = await returnToBreak({
      operator_id,
      end_time,
      currentDateTimeOffset,
    });
    console.log("Update result:", result); // Güncellenen kayıt sayısını kontrol etmek için
    if (result === 0) {
      res.status(404).json({ message: "Moladan donus işlemi başarisiz" });
    } else if (result > 0) {
      res.status(200).json({ message: "Moladan dönüş işlemi başarili." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! Durdurma sebeblerini getırecek metot url ye gore...
app.post("/getStopReason", async (req, res) => {
  const { area_name } = req.body;
  try {
    const result = await getStopReason({ area_name });
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting stop reasons:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! iptal sebeblerini getirecek query..
app.get("/getCancelReason", async (req, res) => {
  const { area_name } = req.query;
  try {
    const result = await getCancelReason({ area_name });
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting stop reasons:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! Seçili işi iptal edecek fonksiyon
app.post("/cancelWork", async (req, res) => {
  const { uniq_id, currentUser } = req.body;
  try {
    const result = await cancelWork({
      uniq_id,
      currentDateTimeOffset,
      currentUser,
    });
    if (result) {
      res.status(200).json({ message: "İş silme işlemi başarılı..." });
    } else {
      res.status(404).json({ message: "İş bulunamadı..." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Sunucu hatası. İş silinemedi." });
  }
});

//! Tamir sebeplerini getirecek query..
app.get("/getRepairReason", async (req, res) => {
  const { area_name } = req.query;
  try {
    const result = await getRepairReason({ area_name });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting stop reasons:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! Bölüme göre process turlerını getırecek query
app.get("/getProcessTypes", async (req, res) => {
  const { area_name } = req.query;
  try {
    const result = await getProcessList({ area_name });
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting stop reasons:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! İlgili makine bilgilerini getirecek query...
app.get("/getMachineList", async (req, res) => {
  const { area_name } = req.query;
  try {
    const result = await getMachineList({ area_name });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! Okutulan siparişi cekecek servis
app.get("/getOrder", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await getOrder({ id });
    if (result.dataValues) {
      res.status(200).json(result.dataValues);
    } else {
      res.status(404).json({ message: "Sipariş no bulunamadı." });
    }
  } catch (err) {
    console.error("Sipariş alınırken hata:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! work_log tablosunda yani bir iş başlatacak metot...
app.post("/createWorkLog", async (req, res) => {
  const currentDate = new Date();
  const currentDateTimeOffset = currentDate.toISOString();

  const { work_info, field } = req.body;
  console.log(work_info)
  try {
    let result;
    if (work_info.area_name === "cekic") {
      result = await createCekicWorkLog({
        work_info,
        currentDateTimeOffset,
        field,
      });
    } else {
      result = await createWork({ work_info, currentDateTimeOffset });
    }
    res.status(200).json({ message: "İş başlatma işlemi başarılı", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error." });
    console.error(err);
  }
});

//! Mevcut işleri getirecek metot...
app.get("/getWorks", async (req, res) => {
  const { area_name, user_id_dec } = req.query;
  console.log(area_name);
  try {
    // Kullanıcının kendi işleri (aktif)
    const userWorks = await getWorks({ area_name, user_id_dec });

    // Belirli bir area_name ile durdurulmuş tüm işler
    const stoppedWorks = await getStoppedWorks({ area_name });

    // Kullanıcının işleri ile durdurulmuş işleri birleştir
    const allWorks = [...userWorks, ...stoppedWorks];

    res.status(200).json(allWorks);
  } catch (err) {
    res.status(500).json({ message: "Internal server error." });
    throw err;
  }
});

//! Aktif bir işi durduracak metot
app.post("/stopSelectedWork", async (req, res) => {
  const { order_id, stop_reason_id, work_log_uniq_id, user_who_stopped } =
    req.body;
  const currentDateTimeOffset = new Date().toISOString();
  console.log(req.body);
  try {
    const result = await stopWork({
      work_log_uniq_id,
      currentDateTimeOffset,
      order_id,
      stop_reason_id,
      user_who_stopped,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
});

//! Durdurulan bir işi tekrardan baslatacak metot...
app.post("/restartWork", async (req, res) => {
  const { work_log_uniq_id, currentUser, startedUser, selectedOrder } =
    req.body;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const result = await rWork({
      currentDateTimeOffset,
      work_log_uniq_id,
      currentUser,
      startedUser,
      selectedOrder,
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

//! Siparişi bitirecek metot...
app.post("/finishedWork", async (req, res) => {
  const {
    uniq_id,
    produced_amount,
    work_finished_op_dec,
    repair_amount,
    scrap_amount,
    repair_reason,
    scrap_reason,
    repair_reason_1,
    repair_reason_2,
    repair_reason_3,
    repair_reason_4,
    repair_section,
    end_desc,
  } = req.body;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    const result = await finishedWork({
      uniq_id,
      currentDateTimeOffset,
      produced_amount,
      work_finished_op_dec,
      repair_amount,
      scrap_amount,
      repair_reason,
      scrap_reason,
      repair_reason_1,
      repair_reason_2,
      repair_reason_3,
      repair_reason_4,
      repair_section,
      end_desc,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Internal server error." });
    throw err;
  }
});

//? Süreçler ile ilgili servisler aşağıda......................................................................
app.use("/api/leave", leaveRoutes);

//? Kullanıcılar ile ilgili servisler
app.use("/api/user", userRoutes);

//? Order ıslemlerı ıle ılgılı rotalar (sipariş olustur iptal güncelle vs. bütün iş birimlerinin servislerini içerebilir.)
app.use("/api/order", orderRoutes);

app.use("/api/shift",shiftRoutes);

module.exports = {SECRET_KEY}