const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect'); // db connection

const User = sequelize.define('User', {
  id_dec: {
    type: DataTypes.STRING(255),
    allowNull: false, // null değere izin verilmeyecek
    primaryKey: true
  },
  id_hex: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true
  },
  op_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  op_username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  is_admin: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  op_password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  op_section: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  part: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  auth2: {
    type: DataTypes.TEXT, // JSON verileri saklamak için
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('auth2');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('auth2', JSON.stringify(value));
    }
  },
  auth1: {
    type: DataTypes.TEXT, // JSON verileri saklamak için
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('auth1');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('auth1', JSON.stringify(value));
    }
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  e_mail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shift_validator: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  short_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stop_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  izin_bakiye: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: true
  }
}, {
  tableName: 'operator_table', // Veritabanı tablosu adı
  timestamps: false // Sequelize createdAt ve updatedAt sütunlarını otomatik olarak eklemez
});

module.exports = User;
