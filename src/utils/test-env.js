const config = require("../config/config");

console.log("=== CONFIG CHECK ===");
console.log(
  "BINANCE_API_KEY:",
  config.BINANCE.API_KEY ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "BINANCE_SECRET_KEY:",
  config.BINANCE.SECRET_KEY ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "TELEGRAM_BOT_TOKEN:",
  config.TELEGRAM.BOT_TOKEN ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "TELEGRAM_CHAT_ID:",
  config.TELEGRAM.CHAT_ID ? "✅ SET" : "❌ NOT SET"
);
console.log("TELEGRAM_IS_ENABLED:", config.TELEGRAM.IS_ENABLED);
console.log("IS_LOG_ENABLED:", config.LOGGING.IS_ENABLED);
console.log("IS_DEV_MODE:", config.LOGGING.IS_DEV_MODE);

// Kiểm tra xem có thiếu gì không
const missingVars = [];

if (!config.BINANCE.API_KEY) missingVars.push("BINANCE_API_KEY");
if (!config.BINANCE.SECRET_KEY) missingVars.push("BINANCE_SECRET_KEY");
if (!config.TELEGRAM.BOT_TOKEN) missingVars.push("TELEGRAM_BOT_TOKEN");
if (!config.TELEGRAM.CHAT_ID) missingVars.push("TELEGRAM_CHAT_ID");

if (missingVars.length > 0) {
  console.log("\n❌ THIẾU CÁC BIẾN MÔI TRƯỜNG:", missingVars.join(", "));
  console.log("💡 Vui lòng kiểm tra file .env");
} else {
  console.log("\n✅ TẤT CẢ BIẾN MÔI TRƯỜNG ĐÃ ĐƯỢC CẤU HÌNH!");
}
