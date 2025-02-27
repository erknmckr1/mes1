const { DataTypes } = require("sequelize");
const sequelize = require("../lib/dbConnect");
const User = require("../models/User")
const SectionParticiptionLogs = sequelize.define("SectionParticiptionLogs", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  operator_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  op_name:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  section:{
    type:DataTypes.STRING,
    allowNull:true
  },
  area_name:{
    type:DataTypes.STRING,
    allowNull:true
  },
  field:{
    type:DataTypes.STRING,
    allowNull:true
  },
  machine_name:{
    type:DataTypes.STRING,
    allowNull:true
  },
  join_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  exit_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
},{
    timestamps:false,
    tableName:"section_particiption_logs"
});

// İD İLİŞKİSİ
SectionParticiptionLogs.belongsTo(User, { 
  foreignKey: 'operator_id', 
  targetKey: 'id_dec',
  as: 'user' 
});

module.exports = SectionParticiptionLogs
