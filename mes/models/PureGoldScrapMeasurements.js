const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const PureGoldScrapMeasurements = sequelize.define(
  "PureGoldScrapMeasurements",
  {
    scrapMeasurement_id: {
      type: DataTypes.INTEGER, // Otomatik artan ID için INTEGER kullanılır
      allowNull: false,
      primaryKey: true,
      autoIncrement: true, // Bu özellik ID'nin otomatik artmasını sağlar
    },
    order_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    operator: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entry_measurement: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gold_setting: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    exit_measurement: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gold_pure_scrap:{
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    measurement_diff: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "gold_scrap_measurements",
    timestamps: true,
  }
);

module.exports = PureGoldScrapMeasurements;
