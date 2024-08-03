const { DataTypes } = require('sequelize');
const sequelize = require('../lib/dbConnect');

const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: false
});

// Her rol bırden fazla ızne sahip olabilir ve her izin birden fazla rol tarafından kullanilabilir. 
// Bu ilişki, Role ve Permission tabloları arasında "many-to-many" bir ilişkidir ve bu ilişkiyi yönetmek için bir ara tablo (RolePermission) kullanılır.

module.exports = RolePermission;
