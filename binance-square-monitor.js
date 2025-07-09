const puppeteer = require("puppeteer");
const cron = require("node-cron");
const fs = require("fs/promises");
const path = require("path");

const SQUARE_URL = "https://www.binance.com/en/square/search?s=Alpha%20airdrop";

// Hàm lấy danh sách các post (trả về mảng object: {title, url, content})
async function fetchLatestPosts() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(SQUARE_URL, {
      waitUntil: "networkidle0",
      timeout: 30000, // Giảm timeout từ 60s xuống 30s
    });
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Giảm từ 5s xuống 3s
    await page.evaluate(() => {
      const modals = document.querySelectorAll(
        '[class*="modal"], [class*="popup"], [class*="dialog"]'
      );
      modals.forEach((modal) => modal.remove());
    });
    await autoScroll(page);
    // Lấy danh sách post với selector chính xác hơn
    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll(
        '#bn-tab-pane-0 > div[class*="FeedBuzzBaseViewRoot"]'
      );
      let results = [];
      let seen = new Set();
      postElements.forEach((postEl) => {
        const linkEl = postEl.querySelector(
          "div.card-content-box > div.card__bd.trading-pairs-first > div.feed-content-text.css-1qp5tsr > a"
        );
        let url = linkEl ? linkEl.getAttribute("href") : "";
        if (url && !seen.has(url)) {
          seen.add(url);
          if (!url.startsWith("http")) {
            url = "https://www.binance.com" + url;
          }
          // Lấy title
          const titleEl = postEl.querySelector(
            "div.card-content-box > div.card__bd.trading-pairs-first > div.feed-content-text.css-1qp5tsr > div.card__title.css-uz6l8d > h3"
          );
          const title = titleEl ? titleEl.innerText.trim() : "";
          // Lấy content
          let content = "";
          const contentSelectors = [
            "div.card-content-box > div.card__bd.trading-pairs-first > div.feed-content-text.css-1qp5tsr > div.rich-text-wrap.keep-line.card__description_line-clamp.has-title",
            "div.card-content-box > div.card__bd.trading-pairs-first > div.feed-content-text.css-1qp5tsr > div.rich-text-wrap.keep-line",
          ];
          for (const sel of contentSelectors) {
            const el = postEl.querySelector(sel);
            if (el && el.innerText && el.innerText.trim()) {
              content = el.innerText.trim();
              break;
            }
          }
          // Lấy thời gian post được tạo
          const timeEl = postEl.querySelector(
            "div.card-content-box > div.card__hd > div.avatar-name-container.avatar-nickname-v2.has-overlay.css-1ah8n5b > div > div > div.avatar-nick-box-suffix.flex.items-center.gap-1 > div > div"
          );
          const postTime = timeEl ? timeEl.innerText.trim() : "";
          results.push({ title, url, content, postTime });
        }
      });
      return results;
    });
    return posts;
  } catch (err) {
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Hàm scroll tự động để load thêm content (tối ưu cho 2 phút)
async function autoScroll(page) {
  await page.evaluate(async () => {
    let lastPostCount = 0;
    let sameCountTimes = 0;
    const maxSameCountTimes = 3; // Giảm từ 5 xuống 3
    const maxScrolls = 20; // Giảm từ 100 xuống 20
    let scrollCount = 0;
    async function getPostCount() {
      const postElements = document.querySelectorAll(
        '#bn-tab-pane-0 > div[class*="FeedBuzzBaseViewRoot"]'
      );
      return postElements.length;
    }
    while (scrollCount < maxScrolls) {
      window.scrollBy(0, window.innerHeight);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Giảm từ 800ms xuống 500ms
      const currentCount = await getPostCount();
      if (currentCount === lastPostCount) {
        sameCountTimes++;
      } else {
        sameCountTimes = 0;
      }
      lastPostCount = currentCount;
      scrollCount++;
      if (sameCountTimes >= maxSameCountTimes) {
        break;
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Giảm từ 2000ms xuống 1000ms
}

// Hàm chính để show kết quả
async function checkBinanceSquare() {
  const posts = await fetchLatestPosts();
  if (posts.length === 0) {
    console.log(
      "Không tìm thấy post nào! Có thể Binance đã thay đổi structure."
    );
    return;
  }

  // Chuẩn hóa postTime và lưu thêm trường postTimeParsed (Date object để sort)
  const now = new Date();
  const postsWithParsedTime = posts.map((post) => {
    let parsed = post.postTime;
    let dateObj = now;
    const m = post.postTime.match(/(\d+)([hm])/i);
    if (m) {
      const value = parseInt(m[1], 10);
      if (m[2].toLowerCase() === "h") {
        dateObj = new Date(now.getTime() - value * 60 * 60 * 1000);
        parsed = dateObj.toLocaleString();
      } else if (m[2].toLowerCase() === "m") {
        dateObj = new Date(now.getTime() - value * 60 * 1000);
        parsed = dateObj.toLocaleString();
      }
    } else {
      // Nếu là dạng 'Jul 7' hoặc tương tự
      const d = new Date(post.postTime + " " + now.getFullYear());
      if (!isNaN(d.getTime())) {
        dateObj = d;
        parsed = d.toLocaleString();
      }
    }
    return { ...post, postTimeParsed: parsed, postTimeDate: dateObj };
  });
  // Sort theo postTimeDate mới nhất lên đầu
  postsWithParsedTime.sort((a, b) => b.postTimeDate - a.postTimeDate);

  // Lưu kết quả vào file json theo ngày
  const todayStr = now.toISOString().slice(0, 10); // yyyy-mm-dd
  const notifyDir = path.join(__dirname, "notify-post");
  const filePath = path.join(notifyDir, `${todayStr}.json`);
  try {
    await fs.mkdir(notifyDir, { recursive: true });
    let filePosts = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      filePosts = JSON.parse(fileContent);
    } catch (e) {
      // file chưa tồn tại hoặc lỗi đọc, giữ filePosts = []
    }
    let newCount = 0;
    for (const post of postsWithParsedTime) {
      const t = (post.title || "") + " " + (post.content || "");
      const lower = t.toLowerCase();
      if (lower.includes("alpha") && lower.includes("airdrop")) {
        // Check trùng url
        if (!filePosts.some((p) => p.url === post.url)) {
          filePosts.unshift(post); // Thêm vào đầu mảng thay vì cuối
          newCount++;
        }
      }
    }
    await fs.writeFile(filePath, JSON.stringify(filePosts, null, 2), "utf8");
    console.log(`\nĐã lưu ${newCount} post mới vào ${filePath}`);
  } catch (err) {
    console.error("Lỗi khi lưu file notify:", err.message);
  }
}

// Chạy hàm chính
checkBinanceSquare();
// Định kỳ mỗi 2 phút
cron.schedule("*/2 * * * *", checkBinanceSquare);

console.log("🚀 Binance Square Monitor đã khởi động!");
console.log("⏰ Sẽ kiểm tra mỗi 2 phút...");
