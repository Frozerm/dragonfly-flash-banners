document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-banner-form');
  const profileUrlInput = document.getElementById('profile-url');
  const imageUrlInput = document.getElementById('image-url');
  const bannersList = document.getElementById('banners-list');
  const template = document.getElementById('banner-item-template');
  const emptyState = document.querySelector('.empty-state');

  function loadBanners() {
    chrome.storage.local.get('banners').then((res) => {
      const banners = res.banners || {};
      const userIds = Object.keys(banners);
      
      const items = bannersList.querySelectorAll('.banner-item');
      items.forEach(item => item.remove());

      if (userIds.length === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        userIds.forEach(id => {
          const imageUrl = banners[id];
          const clone = template.content.cloneNode(true);
          clone.querySelector('.profile-id span').textContent = id;
          clone.querySelector('.image-url span').textContent = imageUrl;
          clone.querySelector('.banner-preview').style.backgroundImage = `url('${imageUrl}')`;
          
          const deleteBtn = clone.querySelector('.btn-delete');
          deleteBtn.addEventListener('click', () => deleteBanner(id));
          
          bannersList.appendChild(clone);
        });
      }
    });
  }

  function extractId(input) {
    input = input.trim();
    try {
      const url = new URL(input);
      const id = url.searchParams.get('id');
      if (id) return id;
      return input;
    } catch (e) {
      return input;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawIdInput = profileUrlInput.value;
    const imageUrl = imageUrlInput.value.trim();
    const userId = extractId(rawIdInput);
    
    if (!userId || !imageUrl) return;

    chrome.storage.local.get('banners').then((res) => {
      const banners = res.banners || {};
      banners[userId] = imageUrl;
      chrome.storage.local.set({ banners }).then(() => {
        profileUrlInput.value = '';
        imageUrlInput.value = '';
        loadBanners();
      });
    });
  });

  function deleteBanner(id) {
    chrome.storage.local.get('banners').then((res) => {
      const banners = res.banners || {};
      delete banners[id];
      chrome.storage.local.set({ banners }).then(() => {
        loadBanners();
      });
    });
  }

  loadBanners();

  const closeBtn = document.querySelector('button[aria-label="Close"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.parent.postMessage({ type: 'CLOSE_BANNER_SETTINGS' }, '*');
      window.close();
    });
  }
});