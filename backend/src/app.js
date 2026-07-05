const express = require('express');
const sequelize = require('./common/database');
const defineFileSystemNode = require('./common/models/FileSystemNode');
const itemRoutes = require('./routes/items');

const app = express();
const FileSystemNode = sequelize.models.fileSystemNode || defineFileSystemNode(sequelize);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use('/', itemRoutes);

app.get('/status', (req, res) => {
  res.json({
    status: 'Running',
    timestamp: new Date().toISOString(),
    database: 'Connected',
  });
});

app.locals.models = {
  FileSystemNode,
};

module.exports = app;
