const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/main');

let app;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    await app.init();
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const app = await createApp();
    return app.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    console.error('NestJS Error:', error);
    res.status(500).json({
      success: false,
      message: 'Application error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};