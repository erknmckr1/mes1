const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect"); // Veritabanı bağlantısını içe aktarın
const User = require("../models/User")
const ShiftLog = sequelize.define(
  "ShiftLog",
  {
    shift_uniq_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    created_by: {
      // Mesaiyi oluşturan kişi
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelled_by: {
      // Mesaiyi oluşturan kişi
      type: DataTypes.STRING,
      allowNull: true,
    },
    approved_by: {
      // Mesaiyi oluşturan kişi
      type: DataTypes.STRING,
      allowNull: true,
    },
    opproved_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    operator_id: {
      // Mesaide kalacak kişinin ID'si
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_date: {
      // Mesai başlangıç günü
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      // Mesai bitiş günü
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      // Mesai başlangıç saati
      type: DataTypes.STRING,
      allowNull: false,
    },
    end_time: {
      // Mesai bitiş saati
      type: DataTypes.STRING,
      allowNull: false,
    },
    shift_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "shift_log_table",
    timestamps: false,
  }
);

module.exports = ShiftLog;
