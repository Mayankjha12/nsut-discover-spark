process.chdir(require('node:path').resolve(__dirname, '..'));
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function compile(file){return ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;}
function load(file, imports={}) {const exports={};vm.runInNewContext(compile(file),{exports,require:key=>imports[key],Date,URL,Set});return exports;}
const d=load('src/domain/academic.ts'),s=load('src/domain/session.ts'),p=load('src/domain/portal.ts');
let cursor=0, timerId=0, stored=null, data={version:1,history:[]}, cookieClears=0, saves=0;
const slots=[], effects=[],timers=new Map(),navigations=[];
const hooks={
  createContext:()=>({Provider:'Context'}),useContext(){},
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
  useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
  useEffect(fn,deps){const i=cursor++,last=slots[i];if(!last||deps.some((d,j)=>d!==last.deps[j])){last?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn();});}},
};
const storage={session:async()=>stored,read:async()=>data,saveSession:async v=>{assert(s.readSession(v));stored=v;},clear:async()=>{stored=null;data={version:1,history:[]};},save:async v=>{data=v;saves++;}};
const jsx=(type,props)=>({type,props});
const imports={react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{Platform:{OS:'android'},View:'View',AppState:{addEventListener:()=>({remove(){}})}},'react-native-webview':{WebView:'WebView'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'expo-router':{useRouter:()=>({replace:p=>navigations.push(p)}),usePathname:()=>'/login'},'./portal-cookies':{clearPortalCookies:async()=>{cookieClears++;},flushPortalCookies:async()=>{}},'./ims-auto':{automaticPortal:(id,collect)=>JSON.stringify({id,collect})},'./domain/portal':p,'./domain/session':s,'./domain/academic':d,'./storage':{storage},'./query-client':{queryClient:{clear(){},invalidateQueries:async()=>{}}}};
const exported={};
vm.runInNewContext(compile('src/ims-session.tsx'),{exports:exported,require:k=>{assert(k in imports,k);return imports[k];},Date,Math,Set,setInterval:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},clearInterval:id=>timers.delete(id)});
function render(){cursor=0;const tree=exported.IMSSessionProvider({children:null});while(effects.length)effects.shift()();return tree;}
function find(t,type){if(!t||typeof t!=='object')return;if(t.type===type)return t;for(const child of [t.props?.children].flat(Infinity)){const found=find(child,type);if(found)return found;}}
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
let nonce;
function web(){const t=render();const w=find(t,'WebView');if(w)w.props.ref.current={reload(){},injectJavaScript(script){nonce=JSON.parse(script).id;}};return w?.props;}
async function send(payload,url=p.IMS_URL){web().onMessage({nativeEvent:{url,data:JSON.stringify({requestId:nonce,...payload})}});await flush();}
(async()=>{
  render();await flush();web();for(const t of timers.values())t.fn();
  for (const data of ['null', '[]', '7', 'not-json']) web().onMessage({nativeEvent:{url:p.IMS_URL,data}});
  assert.equal(cookieClears,1);assert.equal(render().props.value.session,null);
  await send({type:'authenticated',roll:'invalid'});assert.equal(stored,null);
  await send({type:'authenticated',roll:'2023UCS1234'},'https://evil.test');assert.equal(stored,null);
  await send({type:'authenticated',roll:'2023UCS1234',requestId:'stale'});assert.equal(stored,null);
  await send({kind:'attendance',roll:'2023UCS1234',rows:[{code:'A',present:3,total:4}]});assert.equal(saves,0);
  await send({type:'authenticated',roll:'2023UCS1234'});assert.equal(stored.roll,'2023UCS1234');const expiry=stored.expiresAt;
  await send({kind:'attendance',roll:'2024UCS4567',rows:[{code:'A',present:3,total:4}]});assert.equal(saves,0);
  await send({kind:'attendance',roll:'2023UCS1234',rows:[{code:'A',present:3,total:4}]});assert.equal(saves,1);
  await send({type:'authenticated',roll:'2023UCS1234'});assert.equal(stored.expiresAt,expiry,'Background reads must not slide expiry');
  await send({type:'complete'});assert.equal(navigations.at(-1),'/(tabs)');
  console.log('PASS native bridge rejects untrusted origin/nonce/identity and serializes automatic saves before navigation');
  web().onLoadStart();for(const t of timers.values())t.fn();
  await send({type:'authenticated',roll:'2024UCS4567'});assert.equal(data.attendance,undefined);assert.equal(stored.roll,'2024UCS4567');
  console.log('PASS switching accounts clears old academic records');
  await render().props.value.logout();assert.equal(stored,null);assert.equal(cookieClears,2);assert.equal(navigations.at(-1),'/login');
  console.log('PASS logout clears local access, academic records and browser cookies');
})().catch(e=>{console.error(e);process.exitCode=1;});
