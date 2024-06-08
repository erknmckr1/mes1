const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const WorkLog = sequelize.define('WorkLog', {
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
    type: DataTypes.STRING,
    allowNull: false
  },
  work_start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  work_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  process_id: {
    type: DataTypes.STRING,
    allowNull: false
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
