const {DataTypes} = require('sequelize');
const sequelize = require("../lib/dbConnect");

const WorkStatus = sequelize.define(
    'ConditionalFinishReason',
    {
        work_status:{
            type:DataTypes.STRING,
            allowNull:false,
            primaryKey:true
        },
        work_status_desc:{
            type:DataTypes.STRING,
            allowNull:true,
        }
    },
    {
        tableName:"work_status_list",
        timestamps:false
    }
);

module.exports = WorkStatus