const User = require("../../models/User");

//! Bütün kullanıcıları getırmek ıcın calısacak query...
async function getAllUser() {
  try {
    const users = await User.findAll();
    return users;
  } catch (err) {
    console.error("Error fetching data:", err);
    throw err;
  }
}

//! İlgili id ye gore kullanıcı arayacak query
const getUserById = async (userId) => {
  try {
    // İlk olarak id_dec ile kullanıcıyı aramayı deniyoruz
    let user = await User.findOne({
      where: {
        id_dec: userId,
      },
    });

    // Eğer kullanıcı bulunamazsa id_hex ile aramayı deniyoruz
    if (!user) {
      user = await User.findOne({
        where: {
          id_hex: userId,
        },
      });
    }

    // Kullanıcı bulunduysa verilerini döndür
    if (user) {
      return user.dataValues;
    } else {
      return null; // Kullanıcı bulunamazsa null döndür
    }
  } catch (err) {
    console.error("Error retrieving user data:", err);
    throw err;
  }
};

//! Add user

const userData = {
  id_dec: "207927465",
  id_hex: "0C64B8A9",
  op_name: "ercakir",
  op_username: "Erkan Mustafa Cakir",
  is_active: 1,
  is_admin: 0,
  op_password: "ercakir7465",
  op_section: "BilgiIslem",
  part: "BilgiIslem",
  title: "Muhendis",
  auth2: [
    {
      id: "",
    },
    {
      id: "",
    },
  ],
  auth1: [
    {
      id: "1782014233",
    },
    {
      id: "0000001",
    },
  ],
  address: "Fevzi Cakmak Mah. Guven Sok. No:32/9 Bahcelievler/Istanbul",
  e_mail: "ecakir@midas.com.tr",
  shift_validator: "1782014233",
  gender: "Erkek",
  short_name: "Er.Ca.",
  route: "Bahcelievler-Şirinevler-Bakirkoy-Yesilkoy",
  stop_name: "Yenibosna",
  izin_bakiye: 10,
};

const createUser = async (userData) => {
  try {
    if (userData.auth1) {
      userData.auth1 = JSON.stringify(userData.auth1);
    }
    if (userData.auth2) {
      userData.auth2 = JSON.stringify(userData.auth2);
    }
    const user = await User.create(userData);
    return user;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAllUser,
  getUserById,
  createUser,
};
