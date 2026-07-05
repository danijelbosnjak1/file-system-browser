const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const storageDirectory = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDirectory, { recursive: true });

const databaseFileName = process.env.NODE_ENV === 'test' ? 'test-data.db' : 'data.db';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(storageDirectory, databaseFileName),
});

module.exports = sequelize;
