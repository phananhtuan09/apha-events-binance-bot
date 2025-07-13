const config = require("../config/config");
const TelegramClient = require("./telegram-client");
const logger = require("../utils/logger");

const telegramClient = new TelegramClient(config.TELEGRAM.BOT_TOKEN);

// Tạo nội dung tin nhắn cho post mới từ Binance Square
function createSquarePostMessage(post) {
  // Giới hạn content chỉ 200 ký tự đầu tiên
  const truncatedContent = post.content
    ? post.content.length > 200
      ? post.content.substring(0, 200) + "..."
      : post.content
    : "N/A";

  const message = `🔔 *Post mới từ Binance Square*

📰 *Tiêu đề:* ${post.title || "N/A"}
⏰ *Thời gian:* ${post.postTime || "N/A"}
🔗 *Link:* ${post.url || "N/A"}

📝 *Nội dung:*
${truncatedContent}

#BinanceSquare #AlphaAirdrop`;

  return message;
}

// Gửi tin nhắn post mới từ Binance Square
async function sendSquarePostMessage(post) {
  if (config.TELEGRAM.IS_ENABLED) {
    try {
      const message = createSquarePostMessage(post);
      await telegramClient.sendMessage(config.TELEGRAM.CHAT_ID, message, {
        parse_mode: "Markdown",
      });
      logger.info(`✅ Đã gửi thông báo post mới: ${post.title}`);
    } catch (error) {
      logger.error(`🚨 Lỗi gửi thông báo post Telegram: ${error}`);
    }
  }
}

// Gửi tin nhắn text thông thường qua Telegram
async function sendTelegramMessage(message) {
  if (config.TELEGRAM.IS_ENABLED) {
    try {
      await telegramClient.sendMessage(config.TELEGRAM.CHAT_ID, message);
      logger.info(
        `✅ Đã gửi tin nhắn Telegram: ${message.substring(0, 50)}...`
      );
    } catch (error) {
      logger.error(`🚨 Lỗi gửi Telegram: ${error}`);
    }
  }
}

// Kiểm tra kết nối tới Telegram bằng cách gọi API getMe()
async function checkTelegramConnection() {
  if (!config.TELEGRAM.IS_ENABLED) {
    return false;
  }
  try {
    const botInfo = await telegramClient.getMe();
    if (botInfo?.username) {
      logger.info(`✅ Đã kết nối Telegram với bot: @${botInfo.username}`);
      return true;
    } else {
      throw new Error("Thông tin bot không hợp lệ");
    }
  } catch (error) {
    logger.error(`🚨 Lỗi kết nối Telegram: ${error}`);
    return false;
  }
}

module.exports = {
  sendSquarePostMessage,
  sendTelegramMessage,
  checkTelegramConnection,
};
