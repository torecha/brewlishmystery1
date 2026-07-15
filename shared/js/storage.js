(function(){
  const prefix='bm_s01_';
  function get(key,fallback){try{const v=localStorage.getItem(prefix+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}}
  function set(key,value){try{localStorage.setItem(prefix+key,JSON.stringify(value));return true}catch(e){return false}}
  function remove(key){try{localStorage.removeItem(prefix+key)}catch(e){}}
  window.BMStorage={prefix,get,set,remove};
})();
