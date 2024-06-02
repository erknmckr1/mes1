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
    const user =await User.findOne({
      where:{
        id_dec : userId
      }
    });
    if (user) {
      return user.dataValues; // user.dataValues ile kullanıcı verilerini döndür
    } else {
      return null; // Kullanıcı bulunamazsa null döndür
    };
  } catch (err) {
    console.error("Error retrieving user data:", err);
    throw err;
  }
}

module.exports = {
  getAllUser,
  getUserById
};
