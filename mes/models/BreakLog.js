const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const BreakLog = sequelize.define('BreakLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  break_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  operator_id: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE
  },
  section: {
    type: DataTypes.TEXT
  },
  area_name: {
    type: DataTypes.TEXT
  },op_name: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'break_log',
  timestamps: false,
});

module.exports = BreakLog;
