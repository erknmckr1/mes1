const express = require("express");
const app = express();
const port = process.env.PORT || 3003;
const cors = require("cors");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const {
  getAllUser,
  getUserById,
} = require("../api/userOperations/userAuthOperations");
const {
  getBreakReason,
  getIsUserOnBreak,
  returnToBreak,
  onBreakUsers,
} = require("../api/breakOperations");

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000", // Burada uygun origin'i belirleyin
  credentials: true, // Credentials (cookies, authorization headers vs.) ile isteklere izin ver
  methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP metodları
};

app.use(cors(corsOptions));
const SECRET_KEY = crypto.randomBytes(32).toString("hex");

//! Gelen operator_id (veri tabanında id_dec) ile kullanıcı eşleştirmesi yapıp cookie ye token olusturan metot
app.post("/login", async (req, res) => {
  const { operator_id } = req.body;
  try {
    const users = await getAllUser();
    const currentUser = users.find((item) => item.id_dec === operator_id);
    if (currentUser) {
      const token = jwt.sign({ operator_id }, SECRET_KEY, { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: true, secure: false }); // cookie olarak kaydet...
      res.status(200).json({ currentUser });
    } else {
      res.status(401).send("Kullanici bulunamadi.");
    }
  } catch (err) {
    console.error("Login işlemi sırasında hata:", err);
    res.status(500).send("Sunucu hatası.");
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
    const userId = decodedToken.operator_id;
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

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});

//! Logout endpoint
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
  console.log(operator_id)
  try {
    const result = await returnToBreak({ operator_id, end_time });
    res.status(200).json("Moladan dnüş işlemi başarılı...");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
});
