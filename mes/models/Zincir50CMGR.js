    const sequelize = require('../lib/dbConnect'); 
    const {DataTypes} = require('sequelize')

    const Zincir50CMGR = sequelize.define('Zincir50CMGR', {
    materialCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    weight_50cm: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    lowerLimit: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    upperLimit: {
        type: DataTypes.FLOAT,
        allowNull: true,
    }
    }, {
    tableName: 'zincir_50cm_gr',
    timestamps: false,
    });

    module.exports = Zincir50CMGR;
