require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  'MES',
  'sa',
  'PWork2024!',
  {
    host: "192.168.3.5",
    dialect: "mssql", // Dialect burada belirtiliyor
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
        server: "192.168.3.5",
      },
    },
  }
);

module.exports = sequelize;
