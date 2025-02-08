const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tanaman extends Model {}

  Tanaman.init(
    {
      nama: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      lokasi: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      foto: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      qrcode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'tanaman',
      tableName: 'tanaman',
      timestamps: true,
    }
  );

  return Tanaman;
};
