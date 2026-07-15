(function(){
  function fallback(img){
    if(img.dataset.fallbackApplied)return; img.dataset.fallbackApplied='1';
    const box=document.createElement('div'); box.className='placeholder';
    box.textContent=`画像配置待ち\n${img.getAttribute('src')||''}`;
    img.replaceWith(box);
  }
  window.BMImageFallback={fallback,bind(root=document){root.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>fallback(img),{once:true}); if(img.complete&&img.naturalWidth===0)fallback(img)})}};
  document.addEventListener('DOMContentLoaded',()=>window.BMImageFallback.bind());
})();
