const config = require("./src/config/config");
const logger = require("./src/utils/logger");
const { checkTelegramConnection } = require("./src/services/telegram-service");
const { spawn } = require("child_process");
const path = require("path");

class BotManager {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
    this.squareMonitorProcess = null;
  }

  // Khởi tạo và chạy Square Monitor trong process riêng
  startSquareMonitor() {
    return new Promise((resolve) => {
      logger.info("🔄 Đang khởi động Square Monitor...");

      const squareProcess = spawn(
        "node",
        ["src/bots/binance-square-monitor.js"],
        {
          stdio: "pipe",
          env: process.env,
        }
      );

      this.squareMonitorProcess = squareProcess;

      squareProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          logger.info(`[Square Monitor] ${output}`);
        }
      });

      squareProcess.stderr.on("data", (data) => {
        const error = data.toString().trim();
        if (error) {
          logger.error(`[Square Monitor Error] ${error}`);
        }
      });

      squareProcess.on("close", (code) => {
        if (!this.isShuttingDown) {
          logger.error(`[Square Monitor] Process đã đóng với code: ${code}`);
          // Restart sau 10 giây nếu không phải shutdown
          setTimeout(() => {
            if (!this.isShuttingDown) {
              logger.info("[Square Monitor] Đang restart...");
              this.startSquareMonitor();
            }
          }, 10000);
        }
      });

      squareProcess.on("error", (error) => {
        logger.error(`[Square Monitor] Lỗi process: ${error.message}`);
        // Không reject để không ảnh hưởng đến bot khác
        if (!this.isShuttingDown) {
          setTimeout(() => {
            logger.info("[Square Monitor] Đang thử restart sau lỗi...");
            this.startSquareMonitor();
          }, 10000);
        }
      });

      // Đợi một chút để kiểm tra process có khởi động thành công không
      setTimeout(() => {
        if (squareProcess.pid) {
          this.processes.push(squareProcess);
          logger.info("✅ Square Monitor đã khởi động thành công");
          resolve(true);
        } else {
          logger.error("[Square Monitor] Không thể khởi động");
          // Không reject để không ảnh hưởng đến bot khác
          resolve(false);
        }
      }, 2000);
    });
  }

  // Khởi động Square Monitor
  async startAllBots() {
    try {
      logger.info("🚀 Đang khởi động Square Monitor...");

      // Kiểm tra kết nối Telegram
      await checkTelegramConnection();

      // Khởi động Square Monitor
      const squareMonitorStarted = await this.startSquareMonitor();

      // Log kết quả khởi động
      if (squareMonitorStarted) {
        logger.info("✅ Square Monitor: Khởi động thành công");
      } else {
        logger.warn("⚠️ Square Monitor: Khởi động thất bại, sẽ thử lại sau");
      }

      // Kiểm tra xem bot có chạy thành công không
      const runningBots = this.processes.length;
      if (runningBots > 0) {
        logger.info(`🎉 Đã khởi động thành công ${runningBots}/1 bot!`);
        logger.info("📊 Monitoring:");
        logger.info("   - Binance Square Monitor: Mỗi 2 phút");
      } else {
        logger.error("❌ Không có bot nào khởi động thành công");
        process.exit(1);
      }

      // Xử lý shutdown gracefully
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error(`❌ Lỗi khởi động bot: ${error.message}`);
      // Không exit ngay, để bot có thể tự restart
    }
  }

  // Xử lý shutdown gracefully
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      logger.info(`\n🛑 Nhận tín hiệu ${signal}, đang shutdown gracefully...`);

      // Đóng tất cả child processes
      for (const process of this.processes) {
        if (process && !process.killed) {
          process.kill("SIGTERM");
        }
      }

      // Đợi 5 giây rồi force kill nếu cần
      setTimeout(() => {
        for (const process of this.processes) {
          if (process && !process.killed) {
            process.kill("SIGKILL");
          }
        }
        logger.info("✅ Đã shutdown tất cả bots");
        process.exit(0);
      }, 5000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }

  // Kiểm tra status của các bots
  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      processesCount: this.processes.length,
      processes: this.processes.map((p) => ({
        pid: p.pid,
        killed: p.killed,
      })),
    };
  }
}

// Hàm main
async function main() {
  try {
    // Kiểm tra environment variables
    const missingVars = [];

    if (!config.BINANCE.API_KEY) missingVars.push("BINANCE_API_KEY");
    if (!config.BINANCE.SECRET_KEY) missingVars.push("BINANCE_SECRET_KEY");
    if (!config.TELEGRAM.BOT_TOKEN) missingVars.push("TELEGRAM_BOT_TOKEN");
    if (!config.TELEGRAM.CHAT_ID) missingVars.push("TELEGRAM_CHAT_ID");

    if (missingVars.length > 0) {
      logger.error(`❌ Thiếu environment variables: ${missingVars.join(", ")}`);
      logger.info(
        "💡 Vui lòng kiểm tra file .env hoặc SETUP.md để biết thêm chi tiết"
      );
      process.exit(1);
    }

    const botManager = new BotManager();
    await botManager.startAllBots();

    // Log status định kỳ
    setInterval(() => {
      const status = botManager.getStatus();
      logger.info(
        `📊 Bot Status: ${status.processesCount} processes đang chạy`
      );
    }, 300000); // Log mỗi 5 phút
  } catch (error) {
    logger.error(`❌ Lỗi khởi động: ${error.message}`);
    process.exit(1);
  }
}

// Chạy nếu file được execute trực tiếp
if (require.main === module) {
  main().catch((error) => {
    logger.error(`❌ Lỗi không xác định: ${error.message}`);
    process.exit(1);
  });
}

module.exports = BotManager;
