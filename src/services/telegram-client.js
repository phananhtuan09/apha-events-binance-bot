const https = require("https");

class TelegramClient {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/${method}`;
      const postData = JSON.stringify(params);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.ok) {
              resolve(jsonData.result);
            } else {
              reject(new Error(`Telegram API Error: ${jsonData.description}`));
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async sendMessage(chatId, text, options = {}) {
    const params = {
      chat_id: chatId,
      text: text,
      ...options,
    };

    return this.makeRequest("sendMessage", params);
  }

  async getMe() {
    return this.makeRequest("getMe");
  }
}

module.exports = TelegramClient;
