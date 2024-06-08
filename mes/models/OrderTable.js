const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const OrderTable = sequelize.define(
  "OrderTable",
  {
    ORDER_ID: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    ORDER_SEND_STATUS: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    PRODUCTION_AMOUNT: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    MATERIAL_NO: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    GENERAL_DESCRIPTION: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ITEM_DESCRIPTION: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    COLOR: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    CARAT: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    OLD_CODE: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    MATERIAL_DESCRIPTION: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    TARIH: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    SAAT: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    KULLANICI: {
      type: DataTypes.STRING(12),
      allowNull: false,
    },
    SIPARIS_TURU: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "order_table_sap_thingworx",
    timestamps: false,
  }
);

module.exports = OrderTable;
