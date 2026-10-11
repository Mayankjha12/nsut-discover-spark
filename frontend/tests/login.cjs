// Exercise native WebView event handling with deterministic clocks; no portal requests.
process.chdir(require('node:path').resolve(__dirname, '..'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function compile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
}
const portal = {};
vm.runInNewContext(compile('src/domain/portal.ts'), {exports:portal,URL});
let cursor = 0, sequence = 0;
const slots = [], timers = new Map(), links = [];
const hooks = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = {current:initial}; return slots[i]; },
  useEffect() {},
};
const jsx = (type, props) => ({type,props});
const dependencies = {
  react:hooks,
  'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-native':{Platform:{OS:'android'},StyleSheet:{create:v=>v},Linking:{openURL:async url=>links.push(url)},ActivityIndicator:'Spinner',ScrollView:'ScrollView',Text:'Text',View:'View'},
  'react-native-webview':{WebView:'WebView'},
  'expo-router':{useRouter:()=>({replace(){}})},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},
  '@/src/ims-scraper':{isIMSUrl:portal.isIMSUrl},
  '@/src/domain/portal':portal,
  '@/src/domain/academic':{}, '@/src/storage':{}, '@/src/query-client':{},
  '@/src/components/campus':{Button:'Button',Card:'Card',Message:'Message',Page:'Page',ui:{}},
};
const exported = {};
const setTimer = (callback, delay) => { const id=++sequence; timers.set(id,{callback,delay}); return id; };
vm.runInNewContext(compile('app/login.tsx'), {exports:exported,require:name=>{assert(name in dependencies,name);return dependencies[name];},setInterval:setTimer,setTimeout:setTimer,clearInterval:id=>timers.delete(id),clearTimeout:id=>timers.delete(id),Date,Math});
function render() { cursor=0; return exported.default(); }
function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) { const result=find(child,predicate); if (result) return result; }
}
const component = type => find(render(),node=>node.type===type);
const button = label => find(render(),node=>node.type==='Button' && node.props.label===label);
const text = value => find(render(),node=>node.type==='Text' && node.props.children===value);
let reloads = 0, injected = '';
component('WebView').props.ref.current = {reload(){reloads++;},injectJavaScript(script){injected=script;}};
const web = () => component('WebView').props;
function health(content, staleId) {
  [...timers.values()].find(t=>t.delay===1500)?.callback();
  const requestId=staleId ?? JSON.parse(injected.match(/\)\((".*")\); true;$/)[1]);
  web().onMessage({nativeEvent:{url:portal.IMS_URL,data:JSON.stringify({type:'portal-health',requestId,content})}});
  return requestId;
}
assert(component('WebView'), 'Native login must open immediately');
assert(button('Save a report').props.disabled);
assert(web().onShouldStartLoadWithRequest({url:'about:blank'}));
assert(!web().onShouldStartLoadWithRequest({url:'https://attacker.test'}));
web().onLoadStart();
const oldId = health(false);
assert(text('Opening IMS…'));
[...timers.values()].find(t=>t.delay===25000).callback();
assert(text('IMS isn’t loading right now'));
assert(text('IMS returned an empty page instead of the sign-in form. Please try again later or check the official portal in your browser.'));
assert.equal(timers.size,0);
health(true,oldId);
assert(text('IMS isn’t loading right now'), 'Late health response must not clear a failed load');
button('Try again').props.onPress();
assert.equal(reloads,1);
health(true);
assert.equal(timers.size,0);
assert(!button('Save a report').props.disabled);
assert(!text('Opening IMS…'));
web().onLoadStart();
let prevented=false;
web().onError({preventDefault(){prevented=true;}});
assert(prevented);
assert(text('IMS isn’t loading right now'));
assert(button('Save a report').props.disabled);
button('Open IMS in browser').props.onPress();
assert.deepEqual(links,[portal.IMS_URL]);
assert.equal(timers.size,0);
console.log('PASS native login: immediate entry, navigation boundary, blank timeout, late response, retry, ready, network failure and browser fallback');
