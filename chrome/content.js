(function() {
  let cachedBanners = {};

  function getCurrentUserId() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id');
    } catch (e) {
      return null;
    }
  }

  function applyCustomBanner() {
    const userId = getCurrentUserId();
    const customImageUrl = userId ? cachedBanners[userId] : null;
    const coverElement = document.querySelector('.profile-cover');
    
    if (coverElement) {
      if (customImageUrl) {
        const currentBg = coverElement.style.getPropertyValue('background-image');
        if (!currentBg.includes(customImageUrl)) {
          coverElement.style.backgroundImage = `url('${customImageUrl}')`;
          coverElement.style.backgroundSize = 'cover';
          coverElement.style.backgroundPosition = 'center';
          coverElement.style.setProperty('background-image', `url('${customImageUrl}')`, 'important');
        }
      } else {
        if (coverElement.style.getPropertyPriority('background-image') === 'important') {
          coverElement.style.removeProperty('background-image');
          coverElement.style.backgroundImage = '';
        }
      }
    }
  }

  function injectMenuButton() {
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn && !document.getElementById('btn-custom-banners')) {
      const parentLi = settingsBtn.closest('li');
      if (parentLi && parentLi.parentNode) {
        const newLi = document.createElement('li');
        newLi.innerHTML = `<a id="btn-custom-banners" href="javascript:void(0)" style="display: block;"><span class="menu-icon">🖼️</span>Баннера</a>`;
        parentLi.parentNode.insertBefore(newLi, parentLi.nextSibling);
        
        const bannerBtn = document.getElementById('btn-custom-banners');
        bannerBtn.addEventListener('click', openBannerSettings);
      }
    }
  }

  function onDomChange() {
    applyCustomBanner();
    injectMenuButton();
  }

  function openBannerSettings() {
    if (document.getElementById('dragonfly-banner-settings-iframe')) return;
    
    const iframe = document.createElement('iframe');
    iframe.id = 'dragonfly-banner-settings-iframe';
    iframe.src = chrome.runtime.getURL('popup.html');
    iframe.style.position = 'fixed';
    iframe.style.top = '50%';
    iframe.style.left = '50%';
    iframe.style.transform = 'translate(-50%, -50%)';
    iframe.style.width = '420px';
    iframe.style.height = '360px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = 'transparent';
    
    const backdrop = document.createElement('div');
    backdrop.id = 'dragonfly-banner-settings-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.background = 'rgba(0,0,0,0.3)';
    backdrop.style.zIndex = '999998';
    backdrop.addEventListener('click', () => {
      iframe.remove();
      backdrop.remove();
    });
    
    document.body.appendChild(backdrop);
    document.body.appendChild(iframe);
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLOSE_BANNER_SETTINGS') {
      const iframe = document.getElementById('dragonfly-banner-settings-iframe');
      const backdrop = document.getElementById('dragonfly-banner-settings-backdrop');
      if (iframe) iframe.remove();
      if (backdrop) backdrop.remove();
    }
  });

  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
    }
    onDomChange();
  });

  chrome.storage.local.get('banners').then((res) => {
    cachedBanners = res.banners || {};
    observer.observe(document.body, { childList: true, subtree: true });
    onDomChange();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.banners) {
      cachedBanners = changes.banners.newValue || {};
      onDomChange();
    }
  });
})();