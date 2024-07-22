const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const LeaveRecords = sequelize.define(
  "LeaveReacors",
  {
    leave_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    leave_uniq_id:{
        type:DataTypes.STRING,
        allowNull:false
    },
    op_username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    auth2: {
      type: DataTypes.TEXT, 
      allowNull: true,
    },
    auth1: {
      type: DataTypes.TEXT, 
      allowNull: true,
    },
    id_dec: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leave_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    leave_creation_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    leave_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    leave_end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    leave_approve_date:{
      type:DataTypes.DATE,
      allowNull:true
    },
    leave_cancel_date:{
      type:DataTypes.DATE,
      allowNull:true
    },
    user_who_cancelled:{
      type:DataTypes.STRING,
      allowNull:true,
    },
    leave_reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    approving_person: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leave_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leave_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "leave_records",
    timestamps: false,
  }
);

module.exports = LeaveRecords;
