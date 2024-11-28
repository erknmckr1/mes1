const sequelize = require("../lib/dbConnect");
const User = require("./User");
const BreakLog = require("./BreakLog");
const BreakReason = require("./BreakReason");
const CancelReason = require("./CancelReason");
const Processes = require("./Processes");
const StopReason = require("./StopReason");
const RepairReason = require("./RepairReason");
const OrderTable = require("./OrderTable");
const Machines = require("./Machines");
const WorkLog = require("./WorkLog");
const StoppedWorksLogs = require("./StoppedWorksLog");
const KaliteWorkTable = require("./kalite/KaliteWorkTable");
const LeaveReasons = require("./LeaveReasons");
const LeaveRecords = require("./LeaveRecords");
const RolePermission = require("./RolePermissions");
const Permission = require("./Permissions");
const Role = require("./Roles");
const GroupRecords = require("./GroupRecords");
const MeasureData = require("./MeasureData");
const ConditionalFinishReason = require("./ConditionalFinishReasons");
const WorkStatus = require("./WorkStatus");
const Zincir50CMGR = require("./Zincir50CMGR");
const PureGoldScrapMeasurements = require("./PureGoldScrapMeasurements");
const SectionParticiptionLogs = require("./SectionParticiptionLogs")
const ShiftLog = require("./ShiftLog")
const StatusTable = require("./StatusTable")
const models = {
  User,
  BreakLog,
  BreakReason,
  CancelReason,
  Processes,
  StopReason,
  RepairReason,
  OrderTable,
  Machines,
  WorkLog,
  StoppedWorksLogs,
  KaliteWorkTable,
  LeaveReasons,
  LeaveRecords,
  Role,
  Permission,
  RolePermission,
  GroupRecords,
  MeasureData,
  ConditionalFinishReason,
  WorkStatus,
  Zincir50CMGR,
  PureGoldScrapMeasurements,
  SectionParticiptionLogs,
  ShiftLog,
  StatusTable
};

// İlişkileri tanımlama
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });
// User ve Role arasında ilişki tanımlaması 
// Her kullanıcının bir rolü olabilir ve her rol birden fazla kullanıcıya atanabılır.
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// ShiftLog ve User ilişkisi
ShiftLog.belongsTo(User, { foreignKey: "operator_id", targetKey: "id_dec" });
User.hasMany(ShiftLog, { foreignKey: "operator_id", sourceKey: "id_dec" });

// Tüm modelleri senkronize edin
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to synchronize the models:", error);
  }
};

module.exports = {
  ...models,
  sequelize,
  syncModels,
};
