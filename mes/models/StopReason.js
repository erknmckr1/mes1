const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect"); // Veritabanı bağlantınızı doğru yoldan dahil edin

const StopReason = sequelize.define(
  "StopReason",
  {
    stop_reason_id: {
      type: DataTypes.STRING(6),
      allowNull: false,
      primaryKey: true,
    },
    section: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    stop_reason_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    area_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "stop_reason_table",
    timestamps: false,
  }
);

module.exports = StopReason;
