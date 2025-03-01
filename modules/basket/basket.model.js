const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");

const Basket = sequelize.define('basket', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    user_id: { type: DataTypes.UUID, allowNull: false },
}, {
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true
});

module.exports = Basket;
