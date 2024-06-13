const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const WorkLog = sequelize.define('WorkLog', {
  uniq_id:{
    type:DataTypes.STRING(6),
    allowNull:false,
  },
  user_id_dec: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order_no: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
  area_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  work_status: {
    type: DataTypes.STRING(1),
    allowNull: false
  },
  produced_amount:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_amount:{
    type:DataTypes.STRING,
    allowNull:true
  },
  scrap_amount:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_reason:{
    type:DataTypes.STRING,
    allowNull:true
  },
  scrap_reason:{
    type:DataTypes.STRING,
    allowNull:true
  },
  work_start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  work_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  work_finished_op_dec:{
    type:DataTypes.STRING,
    allowNull:true
  },
  process_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  process_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stop_user_id_dec: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stop_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  repair_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  stop_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stop_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancel_user_id_dec: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cancel_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  cancel_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'work_log',
  timestamps: false
});

module.exports = WorkLog;
