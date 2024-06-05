const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect');

const Processes = sequelize.define('Processes', {
  process_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    primaryKey: true
  },
  section: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  process_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  area_name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'process_table',
  timestamps: false, // createdAt ve updatedAt sütunları otomatik olarak eklenmez
  hooks: {
    beforeCreate: async (process, options) => { 
      // En yüksek mevcut process_id'yi bul
      const maxIdResult = await Processes.findOne({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('process_id')), 'maxId']
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

      process.process_id = newId;
    }
  }
});

module.exports = Processes;
