const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const StoppedWorksLogs = sequelize.define(
  "StoppedWorksLogs",
  {
    work_log_uniq_id: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stop_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stop_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    total_stop_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stop_reason_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_who_stopped:{
      type:DataTypes.STRING,
      allowNull:true,
    },
    user_who_started:{
      type:DataTypes.STRING,
      allowNull:true
    },
    group_record_id:{
      type:DataTypes.STRING,
      allowNull:true
    },
    area_name:{
      type:DataTypes.STRING,
      allowNull:true
    }
  },
  {
    tableName: "stopped_works_log",
    timestamps: false,
  }
);

module.exports = StoppedWorksLogs;
