const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");

const MeasureData = sequelize.define(
    "MeasurementTable",
    {
        order_no: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'Sipariş No'
        },
        material_no: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'Malzeme No'
        },
        operator: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'Operator'
        },
        area_name: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'Bölüm'
        },
        entry_measurement: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: 'Giriş Ölçüsü'
        },
        exit_measurement: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: 'Çıkış Ölçüsü'
        },
        entry_weight_50cm: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: '50cm İçin Giriş Gramajı'
        },
        exit_weight_50cm: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: '50cm İçin Çıkış Gramajı'
        },
        data_entry_date: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'Veri Giriş Tarihi'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'Açıklama'
        },
        measurement_package: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: 'Ölçüm Paketi'
        }
      }, {
        tableName: 'measurement_data',
        timestamps: false
      }
);

module.exports = MeasureData