const sequelize = require('../lib/dbConnect')
const User = require('./User')
const BreakLog = require('./BreakLog')
const BreakReason = require('./BreakReason')
const CancelReason = require('./CancelReason')
const Processes = require('./Processes')
const StopReason = require('./StopReason')
const RepairReason = require('./RepairReason')
const OrderTable = require("./OrderTable")
const Machines = require("./Machines")
const WorkLog = require("./WorkLog")
const StoppedWorksLogs = require("./StoppedWorksLog")
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
    StoppedWorksLogs

}

// Tüm modelleri senkronize edin
const syncModels = async () => {
    try {
      await sequelize.sync({ alter: false });
      console.log('All models were synchronized successfully.');
    } catch (error) {
      console.error('Unable to synchronize the models:', error);
    }
  };
  
  module.exports = {
    ...models,
    sequelize,
    syncModels
  };