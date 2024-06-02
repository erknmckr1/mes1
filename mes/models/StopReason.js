const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Veritabanı bağlantınızı doğru yoldan dahil edin

const StopReason = sequelize.define('StopReason', {
  stop_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    primaryKey: true,
  },
  section: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  stop_reason_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  area_name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'stop_reason_table',
  timestamps: true,
  hooks: {
    beforeCreate: async (stopReason, options) => {
      // En yüksek mevcut stop_reason_id'yi bul
      const maxIdResult = await StopReason.findOne({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('stop_reason_id')), 'maxId']
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

      stopReason.stop_reason_id = newId;
    }
  }
});

module.exports = StopReason;
