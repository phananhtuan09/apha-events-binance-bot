# Hướng dẫn cấu hình Bot Binance

## 1. Cài đặt dependencies

```bash
npm install
```

## 2. Cấu hình Environment Variables

Tạo file `.env` với nội dung sau:

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
IS_DEV_MODE=false
```

### Cách lấy Binance API Key:

1. Đăng nhập vào Binance
2. Vào API Management
3. Tạo API Key mới với quyền "Enable Reading"
4. Copy API Key và Secret Key

### Cách lấy Telegram Bot Token:

1. Tìm @BotFather trên Telegram
2. Gửi lệnh `/newbot`
3. Đặt tên cho bot
4. Copy Bot Token

### Cách lấy Telegram Chat ID:

1. Thêm bot vào group/chat
2. Gửi tin nhắn bất kỳ
3. Truy cập: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Tìm `chat.id` trong response

## 3. Chạy Bot

### Chạy tất cả bots cùng lúc (Khuyến nghị):

```bash
npm start
# hoặc
npm run start-all
```

### Chạy từng bot riêng lẻ:

#### Bot Monitor Binance Square:

```bash
npm run notify-post
```

#### Bot Track Account Binance:

```bash
npm run track-account
```

## 4. Cấu hình cho VPS

### Tạo systemd service cho tất cả bots (Khuyến nghị):

```bash
sudo nano /etc/systemd/system/binance-bots.service
```

Nội dung:

```ini
[Unit]
Description=Binance Bots (Square Monitor + Account Tracker)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apha-events-binance-bot
EnvironmentFile=/home/ubuntu/apha-events-binance-bot/.env
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Hoặc tạo riêng từng service:

#### Tạo systemd service cho Square Monitor:

```bash
sudo nano /etc/systemd/system/binance-square.service
```

Nội dung:

```ini
[Unit]
Description=Binance Square Monitor
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apha-events-binance-bot
EnvironmentFile=/home/ubuntu/apha-events-binance-bot/.env
ExecStart=/usr/bin/node binance-square-monitor.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Tạo systemd service cho Account Tracker:

```bash
sudo nano /etc/systemd/system/binance-tracker.service
```

Nội dung:

```ini
[Unit]
Description=Binance Account Tracker
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apha-events-binance-bot
EnvironmentFile=/home/ubuntu/apha-events-binance-bot/.env
ExecStart=/usr/bin/node binance-account-tracker.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Kích hoạt services:

#### Chạy tất cả bots cùng lúc (Khuyến nghị):

```bash
sudo systemctl daemon-reload
sudo systemctl enable binance-bots
sudo systemctl start binance-bots
```

#### Hoặc chạy riêng từng bot:

```bash
sudo systemctl daemon-reload
sudo systemctl enable binance-square
sudo systemctl enable binance-tracker
sudo systemctl start binance-square
sudo systemctl start binance-tracker
```

## 5. Monitoring

### Xem logs:

```bash
# Tất cả bots logs (nếu dùng binance-bots service)
sudo journalctl -u binance-bots -f

# Hoặc từng bot riêng lẻ
sudo journalctl -u binance-square -f
sudo journalctl -u binance-tracker -f

# File logs
tail -f logs/binance-bot/$(date +%Y-%m-%d).log
```

### Kiểm tra status:

```bash
# Tất cả bots
sudo systemctl status binance-bots

# Hoặc từng bot riêng lẻ
sudo systemctl status binance-square
sudo systemctl status binance-tracker
```

## 6. Cấu trúc thư mục

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

## 7. Tính năng

### Bot Manager (index.js):

- ✅ Chạy cả 2 bots cùng lúc
- ✅ Auto restart khi có lỗi
- ✅ Graceful shutdown
- ✅ Process management
- ✅ Status monitoring

### Bot Square Monitor:

- ✅ Monitor Binance Square mỗi 2 phút
- ✅ Tìm posts về Alpha Airdrop
- ✅ Gửi thông báo Telegram
- ✅ Lưu logs vào file

### Bot Account Tracker:

- ✅ Track số dư ALPHA mỗi 3 phút
- ✅ Phát hiện phần thưởng mới
- ✅ Track distribution history
- ✅ Track deposit history
- ✅ Gửi thông báo Telegram
- ✅ Lưu logs vào file
