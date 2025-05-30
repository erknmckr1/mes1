const User = require("../../models/User");
const dotenv = require("dotenv");
const { Op } = require("sequelize");
dotenv.config();

//! Tüm kullanıcıları cekecek servis...
async function getAllUsers() {
  try {
    const result = await User.findAll({
      where: {
        is_active: 1,
      },
    });

    if (!result || result.length === 0) {
      return { status: 404, message: "Kullanıcı bulunamadı." };
    }

    return { status: 200, message: result };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası." };
  }
}

//! İd ye göre kullanıcı arayacak servis...
async function getUserWithId(userId) {
  try {
    const result = await User.findOne({
      where: {
        [Op.or]: [{ id_dec: userId }, { id_hex: userId }],
      },
    });

    if (!result) {
      // result boş mu diye kontrol ediyoruz, findOne zaten tek sonuç döndürür
      return { status: 404, message: "Kullanıcı bulunamadı." };
    }

    return { status: 200, message: result };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası." };
  }
}

//! Bölüme göre kullanıcı çekecek servis...
async function getUserWithArea(areaName) {
  try {
    const result = await User.findAll({
      where: {
        part: areaName,
      },
    });

    if (!result || result.length === 0) {
      return { status: 404, message: "Kullanıcı bulunamadı." };
    }

    return { status: 200, message: result };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası." };
  }
}

//! Kullanıcı izinlerini güncelleyecek servis
async function updateLeaveBalance(leaveInputs) {
  try {
    const updatesArray = Object.entries(leaveInputs).map(
      ([id_dec, izin_bakiye]) => ({
        id_dec: id_dec,
        izin_bakiye: parseFloat(izin_bakiye),
      })
    );
    console.log(updatesArray)
    for (const { id_dec, izin_bakiye } of updatesArray) {
      await User.update({ izin_bakiye:izin_bakiye }, { where: { id_dec:id_dec } });
    }
    
    return { status: 200, message: "Tüm uygun kullanıcılar güncellendi." };
  } catch (err) {
    console.log(err);
    return { status: 500, message: "Sunucu hatası." };
  }
}

module.exports = {
  getAllUsers,
  getUserWithId,
  getUserWithArea,
  updateLeaveBalance,
};
