const waitForElement = (selector, parent = document) => {
  return new Promise((resolve) => {
    const el = parent.querySelector(selector);
    if (el) {
      resolve(el);
    }

    const observer = new MutationObserver(() => {
      const el = parent.querySelector(selector);
      if (el) {
        resolve(el);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  });
};

async function getNameList() {
  try {
    // 路径是相对于皮肤的根目录（skin.json 所在的位置）。
    // Steam 客户端的 JS 环境通常会从那里解析 fetch 请求。
    const response = await fetch('./skins/Steam/blacklist.json');

    if (!response.ok) {
      throw new Error(`获取 blacklist.json 时发生 HTTP 错误: ${response.status}`);
    }

    const nameList = await response.json();
    console.log("已成功从 JSON 加载黑名单:", nameList);
    return nameList;
  } catch (error) {
    console.error("无法从 blacklist.json 加载名称列表。", error);
    // 如果因任何原因加载失败，则回退到默认列表
    return [""];
  }
}

const nameList = await getNameList();

async function removeMatchingFriends() {
  await waitForElement('.friend.ingame, .friend.online')
  const friends = document.querySelectorAll('.friend.ingame, .friend.online');

  friends.forEach(friend => {
    const target = friend.querySelector('.nOdcT-MoOaXGePXLyPe0H');
    if (target) {
      const text = target.innerText.trim();
      const matched = nameList.find(name => text.includes(name));

      if (matched) {
        console.log('Hiding:', matched);
        friend.style.display = 'none'; // 替代 remove()
      } else {
        friend.style.display = ''; // 恢复显示（可选）
      }
    }
  });
}

// 初始执行一次
removeMatchingFriends();

// 监听页面 DOM 变化
const observer = new MutationObserver(() => {
  removeMatchingFriends();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});