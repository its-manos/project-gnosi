const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={}){const m={exports:{}};const out=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('require','module','exports',out)(id=>{assert.ok(id in imports,id);return imports[id];},m,m.exports);return m.exports;}
const math=load('src/utils/imageZoom.ts'),{ImageZoomController,containSize,clampZoom,zoomAround}=math;
const geometry={viewport:{width:400,height:600},image:{width:1200,height:1200}},p=(x,y)=>({x,y});
assert.deepEqual(containSize(geometry.image,geometry.viewport),{width:400,height:400});
assert.deepEqual(containSize({width:2400,height:600},geometry.viewport),{width:400,height:100});
assert.deepEqual(containSize({width:0,height:600},geometry.viewport),{width:0,height:0});
assert.deepEqual(clampZoom({scale:1,x:100,y:100},geometry),{scale:1,x:0,y:0});
assert.deepEqual(clampZoom({scale:2,x:999,y:-999},geometry),{scale:2,x:200,y:-100});
assert.equal(clampZoom({scale:99,x:Infinity,y:NaN},geometry).scale,6);
assert.equal(zoomAround({scale:1,x:0,y:0},2,p(300,300),p(300,300),geometry).x,-100);
const c=new ImageZoomController(geometry);
c.begin([p(150,300),p(250,300)],0);assert.equal(c.move([p(100,300),p(300,300)],10).scale,2);
const before={...c.state};c.end([p(100,300)],20);assert.deepEqual(c.state,before);c.move([p(130,330)],30);assert.equal(c.state.x,before.x+30);assert.equal(c.state.y,before.y+30);c.end([],40);c.end([],40);c.reset();
// End + Release must not erase a first tap. Native dispatches both callbacks.
for(const [start,end] of [[100,150],[250,280]]){c.begin([p(200,300)],start);c.end([],end);c.end([],end);}assert.equal(c.state.scale,2.5);
for(const [start,end] of [[400,420],[500,520]]){c.begin([p(200,300)],start);c.end([],end);c.end([],end);}assert.equal(c.state.scale,1);
c.begin([p(150,300),p(250,300)],600);c.move([p(-1000,300),p(1000,300)],650);assert.equal(c.state.scale,6);c.cancel();
assert.deepEqual(c.configure({viewport:{width:600,height:300},image:geometry.image}),{scale:1,x:0,y:0});
c.begin([p(10,10)],1000);c.move([p(150,150)],1010);c.end([],1020);c.begin([p(10,10)],1100);c.end([],1110);assert.equal(c.state.scale,1);
function harness(){let slots=[],i=0;return{react:{useState:init=>{const n=i++;if(!(n in slots))slots[n]=typeof init==='function'?init():init;return[slots[n],v=>{slots[n]=typeof v==='function'?v(slots[n]):v;}];},useRef:init=>{const n=i++;return slots[n]??={current:init};}},render:fn=>{i=0;return fn();}};}
const jsx=(type,props)=>({type,props}),nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
let links=[],closed=0;
const native={Modal:'Modal',View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',StyleSheet:{create:s=>s},Linking:{openURL:async url=>{links.push(url);}},useWindowDimensions:()=>({width:400,height:800}),PanResponder:{create:handlers=>({panHandlers:handlers})}};
const h=harness(),Viewer=load('src/components/ImageZoomViewer.tsx',{react:h.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{SafeAreaView:'SafeArea',SafeAreaProvider:'SafeProvider'},'../utils/imageZoom':math,'./ResilientImage':{__esModule:true,default:'Bitmap'},'../theme':{colors:{}}}).default;
const image={uri:'offline-plan',caption:'Κάτοψη και τομή',credit:'Δημιουργός · CC BY',creditUrl:'https://example.org/source'};
const render=()=>h.render(()=>Viewer({image,onClose:()=>{closed++;}})),byLabel=(t,label)=>nodes(t).find(n=>n.props?.accessibilityLabel===label),view=t=>nodes(t).find(n=>n.props?.testID==='image-zoom-viewport');let tree=render();
assert.equal(byLabel(tree,'Μεγέθυνση εικόνας').props.disabled,true);
view(tree).props.onLayout({nativeEvent:{layout:{width:400,height:600}}});nodes(tree).find(n=>n.type==='Bitmap').props.onDimensions({width:1200,height:1200});tree=render();assert.equal(nodes(tree).find(n=>n.type==='Bitmap').props.resizeMode,'contain');assert.equal(nodes(tree).find(n=>n.type==='Bitmap').props.uri,image.uri);
byLabel(tree,'Μεγέθυνση εικόνας').props.onPress();tree=render();assert.equal(view(tree).props.accessibilityValue.now,150);byLabel(tree,'Επαναφορά εικόνας').props.onPress();tree=render();assert.equal(byLabel(tree,'Σμίκρυνση εικόνας').props.disabled,true);
const touch=(x,y)=>({locationX:x,locationY:y}),evt=touches=>({nativeEvent:{touches}});
view(tree).props.onPanResponderGrant(evt([touch(150,300),touch(250,300)]));view(tree).props.onPanResponderMove(evt([touch(100,300),touch(300,300)]));tree=render();assert.equal(view(tree).props.accessibilityValue.now,200);
view(tree).props.onAccessibilityAction({nativeEvent:{actionName:'increment'}});tree=render();assert.equal(view(tree).props.accessibilityValue.now,300);
view(tree).props.onLayout({nativeEvent:{layout:{width:650,height:240}}});tree=render();assert.equal(view(tree).props.accessibilityValue.now,100);
byLabel(tree,'Άνοιγμα πηγής εικόνας: '+image.credit).props.onPress();assert.deepEqual(links,[image.creditUrl]);byLabel(tree,'Κλείσιμο εικόνας').props.onPress();tree.props.onRequestClose();assert.equal(closed,2);assert.ok(nodes(tree).some(n=>n.props?.accessibilityViewIsModal));
const w=harness(),Zoomable=load('src/components/ZoomableLessonImage.tsx',{react:w.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'./ImageZoomViewer':{__esModule:true,default:'Viewer'}}).default;
const draw=()=>w.render(()=>Zoomable({image,children:{type:'Thumbnail',props:{}}}));let wrapped=draw();assert.ok(!nodes(wrapped).some(n=>n.type==='Viewer'));nodes(wrapped).find(n=>n.type==='Pressable').props.onPress();wrapped=draw();assert.ok(nodes(wrapped).some(n=>n.type==='Viewer'));nodes(wrapped).find(n=>n.type==='Viewer').props.onClose();wrapped=draw();assert.ok(!nodes(wrapped).some(n=>n.type==='Viewer'));assert.ok(nodes(wrapped).some(n=>n.type==='Thumbnail'));
console.log('Image zoom passed: contain sizing, focal anchoring, bounded pinch/pan, finger transitions, double-tap native lifecycle, reset/rotation, lazy open/close, Android Back, accessible controls and attribution. Native views mocked.');
