(function () {
  function fallback(img) {
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    const box = document.createElement('div');
    box.className = 'placeholder';
    box.textContent = `画像配置待ち\n${img.getAttribute('src') || ''}`;
    img.replaceWith(box);
  }

  function bind(root = document) {
    root.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => fallback(img), { once: true });
      const src = img.getAttribute('src');
      if (src && img.complete && img.naturalWidth === 0) fallback(img);
    });
  }

  window.BMImageFallback = { fallback, bind };
  document.addEventListener('DOMContentLoaded', () => bind());
})();
