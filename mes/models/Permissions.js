const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'permissions',
  timestamps: false
});

module.exports = Permission;
