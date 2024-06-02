const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); // db connectiion

const User = sequelize.define('User', {
  id_dec: {
    type: DataTypes.STRING(255),
    allowNull: false, // null degere ızın verılmeyecek... 
    primaryKey: true
  },
  id_hex: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  op_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  op_username: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  is_admin: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  op_password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  op_section: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  part: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  auth2: {
    type: DataTypes.JSON,
    allowNull: true
  },
  auth1: {
    type: DataTypes.JSON,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  e_mail: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  shift_validator: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  short_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  stop_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  izin_bakiye: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false
  }
}, {
  tableName: 'operator_table', // Veritabanı tablosu adı
  timestamps: false // Sequelize createdAt ve updatedAt sütunlarını otomatik olarak eklemez
});

module.exports = User;
