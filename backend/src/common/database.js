const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const storageDirectory = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDirectory, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(storageDirectory, 'data.db'),
});

module.exports = sequelize;

