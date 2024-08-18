const sequelize = require('../lib/dbConnect'); 
const {DataTypes} = require('sequelize')

const GroupRecords = sequelize.define(
"GroupRecords",
{
    group_record_id:{
        type:DataTypes.STRING(5),
        allowNull: false,
        primaryKey: true,
    },
    group_no:{
        type:DataTypes.STRING,
        allowNull: false,
        primaryKey:true
    },
    who_started_group:{
        type:DataTypes.STRING,
        allowNull:false
    },
    group_start_date:{
        type:DataTypes.DATE,
        allowNull:true,    
    },
    group_end_date:{
        type:DataTypes.DATE,
        allowNull:true,    
    },
    group_creation_date:{
        type:DataTypes.DATE,
        allowNull:true,    
    },
    group_status:{
        type:DataTypes.STRING,
        allowNull:false
    },
    process_name:{
        type:DataTypes.STRING,
        allowNull:true
    },
    machine_name:{
        type:DataTypes.STRING,
        allowNull:true
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true
      },
      area_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
},{
    tableName:"order_group_records",
    timestamps: false,
}
);

module.exports = GroupRecords;