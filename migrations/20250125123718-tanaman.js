'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tanaman', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      lokasi: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      foto: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      qrcode: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tanaman');
  },
};
