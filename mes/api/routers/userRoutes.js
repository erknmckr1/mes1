const express = require("express");
const router = express.Router();
const { getAllUsers, getUserWithId } = require("../services/userServices");
const User = require("../../models/User");
const Permissions = require("../../models/Permissions");
const Role = require("../../models/Roles");
const jwt = require("jsonwebtoken");
const {SECRET_KEY} = require("../../server/server")
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