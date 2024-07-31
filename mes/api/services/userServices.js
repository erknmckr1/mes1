const User = require("../../models/User");
const dotenv = require("dotenv");
dotenv.config();

async function getAllUsers() {
    try {
        const result = await User.findAll();

        if (!result || result.length === 0) {
            return { status: 404, message: "Kullanıcı bulunamadı." };
        }

        return { status: 200, message: result };
    } catch (err) {
        console.log(err);
        return { status: 500, message: "Sunucu hatası." };
    }
}

module.exports = { getAllUsers };
