const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const BreakReason = sequelize.define('BreakReason', {
  break_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    primaryKey: true,
  },
  break_reason: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'break_reason',
  timestamps: false
});

module.exports = BreakReason;
