(function(){
 window.BP=window.BP||{};
 BP.notes={
  load(){return BMStorage.get('investigation_notes',[])},save(v){BMStorage.set('investigation_notes',v)},
  add(note){const n=this.load();n.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:note.title||'無題',body:note.body||'',person:note.person||'',day:note.day||'',evidence:note.evidence||'',done:false,createdAt:new Date().toISOString()});this.save(n)},
  remove(id){this.save(this.load().filter(x=>x.id!==id))},
  update(id,patch){this.save(this.load().map(x=>x.id===id?{...x,...patch}:x))},
  move(id,dir){const n=this.load(),i=n.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=n.length)return;[n[i],n[j]]=[n[j],n[i]];this.save(n)},
  exportText(){return this.load().map((x,i)=>`# ${i+1} ${x.title}\nDay: ${x.day||'-'} / 人物: ${x.person||'-'} / 証拠: ${x.evidence||'-'}\n${x.body}`).join('\n\n')}
 }
})();
