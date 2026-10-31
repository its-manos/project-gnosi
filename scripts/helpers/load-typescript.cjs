/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),cache=new Map();
function load(file,overrides={}){
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Date,Intl,console,setTimeout,clearTimeout,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const target=path.normalize(path.join(path.dirname(file),id));return load(target+(fs.existsSync(path.join(root,target+'.ts'))?'.ts':'.tsx'));}
  throw Error(id);
 }});if(!Object.keys(overrides).length)cache.set(file,module.exports);return module.exports;
}
module.exports={load};
