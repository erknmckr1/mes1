const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Veritabanı bağlantınızı doğru yoldan dahil edin

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
  timestamps: false,
  hooks: {
    beforeCreate: async (breakReason, options) => {
      // En yüksek mevcut break_reason_id'yi bul
      const maxIdResult = await BreakReason.findOne({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('break_reason_id')), 'maxId']
        ],
        raw: true
      });

      let maxId = maxIdResult.maxId;
      let newId = '000001'; // Başlangıç ID değeri

      if (maxId) {
        // Mevcut en yüksek ID'yi bir artır ve 6 haneli stringe çevir
        let numericId = parseInt(maxId, 10) + 1;
        newId = numericId.toString().padStart(6, '0');
      }

      breakReason.break_reason_id = newId;
    }
  }
});

module.exports = BreakReason;
