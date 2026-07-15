(function(){
 const normalize=s=>String(s||'').normalize('NFKC').trim().toUpperCase().replace(/[\s　_\-]/g,'');
 window.BP=window.BP||{};
 BP.normalizeCode=normalize;
 BP.unlockCode=function(code,codes){const n=normalize(code);const hit=codes.find(x=>normalize(x.code)===n);if(!hit)return {ok:false,message:'コードが一致しません。'};const list=BMStorage.get('unlocked_days',[]);if(list.includes(hit.key))return {ok:true,already:true,day:hit.key,entry:hit,message:`${hit.label} は解放済みです。`};list.push(hit.key);list.sort();BMStorage.set('unlocked_days',list);const hist=BMStorage.get('code_history',[]);hist.push({code:hit.code,unlocked:hit.key,at:new Date().toISOString()});BMStorage.set('code_history',hist);return {ok:true,day:hit.key,entry:hit,message:`${hit.label} の資料を解放しました。`}}
})();
