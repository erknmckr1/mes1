const pool = require("../../lib/dbConnect");

async function getAllUser() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT * FROM public.operator_table");
    return result.rows;
  } catch (err) {
    console.error("Error fetching data:", err);
    throw err;
  }
};

async function getUserById(userId) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM public.operator_table WHERE operator_id = $1",
      [userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Kullanıcı verisi alınırken hata:", err);
    throw err;
  };
}

module.exports = {
  getAllUser,
  getUserById
};
