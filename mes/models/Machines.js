const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const Machines = sequelize.define(
  "Machine",
  {
    machine_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    machine_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    area_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    process_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    machine_barcode:{
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    tableName: "machines_table",
    timestamps: false,
  }
);

module.exports = Machines;
