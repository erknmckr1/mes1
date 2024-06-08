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
  createUser
} = require("../api/userOperations/userAuthOperations");
const {
  getBreakReason,
  getIsUserOnBreak,
  returnToBreak,
  onBreakUsers,
  getBreakReasonLog
} = require("../api/breakOperations");
const getStopReason = require('../api/stopReasonOperation')
const {getCancelReason,getRepairReason} = require('../api/orderOperations');

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000", // Burada uygun origin'i belirleyin
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
    const currentUser = users.find((item) => item.id_dec === operator_id);
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
     console.log(break_reason)
   } catch (err) {
     console.error("Error fetching stop reasons", err);
     res.status(500).json({ message: "Internal server error" });
   }
 });

 //! Mola olusturacak motot...
 app.post("/createBreak", async (req, res) => {
   try {
     const startLog = req.body;
     console.log(startLog);
     const breakLog = await getIsUserOnBreak(startLog);
     res.status(200).json(breakLog);
   } catch (err) {
     console.error("Error creating break", err);
     res.status(500).json({ message: "Internal server error" });
   }
 });

 //! Moladaki kullanıcıları dönen metot...
 app.get("/getBreakOnUsers", async (req, res) => {
   try {
     const result = await onBreakUsers();
     res.status(200).json(result);
   } catch (err) {
     res.status(500).json({ message: "Internal server error" });
     throw err;
   }
 });

 //! Molayı bitirecek metot...
 app.post("/returnToBreak", async (req, res) => {
   const { operator_id, end_time } = req.body;
   try {
     const result = await returnToBreak({ operator_id, end_time });
     if(result === 0 ) {
      res.status(404).json({message:"Moladan donus işlemi başarisiz"})
     }else if (result === 1) {
      res.status(200).json({message:"Moladan dönüş işlemi başarili."})
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
    console.error('Error getting stop reasons:', err);
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
    console.error('Error getting stop reasons:', err);
    res.status(500).json({ message: "Internal server error." });
  }
});

//! Tamir sebeplerini getirecek query..
app.get("/getRepairReason",async(req,res)=>{
  const {area_name} = req.query;
  try {
    const result = await getRepairReason({area_name});
    res.status(200).json(result)
  } catch (error) {
    console.error('Error getting stop reasons:', err);
    res.status(500).json({ message: "Internal server error." });
  }
})