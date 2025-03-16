const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");
const { User } = require("../user/user.model");

const Role =  sequelize.define('Role',{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: false },
    },{
        freezeTableName: true,
        timestamps: false
    });

const Permission = sequelize.define('Permission',{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: false },
    },{
        freezeTableName: true,
        timestamps: false
    })

const RolePermission = sequelize.define('RolePermission',{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    permissionId: { type: DataTypes.INTEGER, allowNull: false },
    },{
        freezeTableName: true,
        timestamps: false
    })

const UserRole = sequelize.define('UserRole',{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    },{
        freezeTableName: true,
        timestamps: false
});

User.belongsToMany(Role,{ through: 'UserRole', foreignKey: 'userId', otherKey: 'roleId' });
Role.belongsToMany(User,{ through: 'UserRole', foreignKey: 'roleId', otherKey: 'userId' });

Role.belongsToMany(Permission,{through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId'});
Permission.belongsToMany(Role, {through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId'});

// Role.sync({alter: true, force: false})

module.exports = { Role, Permission, RolePermission, UserRole };