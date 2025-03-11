const express = require("express");
const router = express.Router();
const { getAllUsers, getUserWithId } = require("../services/userServices");
const User = require("../../models/User");
const Permissions = require("../../models/Permissions");
const Role = require("../../models/Roles");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const {
  getBreakReason,
  getIsUserOnBreak,
  returnToBreak,
  onBreakUsers,
} = require("../services/breakOperations");
const SECRET_KEY = crypto.randomBytes(32).toString("hex");
const currentDateTimeOffset = new Date().toISOString();
//! Gelen operator_id (veri tabanında id_dec) ile kullanıcı eşleştirmesi yapıp cookie ye token olusturan metot
router.post("/login", async (req, res) => {
  const { operator_id } = req.body;
  console.log(SECRET_KEY);
  try {
    const currentUser = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: operator_id }, { id_hex: operator_id }],
      },
    });
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
router.get("/check-login", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ isLoggedIn: false });
  }
  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const userId = decodedToken.operator_id; //? Token'dan operator_id'yi alıyoruz
    const currentUser = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: userId }, { id_hex: userId }],
      },
    });
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
router.get("/check-permission", async (req, res) => {
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
router.post("/logout", async (req, res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: false,
  });
  res.status(200).json({ message: "Logout successful" });
});

//! mola sebeblerini dönen metot...
router.get("/breakReason", async (req, res) => {
  try {
    const break_reason = await getBreakReason();
    res.status(200).json(break_reason);
  } catch (err) {
    console.error("Error fetching stop reasons", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//! Kullanıcı molası olusturacak route...
router.post("/createBreak", async (req, res) => {
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
router.get("/getBreakOnUsers", async (req, res) => {
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
router.post("/returnToBreak", async (req, res) => {
  const { operator_id, end_time } = req.body;
  try {
    const result = await returnToBreak({
      operator_id,
      end_time,
      currentDateTimeOffset,
    });
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

//! Tüm kullanıcıları cekecek route
router.get("/getAllUsers", async (req, res) => {
  const result = await getAllUsers();
  return res.status(result.status).json(result.message);
});

//! Kullanıcı izinlerini alacak route
router.get("/:userId/permissions", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
      include: {
        model: Role, // include: İlişkili tabloları birleştirir (JOIN)
        include: {
          // İç içe include ile önce Role, sonra Permissions tablosunu birleştirir
          model: Permissions, // Yani: Users -> Roles -> Permissions şeklinde ilişkileri takip eder  Örnek çıktı: ["create_user", "edit_user", "delete_user"]
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const permissions = user.Role.Permissions.map(
      (permission) => permission.name
    ); // Bulunan kullanıcının rolündeki tüm izinleri alır. Sadece izin isimlerini içeren bir array'e dönüştürür.
    return res.status(200).json(permissions);
  } catch (error) {
    console.error("Kullanıcı izinleri alınırken hata oluştu:", error);
    res.status(500).json({ message: "İç sunucu hatası." });
  }
});

//! İd ye göre kullanıcı olusturacak route
router.get("/:userId/getuserinfo", async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  const result = await getUserWithId(userId);
  return res.status(result.status).json(result.message);
});

module.exports = router;
