const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const LeaveReasons = sequelize.define(
  "LeaveReason",
  {
    leave_reason_id: {
      type: DataTypes.STRING(6),
      allowNull: false,
      primaryKey: true,
    },
    leave_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "leave_reasons",
    timestamps: false,
  }
);

module.exports =  LeaveReasons ;
