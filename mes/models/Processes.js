const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect');

const Processes = sequelize.define('Processes', {
  process_id: {
    type: DataTypes.STRING(6),
    allowNull: false,
    primaryKey: true,
    defaultValue: sequelize.literal("to_char(nextval('process_id_seq'::regclass), 'FM000000'::text)")
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
  timestamps: false // createdAt ve updatedAt sütunları otomatik olarak eklenmez
});

module.exports = Processes;
