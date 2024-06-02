const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const BreakLog = sequelize.define('BreakLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  break_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    references: {
      model: 'BreakReason', // Referans model
      key: 'break_reason_id'
    }
  },
  operator_id: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATE
  },
  section: {
    type: DataTypes.TEXT
  },
  area_name: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'break_log',
  timestamps: false,
  hooks: {
    beforeCreate: (breakLog, options) => {
      breakLog.start_date = new Date(); // Güncel tarihi start_date alanına ayarlayın
    }
  }
});

// Yabancı anahtar ilişkisini tanımlayın
BreakLog.associate = function(models) {
  BreakLog.belongsTo(models.BreakReason, {
    foreignKey: 'break_reason_id',
    as: 'breakReason'
  });
};

module.exports = BreakLog;
