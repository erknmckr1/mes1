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
  op_username: {
    type: DataTypes.STRING,
    allowNull: true
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
  field: {
    type: DataTypes.STRING,
    allowNull: true
  },
  work_status: {
    type: DataTypes.STRING(1),
    allowNull: false
  },
  produced_amount:{
    type:DataTypes.STRING,
    allowNull:true
  },
  production_amount:{
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
    type:DataTypes.TEXT,
    allowNull:true
  },
  repair_reason_1:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_reason_2:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_reason_3:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_reason_4:{
    type:DataTypes.STRING,
    allowNull:true
  },
  repair_section:{
    type:DataTypes.STRING,
    allowNull:true,
  },
  scrap_reason:{
    type:DataTypes.STRING,
    allowNull:true
  },
  work_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  work_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  setup_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  setup_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  work_finished_op_dec:{
    type:DataTypes.STRING,
    allowNull:true
  },
  process_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  process_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  machine_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  repair_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  cancel_user_id_dec: {
    type: DataTypes.STRING,
    allowNull: true
  },
  setup_start_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  setup_end_id: {
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
  },
  end_desc:{
    type:DataTypes.STRING,
    allowNull:true
  },
  group_no:{
    type:DataTypes.STRING,
    allowNull:true
  },
  conditional_finish:{
    type:DataTypes.STRING,
    allowNull:true
  },
  group_record_id:{
    type:DataTypes.STRING,
    allowNull:true
  },
  old_code:{
    type:DataTypes.STRING,
    allowNull:true
  },
  product_count:{
    type:DataTypes.INTEGER,
    allowNull:true
  }
}, {
  tableName: 'work_log',
  timestamps: false
});

module.exports = WorkLog;
