const waitForElement = (selector, parent = document) => new Promise((resolve) => {
    const el = parent.querySelector(selector);
    if (el) {
        resolve(el);
    }

    const observer = new MutationObserver(() => {
        const el = parent.querySelector(selector);
        if (!el) {
            return;
        }

        resolve(el);
        observer.disconnect();
    });

    observer.observe(document.body, {
        subtree: true,
        childList: true,
    });
});




// Create Loading Screen
const createLoadingDiv = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'st-loading-div';

    // Radial Loader
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'st-radial-loader';

    loadingDiv.appendChild(loadingIndicator);

    // Apply to body
    document.body.appendChild(loadingDiv);

    // Timer
    setTimeout(() => {
        document.body.removeChild(loadingDiv);
    }, 2500);
};

// Patch to body
waitForElement('.Rp8QOGJ2DypeDniMnRBhr').then(() => {
    if (!document.getElementById('st-loading-div')) {
        createLoadingDiv();
    }
});




// Store Sidebar Width half fix
async function syncWidthIfTargetHidden() {
  const sourceClass = '._9sPoVBFyE_vE87mnZJ5aB';
  const targetClass = '.RGNMWtyj73_-WdhflrmuY';

  const sourceEl = await waitForElement(sourceClass);
  const targetEl = await waitForElement(targetClass);

  const setWidth = () => {
    const width = sourceEl.style.width;
    if (width) {
      targetEl.style.width = width;
    }
  };

  const removeWidth = () => {
    targetEl.style.removeProperty('width');
  };

  const handleTargetDisplayChange = () => {
    if (targetEl.style.display === 'none') {
      setWidth();
    } else {
      removeWidth();
    }
  };

  // Initial check
  handleTargetDisplayChange();

  // Watch for style changes on source
  const sourceObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        if (targetEl.style.display === 'none') {
          setWidth();
        }
      }
    }
  });

  sourceObserver.observe(sourceEl, {
    attributes: true,
    attributeFilter: ['style'],
  });

  // Watch for style changes on target (especially display)
  const targetObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        handleTargetDisplayChange();
      }
    }
  });

  targetObserver.observe(targetEl, {
    attributes: true,
    attributeFilter: ['style'],
  });
}

syncWidthIfTargetHidden();

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

function removeMatchingFriends() {
  const containers = [
    ...document.querySelectorAll('div._39bm0CkBxBjJsnPpAzoZlv.X40qiCKsKLskkN1pEsNNT'),
    ...document.querySelectorAll('div._3C0istohNAM4_kDuBULbcw._3gj9A13VQyuW_6wr_Io8Xz'),
  ];

  containers.forEach(container => {
    if (container) {
      var hide_count = 0;
      var head = null;
      var head_text = '';
      var number = 0;
      Array.from(container.children).forEach(friend => {
        const target = friend.querySelector('.nOdcT-MoOaXGePXLyPe0H');
        var text = "";
        if (target) {
          text = target.innerText.trim();
        } else {
          text = friend.innerText.trim();
        }
        if (text.includes('位')) {
          console.log('text:', text);
          head_text = text;
          head = friend
          number = text.match(/\d+/)[0];
        }
        const matched = nameList.find(name => text.includes(name));
        if (matched) {
          console.log('Hiding:', matched);
          //friend.style.display = 'none'; // 替代 remove()
          friend.remove()
          hide_count++;
        }
      });
      if (number == hide_count && head != null) {
        const parent = head.parentElement;
        parent.style.display = 'none';
      } else if (head != null) {
        head.textContent = head_text.replace(/\d+/, number - hide_count);
      }
    }
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