/* Node-only regression checks for the opt-in CDN delivery path. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const ts=require("typescript");
const root=path.join(__dirname,"..");
const compile=(file,imports={},ctx={})=>{
 const mod={exports:{}};
 const text=fs.readFileSync(path.join(root,file),"utf8");
 const js=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,
   jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(js,{module:mod,exports:mod.exports,require:id=>{
   if(id in imports) return imports[id];
   throw Error("Unknown mock "+id);
 }, console, ...ctx});
 return mod.exports;
};
const original="https://commons.wikimedia.org/wiki/Special:FilePath/Poliochne.jpg?width=1200";
const key="commons/0123456789abcdef01234567";
const cdnMap={[original]:{preview:key+"-preview.webp",full:key+"-full.webp"}};
let env={EXPO_PUBLIC_IMAGE_CDN_BASE_URL:"https://images.example.com/"};
const {imageCdnUrl}=compile("src/utils/imageCdn.ts",{"../data/cdnImageManifest":{cdnImageManifest:cdnMap}},{process:{env}});
assert.equal(imageCdnUrl(original,"preview"),"https://images.example.com/"+key+"-preview.webp");
assert.equal(imageCdnUrl(original,"full"),"https://images.example.com/"+key+"-full.webp");
assert.equal(imageCdnUrl(original+"bad","full"),null,"unmapped images stay on legacy sources");
env.EXPO_PUBLIC_IMAGE_CDN_BASE_URL="http://insecure.example.com";
assert.equal(imageCdnUrl(original),null,"only HTTPS public origins allowed");
env.EXPO_PUBLIC_IMAGE_CDN_BASE_URL="";
assert.equal(imageCdnUrl(original),null,"absent config leaves current delivery untouched");
env.EXPO_PUBLIC_IMAGE_CDN_BASE_URL="https://images.example.com";
const jsx=(type,props)=>({type,props});
const native={
 View:"View",Text:"Text",Image:"Image",ActivityIndicator:"ActivityIndicator",
 StyleSheet:{create:styles=>styles,absoluteFill:{position:"absolute"}}
};
let states=[],cursor=0,warnings=[];
const react={useState:initial=>{
 const index=cursor++;
 if(!(index in states))states[index]=initial;
 return [states[index],next=>{states[index]=typeof next==="function"?next(states[index]):next;}];
}};
const local=44;
const {default:ResilientImage}=compile("src/components/ResilientImage.tsx",{
 "react":react,"react/jsx-runtime":{jsx,jsxs:jsx,Fragment:"Fragment"},
 "react-native":native,"expo-image":{Image:"Image"},"../theme":{colors:{surfaceSoft:"x",textMuted:"x",border:"x"}},
 "../data/bundledLessonImages":{bundledLessonImages:{[original]:local}},
 "../utils/commonsImage":{remoteImageCandidates:uri=>[{uri:uri+"-legacy"}]},
 "../utils/imageCdn":{imageCdnUrl},
});
const walk=node=>node&&typeof node==="object"?
 [node,...[node.props?.children].flat(Infinity).flatMap(walk)]:[];
const render=(uri,rendition)=>{cursor=0;return ResilientImage({uri,rendition});};
const image=tree=>walk(tree).find(x=>x.type==="Image");
const oldWarn=console.warn;
try{
 console.warn=(...x)=>warnings.push(x);
 let tree=render(original,"preview");
 assert.equal(image(tree).props.source.uri,"https://images.example.com/"+key+"-preview.webp");
 assert.equal(image(tree).props.cachePolicy,"disk");
 image(tree).props.onError({error:"cdn unavailable"});
 tree=render(original,"preview");
 assert.equal(image(tree).props.source,local,"the already packaged asset is the fallback");
 assert.equal(warnings.length,0,"the CDN first failure doesn't show an error");
 image(tree).props.onLoad({source:{width:480,height:360}});
 tree=render(original,"preview");
 assert.equal(walk(tree).filter(n=>typeof n.type==="function").length,0,"success doesn't show placeholder");
 tree=render(original,"full");
 assert.equal(image(tree).props.source.uri,"https://images.example.com/"+key+"-full.webp",
  "changing CDN rendition resets retry state");
 env.EXPO_PUBLIC_IMAGE_CDN_BASE_URL="";
 tree=render(original,"full");
 assert.equal(image(tree).props.source,local,"without CDN the existing local source still works");
 states=[];
 tree=render("https://example.org/other.jpg","full");
 assert.equal(image(tree).props.source.uri,"https://example.org/other.jpg-legacy",
  "unmapped remote images preserve legacy delivery");
}finally{console.warn=oldWarn;}
const lessonCover=fs.readFileSync(path.join(root,"src/components/LessonCover.tsx"),"utf8");
const articleFigure=fs.readFileSync(path.join(root,"src/components/ArticleFigure.tsx"),"utf8");
const imageZoom=fs.readFileSync(path.join(root,"src/components/ImageZoomViewer.tsx"),"utf8");
assert.match(lessonCover,/rendition="preview"/);
assert.match(articleFigure,/rendition="preview"/);
assert.doesNotMatch(imageZoom,/rendition="preview"/,"zoom always loads full version");
console.log("Image CDN checks passed: opt-in HTTPS URLs, rendition mapping, CDN-first, bundled fallback, reset, reader previews and zoom.");
