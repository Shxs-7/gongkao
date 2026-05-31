/* ========================================
   抓取人民网 RSS 评论 → 保存为 JSON
   由 GitHub Actions 每天自动运行
   ======================================== */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const RSS_URL = 'http://www.people.com.cn/rss/opinion.xml';
const OUTPUT_FILE = path.join(__dirname, '..', 'daily-article.json');

// 用 rss2json API 获取
const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS_URL);

https.get(apiUrl, { timeout: 15000 }, function (res) {
  let body = '';
  res.on('data', function (d) { body += d; });
  res.on('end', function () {
    try {
      const data = JSON.parse(body);
      if (data.items && data.items.length > 0) {
        const latest = data.items[0];
        // 清理 HTML 标签
        const content = (latest.content || latest.description || '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        const article = {
          date: new Date().toISOString().split('T')[0],
          title: latest.title,
          content: content,
          source: '人民网',
          sourceUrl: latest.link || '',
          generatedAt: new Date().toISOString()
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(article, null, 2), 'utf-8');
        console.log('✅ 已保存:', article.title);
      } else {
        console.log('⚠️ 未找到文章，items:', data.items ? data.items.length : 0);
      }
    } catch (e) {
      console.error('❌ 解析失败:', e.message);
    }
  });
}).on('error', function (e) {
  console.error('❌ 请求失败:', e.message);
  process.exit(1);
});
