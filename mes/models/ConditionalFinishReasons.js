const {DataTypes} = require('sequelize');
const sequelize = require("../lib/dbConnect");

const ConditionalFinishReason = sequelize.define(
    'ConditionalFinishReason',
    {
        c_finish_id:{
            type:DataTypes.STRING,
            allowNull:false,
            primaryKey:true
        },
        condition_reason:{
            type:DataTypes.STRING,
            allowNull:true,
        }
    },
    {
        tableName:"conditional_finish_reason",
        timestamps:false
    }
);

module.exports = ConditionalFinishReason