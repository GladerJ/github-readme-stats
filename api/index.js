import { netlifyHandler } from './netlify-adapter.js';
import { renderStatsCard } from '../src/cards/stats-card.js';
import { renderTopLanguages } from '../src/cards/top-languages-card.js';
import { renderWakatimeCard } from '../src/cards/wakatime-card.js';
import { renderRepoCard } from '../src/cards/repo-card.js';
import { renderGistCard } from '../src/cards/gist-card.js';
import { blacklist } from '../src/common/blacklist.js';
import { isLocaleAvailable } from '../src/common/utils.js';
import { serverConfig } from '../src/common/server-configs.js';

const handlerFn = async (req, res) => {
  const route = req.url.split("?")[0].split("/");
  
  // 确保req.query存在
  if (!req.query) {
    req.query = {};
  }

  // 调试输出请求信息
  console.log("Path:", req.url);
  console.log("Query:", JSON.stringify(req.query));
  console.log("Route:", route);

  if (blacklist.includes(req.query.username)) {
    return res.send(renderError("用户名已被列入黑名单", "请联系管理员"));
  }

  const locale = req.query.locale || serverConfig.locale;

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(
      renderError(
        "无效的区域设置",
        `区域设置 ${locale} 不可用`
      )
    );
  }

  try {
    // 处理GitHub统计卡片请求
    if (!route[1] || route[1] === "") {
      return res.send(await renderStatsCard(req));
    }

    // 其他卡片类型
    switch (route[1]) {
      case "top-langs":
        return res.send(await renderTopLanguages(req));
      case "wakatime":
        return res.send(await renderWakatimeCard(req));
      case "repo":
        return res.send(await renderRepoCard(req));
      case "gist":
        return res.send(await renderGistCard(req));
      default:
        return res.send(
          renderError(
            "无效的卡片类型",
            `请使用 ?username=用户名 参数或 /repo?username=用户名&repo=仓库名`
          )
        );
    }
  } catch (err) {
    console.log(err);
    return res.send(renderError(err.message, err.secondaryMessage));
  }
};

// 渲染错误消息的函数
function renderError(message, secondaryMessage = "") {
  return `
    <svg width="495" height="120" viewBox="0 0 495 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ff0000 }
        .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ff0000 }
      </style>
      <rect x="0.5" y="0.5" width="494" height="99%" rx="4.5" fill="white" stroke="#E4E2E2"/>
      <text x="25" y="45" class="text">错误: ${message}</text>
      <text x="25" y="65" class="small">${secondaryMessage}</text>
    </svg>
  `;
}

// 导出Netlify函数处理器
export const handler = netlifyHandler(handlerFn);
