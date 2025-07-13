// Load environment variables từ file .env
require("dotenv").config();

module.exports = {
  BINANCE: {
    API_KEY: process.env.BINANCE_API_KEY || "",
    SECRET_KEY: process.env.BINANCE_SECRET_KEY || "",
  },
  TELEGRAM: {
    IS_ENABLED: process.env.TELEGRAM_IS_ENABLED === "true",
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
    CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
  },
  LOGGING: {
    IS_ENABLED: process.env.IS_LOG_ENABLED === "true",
    IS_DEV_MODE: process.env.IS_DEV_MODE === "true",
  },
};
