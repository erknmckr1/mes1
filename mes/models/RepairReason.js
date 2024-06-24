const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const RepairReason = sequelize.define(
  "RepairReason",
  {
    repair_reason_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    repair_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    section: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    area_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "repair_reason_table",
    timestamps: false,
  }
);


module.exports= RepairReason;
