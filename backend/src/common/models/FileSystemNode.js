const { DataTypes } = require('sequelize');

const FileSystemNodeModel = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('file', 'folder'),
    allowNull: false,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
};

module.exports = (sequelize) => sequelize.define('fileSystemNode', FileSystemNodeModel, {
  indexes: [
    {
      unique: true,
      fields: ['parentId', 'name'],
    },
    {
      fields: ['parentId'],
    },
    {
      fields: ['name'],
    },
    {
      fields: ['type', 'name'],
    },
  ],
});

