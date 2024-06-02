const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); 

const CancelReason = sequelize.define('CancelReason', {
  cancel_reason_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    primaryKey: true,
  },
  section: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  cancel_reason_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  area_name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'cancel_reason_table',
  timestamps: false,
  hooks: {
    beforeCreate: async (cancelReason, options) => {
      // En yüksek mevcut cancel_reason_id'yi bul
      const maxIdResult = await CancelReason.findOne({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('cancel_reason_id')), 'maxId']
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

      cancelReason.cancel_reason_id = newId;
    }
  }
});

module.exports = CancelReason;
