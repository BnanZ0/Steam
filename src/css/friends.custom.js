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
        friend.dataset.hiddenByScript = 'true'; // 打标记
      } else {
        friend.style.display = ''; // 恢复显示（可选）
        delete friend.dataset.hiddenByScript;
      }
    }
  });

  // 检查每个游戏分组
  document.querySelectorAll('.DropTarget.friendGroup.gameGroup').forEach(group => {
    const container = group.querySelector('.friendsContainer');
    if (!container) return;

    const friendsInGroup = container.children;
    if (friendsInGroup.length === 0) return;

    // 检查是否全部被标记隐藏
    const allHidden = Array.from(friendsInGroup).every(friend => friend.dataset.hiddenByScript === 'true');

    if (allHidden) {
      group.style.display = 'none';
      group.dataset.hiddenByScript = 'true';
    } else {
      group.style.display = '';
      delete group.dataset.hiddenByScript;
    }
  });
}

function restoreHiddenFriends() {
  const hiddenFriends = document.querySelectorAll('[data-hidden-by-script="true"]');
  hiddenFriends.forEach(friend => {
    friend.style.display = '';
    delete friend.dataset.hiddenByScript;
  });
}

// 初始执行一次
removeMatchingFriends();

// 监听页面 DOM 变化
const blacklist_observer = new MutationObserver(() => {
  removeMatchingFriends();
});

blacklist_observer.observe(document.body, {
  childList: true,
  subtree: true
});

let isObserverActive = true;

function startBlacklistObserver() {
  if (isObserverActive) return;
  removeMatchingFriends()
  blacklist_observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  isObserverActive = true;
  console.log("✅ Blacklist observer 已启动。");
}

function stopBlacklistObserver() {
  if (!isObserverActive) return;
  blacklist_observer.disconnect();
  restoreHiddenFriends();
  isObserverActive = false;
  console.log("🛑 Blacklist observer 已停止。");
}

function toggleBlacklistObserver() {
  if (isObserverActive) {
    stopBlacklistObserver();
  } else {
    startBlacklistObserver();
  }
  return isObserverActive;
}

function setupToggleButtonInMenu(menuContainer) {
  // 检查按钮是否已存在，防止重复添加
  if (menuContainer.querySelector('.blacklist-observer-toggle-btn')) {
    return;
  }

  // 创建一个容器，让我们的按钮看起来更像一个菜单项
  const menuItem = document.createElement('div');
  menuItem.className = 'blacklist-observer-toggle-item'; // 自定义 class

  // 创建按钮元素
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'blacklist-observer-toggle-btn'; // 自定义 class
  toggleBtn.textContent = `黑名单`;

  // 为按钮添加一些基本样式，使其能融入菜单
  // 您可以根据实际页面的 CSS 进行微调
  Object.assign(toggleBtn.style, {
    width: '100%',
    padding: '4px 6px',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    color: isObserverActive ? '#6dcff6' : 'inherit', // 继承父元素的文字颜色
    font: 'inherit'   // 继承父元素的字体
  });
  
  // 简单的鼠标悬停效果
  menuItem.onmouseover = () => { menuItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; };
  menuItem.onmouseout = () => { menuItem.style.backgroundColor = 'transparent'; };

  // 为按钮添加点击事件
  toggleBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // 阻止事件冒泡，避免点击按钮时关闭了菜单
    const isActive = toggleBlacklistObserver();
    // 更新按钮文本以反映新状态
    toggleBtn.style.color = isActive ? '#6dcff6' : 'inherit'
  });

  // 将按钮放入菜单项容器，再将容器添加到菜单中
  menuItem.appendChild(toggleBtn);
  // 使用 prepend 将其添加到菜单的顶部
  menuContainer.append(menuItem);
  
  console.log("开关按钮已成功添加到 .contextMenuSectionContent 菜单中。");
}

/**
 * 创建一个新的 MutationObserver (menuObserver) 来监视 DOM，
 * 等待 .personaContextMenuItem 元素出现。
 */
const menuObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.addedNodes.length) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 检查被添加的节点本身或其后代是否是我们寻找的菜单
          const targetMenu = node.matches('.contextMenuSectionContent') ? node : node.querySelector('.contextMenuSectionContent');
          if (targetMenu) {
            setupToggleButtonInMenu(targetMenu);
            // 找到后可以停止对本次 mutation 的进一步检查，提高效率
            return; 
          }
        }
      }
    }
  }
});

// 启动 menuObserver，开始监视整个页面的结构变化
menuObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("脚本已启动，正在监视页面，等待 .personaContextMenuItem 菜单出现...");

// 同时，在脚本加载时也检查一次，以防菜单在脚本运行前就已经存在
const existingMenu = document.querySelector('.contextMenuSectionContent');
if (existingMenu) {
  setupToggleButtonInMenu(existingMenu);
}