# Binance Alpha Events Bot

Bot tự động monitor Binance Square và track account để thông báo các sự kiện Alpha Airdrop.

## 📁 Cấu trúc Project

```
apha-events-binance-bot/
├── src/
│   ├── bots/                    # Các bot chính
│   │   ├── binance-square-monitor.js    # Bot monitor Binance Square
│   │   └── binance-account-tracker.js   # Bot track account Binance
│   ├── services/                # Các service
│   │   ├── telegram-client.js   # Telegram API client
│   │   └── telegram-service.js  # Telegram service logic
│   ├── utils/                   # Utilities
│   │   ├── logger.js            # Logger service
│   │   └── test-env.js          # Test environment variables
│   └── config/                  # Configuration
│       └── config.js            # Main config file
├── index.js                     # Entry point - Bot Manager
├── package.json                 # Dependencies & scripts
├── SETUP.md                     # Hướng dẫn cài đặt
├── .env                         # Environment variables (tạo thủ công)
├── logs/                        # Log files
│   └── binance-bot/
├── notify-post/                 # Dữ liệu posts từ Square
└── account-data/                # Dữ liệu account tracking
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo file .env

```bash
# Binance API Configuration
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here

# Telegram Configuration
TELEGRAM_IS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Logging Configuration
IS_LOG_ENABLED=true
IS_DEV_MODE=true
```

### 3. Chạy bot

#### Chạy tất cả bots cùng lúc (Khuyến nghị):

```bash
npm start
# hoặc
npm run start-all
```

#### Chạy từng bot riêng lẻ:

```bash
# Bot monitor Binance Square
npm run notify-post

# Bot track account Binance
npm run track-account
```

#### Test environment variables:

```bash
npm run test-env
```

## 📊 Tính năng

### Bot Manager (index.js)

- ✅ Chạy cả 2 bots cùng lúc
- ✅ Auto restart khi có lỗi
- ✅ Graceful shutdown
- ✅ Process management
- ✅ Status monitoring

### Bot Square Monitor

- ✅ Monitor Binance Square mỗi 2 phút
- ✅ Tìm posts về Alpha Airdrop
- ✅ Gửi thông báo Telegram
- ✅ Lưu logs vào file

### Bot Account Tracker

- ✅ Track số dư ALPHA mỗi 3 phút
- ✅ Phát hiện phần thưởng mới
- ✅ Track distribution history
- ✅ Track deposit history
- ✅ Gửi thông báo Telegram
- ✅ Lưu logs vào file

## 🔧 Cấu hình VPS

Xem file `SETUP.md` để biết hướng dẫn chi tiết về cấu hình VPS.

## 📝 Logs

- **Console logs**: Khi `IS_DEV_MODE=true`
- **File logs**: `logs/binance-bot/YYYY-MM-DD.log`
- **Auto rotate**: Mỗi ngày, giữ 14 ngày

## 🔔 Telegram Notifications

Bot sẽ gửi thông báo với format Markdown cho:

- Posts mới từ Binance Square
- Phần thưởng ALPHA mới
- Distribution mới
- Deposit mới
