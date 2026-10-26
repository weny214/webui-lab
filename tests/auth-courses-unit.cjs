// Lightweight DOM/service doubles. Does NOT test real browser layout or Supabase RLS.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const script = fs.readFileSync(path.join(root,'script.js'),'utf8');
const auth = fs.readFileSync(path.join(root,'js/auth.js'),'utf8');
module.exports = (async () => {
const elements = new Map();
class Element {
  constructor() { this.value='';this.textContent='';this.innerHTML='';this.hidden=false;this.children=[];this.style={};this.listeners={};this.disabled=false;this.className='';const names=new Set();this.classList={add:n=>names.add(n),remove:n=>names.delete(n),contains:n=>names.has(n)}; }
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.append(node);}
  replaceChildren(...nodes){this.children=nodes;this.textContent='';this.innerHTML='';}
  addEventListener(name,fn){this.listeners[name]=fn;}
  focus(){}
  reset(){}
}
const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
const gated=[new Element(),new Element()];
const document={getElementById:get,createElement:()=>new Element(),querySelectorAll:q=>q==='[data-auth-required]'?gated:[]};
const window={scrollTo(){}};
const storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
let owner='A',rows=[],fail=false,pending=null,counter=0;
const courseService={
 list:async()=>pending ? await pending : rows.filter(r=>r.user_id===owner).map(r=>({...r})),
 create:async(user_id,values)=>{if(fail)throw new Error('network failure');const row={...values,user_id,id:String(++counter),deleted_at:null};rows.push(row);return {...row}},
 update:async(id,values)=>{if(fail)throw new Error('network failure');const row=rows.find(r=>r.id===id&&r.user_id===owner);if(!row)throw new Error('not found');Object.assign(row,values);return {...row}}
};
const studyClient={auth:{onAuthStateChange(){},async signOut(){return {}}}};
window.studyClient=studyClient;
const api=new Function('document','window','localStorage','courseService','studyClient','location','setTimeout','clearInterval','setInterval','alert','confirm',
script+'\n'+auth+'\nreturn {applySession,addCourse,editCourse,deleteCourse,saveData,loadLocalFeatures, getState:()=>({courses,todos,calendarEvents,currentUser}), setLocal:()=>{todos=[{id:1,text:"private A",date:"2026-10-28",completed:false}];saveData();}};'
)(document,window,localStorage,courseService,studyClient,{href:'http://localhost:7777/'},()=>{},()=>{},()=>1,()=>{},()=>true);
function check(condition,message){if(!condition)throw new Error(message);}
await api.applySession({user:{id:'A',email:'a@example.com'}});
check(gated.every(e=>!e.hidden),'login gate');
get('course-name').value='<img src=x onerror=alert(1)>';
get('course-color').value='#8D7B68';get('course-teacher').value='老師';get('course-classroom').value='科三209';
await api.addCourse({preventDefault(){}});
check(rows.length===1,'insert cloud');
check(get('course-list-container').children[0].children[0].textContent==='<img src=x onerror=alert(1)>','text node rendering');
api.editCourse('1');get('course-name').value='OS';await api.addCourse({preventDefault(){}});
check(rows[0].name==='OS','edit cloud');
fail=true;get('course-name').value='keep input';await api.addCourse({preventDefault(){}});
check(get('course-name').value==='keep input','failed save preserves input');
check(get('course-status').textContent.includes('失敗'),'failed save status');fail=false;
api.setLocal();get('calendar-view-container').textContent='private calendar';
await api.applySession(null);
check(gated.every(e=>e.hidden),'logout gate');
check(get('calendar-view-container').textContent==='','logout calendar cleared');
owner='B';await api.applySession({user:{id:'B'}});
check(api.getState().courses.length===0,'B courses separate');
check(api.getState().todos.length===0,'B local data separate');
owner='A';await api.applySession({user:{id:'A'}});
check(api.getState().todos[0].text==='private A','A local data restored');
await api.deleteCourse('1');
check(!!rows[0].deleted_at,'soft delete cloud');
check(get('course-list-container').children.length===0,'soft delete hides active card');
await api.applySession(null);
let resolve;pending=new Promise(r=>{resolve=r});
const oldRequest=api.applySession({user:{id:'A'}});
await api.applySession(null);pending=null;owner='B';
await api.applySession({user:{id:'B'}});
resolve([{id:'old',name:'stale A',user_id:'A'}]);await oldRequest;
check(api.getState().courses.length===0,'stale response rejected');
check(api.getState().currentUser.id==='B','stale response preserves user');
console.log('PASS: cloud create/edit/soft-delete with mocked service; text-node rendering; failed-save preservation; logout clearing; account-local isolation; stale response rejection.');

})().catch(error => {console.error(error);process.exitCode=1;});
