const app = require('./app');
const sequelize = require('./common/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await sequelize.sync();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
