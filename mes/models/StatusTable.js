const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const StatusTable = sequelize.define(
  "Status_Table",
  {
    status_uniq_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status_desc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "status_table",
    timestamps:false
  }
);

module.exports = StatusTable
