const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");


const Otp = sequelize.define("Otp",{
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4},
    code: {type: DataTypes.INTEGER},
    expires_in: {type: DataTypes.DATE},
    user_id: {type: DataTypes.UUID, references: {
        model: "User",
        key: "id"
    }}
},{
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: false,
    freezeTableName: true,
    indexes: [{fields:['id','code']}]
})


const User = sequelize.define("User",{
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4},
    fullname: {type: DataTypes.STRING},
    mobile: {type: DataTypes.STRING, allowNull: false},
},{
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    indexes: [{fields: ['id','mobile']}]
})

User.hasOne(Otp,{foreignKey: 'user_id', sourceKey: 'id', as: 'otp'});
Otp.belongsTo(User,{foreignKey: 'user_id', targetKey: 'id'})

// User.sync({alter:true});
// Otp.sync({alter:true});

module.exports = {
    User,
    Otp
}