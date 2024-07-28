require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mssql", // Dialect burada sabit
    dialectModule: require("tedious"),
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
        server: process.env.DB_SERVER,
      },
    },
  }
);

module.exports = sequelize;
