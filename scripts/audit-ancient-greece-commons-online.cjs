"use strict";
/*
 * Read-only comparison of in-app image credits with CURRENT Wikimedia Commons
 * file metadata. Requires Node >=18 and outbound access to Commons.
 *
 * node scripts/audit-ancient-greece-commons-online.cjs
 * node scripts/audit-ancient-greece-commons-online.cjs --csv > /tmp/gnosi-commons-screen.csv
 * node scripts/audit-ancient-greece-commons-online.cjs --json > /tmp/gnosi-commons-screen.json
 *
 * Screen only. A matching short licence string is NEVER rights clearance.
 * Confirm the actual original grant, creators, legal restrictions, derivative
 * terms, model/property rights and attribution on both physical devices.
 */
const {execFileSync} = require("node:child_process");
const path = require("node:path");
const base = path.resolve(__dirname,"audit-ancient-greece-image-rights.cjs");
const rows = JSON.parse(execFileSync(process.execPath,[base,"--json"],{
  encoding:"utf8",maxBuffer:15*1024*1024
})).rows;
const endpoint = "https://commons.wikimedia.org/w/api.php";
const timeoutMs = 20000;
function titleFromPage(url){
  if(!url)return null;
  try{
    const u=new URL(url);
    if(u.hostname!=="commons.wikimedia.org")return null;
    let pathname=decodeURIComponent(u.pathname);
    let match=pathname.match(/^\/wiki\/(File:.*)$/i);
    if(!match)match=pathname.match(/^\/wiki\/Special:FilePath\/(.+)$/i);
    if(!match)return null;
    return match[1].startsWith("File:")?match[1].replace(/_/g," "):"File:"+match[1].replace(/_/g," ");
  }catch{return null;}
}
const norm=t=>String(t||"").replace(/_/g," ").normalize("NFC").replace(/\s+/g," ").toLowerCase().trim();
const titles=[...new Set(rows.map(r=>titleFromPage(r.sourcePage)).filter(Boolean))];
const batchSize=10;
const batches=[];
for(let i=0;i<titles.length;i+=batchSize)batches.push(titles.slice(i,i+batchSize));
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function fetchBatch(batch){
  const u=new URL(endpoint);
  for(const [k,v] of Object.entries({
    action:"query",format:"json",formatversion:"2",redirects:"1",prop:"imageinfo",
    iiprop:"extmetadata|url",titles:batch.join("|")
  }))u.searchParams.set(k,v);
  for(let attempt=0;attempt<3;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeoutMs);
      let response;
      try{
        response=await fetch(u,{
          signal:controller.signal,
          headers:{"Accept":"application/json","User-Agent":"GnosiCurriculumAudit/1.0 (https://github.com/its-manos/project-gnosi; image-source verification)"}
        });
      }finally{clearTimeout(timer);}
      if(!response.ok)throw Error("Commons HTTP "+response.status);
      const result=await response.json();
      if(result.error)throw Error("Commons API "+(result.error.code||"error")+": "+(result.error.info||""));
      const byPage=new Map((result.query?.pages||[]).map(p=>[norm(p.title),p]));
      const aliases=new Map();
      for(const pair of [...(result.query?.normalized||[]),...(result.query?.redirects||[])])
        aliases.set(norm(pair.from),norm(pair.to));
      const map=new Map();
      for(const title of batch){
        let key=norm(title);
        const seen=new Set();
        while(aliases.has(key) && !seen.has(key)){seen.add(key);key=aliases.get(key);}
        const page=byPage.get(key);
        const meta=page?.imageinfo?.[0]?.extmetadata||{};
        const val=k=>String(meta[k]?.value||"").replace(/<[^>]*>/g," ").trim();
        map.set(title,{
          error:page?.missing?"MISSING_FILE":(!page?.imageinfo?"NO_IMAGEINFO":null),
          fileTitle:page?.title||title,
          commonsLicence:val("LicenseShortName"),
          commonsLicenceUrl:val("LicenseUrl"),
          commonsUsageTerms:val("UsageTerms"),
          commonsArtist:val("Artist"),
          commonsAttribution:val("Attribution"),
          commonsCopyright:val("Copyrighted")
        });
      }
      return map;
    }catch(e){
      if(attempt===2)return new Map(batch.map(t=>[t,{error:String(e.message||e)}]));
      await sleep(600*(attempt+1));
    }
  }
}
async function main(){
  const fetched=new Map();
  const workers=3;
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(workers,batches.length)},async()=>{
    while(cursor<batches.length){
      const batch=batches[cursor++];
      for(const [k,v] of (await fetchBatch(batch)))fetched.set(k,v);
    }
  }));
  const reviewed=rows.map(r=>{
    const title=titleFromPage(r.sourcePage);
    const c=title?fetched.get(title):null;
    const flags=[];
    let label="";
    if(!title)flags.push("SOURCE_NOT_COMMONS_FILE_PAGE");
    else if(!c||c.error)flags.push("COMMONS_LOOKUP_ERROR:"+String(c?.error||"unknown"));
    else{
      label=c.commonsLicence;
      const expected=r.declaredLicence;
      const simplified=v=>String(v||"").toUpperCase()
        .replace(/ATTRIBUTION[-\s]+SHARE[-\s]*ALIKE/g,"CC BY-SA")
        .replace(/ATTRIBUTION/g,"CC BY")
        .replace(/CREATIVE COMMONS/g,"")
        .replace(/INTERNATIONAL/g,"").replace(/[^\w\d]+/g," ").trim();
      if(expected==="special-commercial-permission-declared"){
        flags.push("CUSTOM_PERMISSION_REVIEW");
      }else if(expected==="public-domain-declared"){
        if(!/PUBLIC DOMAIN|PD[-\s]|CC0/i.test(label))flags.push("DECLARED_PUBLIC_DOMAIN_LABEL_NOT_CONFIRMED");
      }else if(expected==="CC0"){
        if(!/CC0|CC ZERO|PUBLIC DOMAIN/i.test(label))flags.push("DECLARED_CC0_LABEL_NOT_CONFIRMED");
      }else if(expected==="UNKNOWN")flags.push("UNKNOWN_IN_APP_LICENCE");
      else if(simplified(expected)!==simplified(label)){
        flags.push("LICENCE_LABEL_DIFFERENCE");
      }
    }
    if(/UPSTREAM LICENCE-VERSION CONFLICT/.test(r.notes))
      flags.push("UPSTREAM_PENN_RIGHTS_CONFLICT_REVIEW");
    return {
      lesson:r.lessonId,placement:r.imageKind,sourcePage:r.sourcePage,
      declaredLicence:r.declaredLicence,commonsLicence:label,
      commonsLicenceUrl:c?.commonsLicenceUrl||"",commonsArtist:c?.commonsArtist||"",
      commonsAttribution:c?.commonsAttribution||"",appCredit:r.appCredit,
      flags:flags.join(" | "),status:"UNVERIFIED"
    };
  });
  const stats={};
  for(const r of reviewed){
    const k=r.flags?"FLAGGED_FOR_HUMAN_REVIEW":"LABEL_MATCH_ONLY";
    stats[k]=(stats[k]||0)+1;
  }
  const failed=reviewed.filter(r=>r.flags.includes("COMMONS_LOOKUP_ERROR")||r.flags.includes("SOURCE_NOT_COMMONS_FILE_PAGE"));
  if(process.argv.includes("--json")){
    console.log(JSON.stringify({total:reviewed.length,uniqueCommonsTitles:titles.length,stats,rows:reviewed,
      notice:"A label match does not verify upstream rights, commercial use, attribution or device behavior. All statuses remain UNVERIFIED."},null,2));
  }else if(process.argv.includes("--csv")){
    const columns=Object.keys(reviewed[0]||{});
    const cv=v=>'"'+String(v??"").replace(/"/g,'""').replace(/[\r\n]+/g," ")+'"';
    console.log(columns.map(cv).join(","));
    for(const r of reviewed)console.log(columns.map(k=>cv(r[k])).join(","));
    console.error("Commons screen: "+reviewed.length+" placements, "+titles.length+" unique files; "+JSON.stringify(stats)+"; all UNVERIFIED.");
  }else{
    console.log("Commons online screening: "+reviewed.length+" placements, "+titles.length+" unique file titles.");
    console.log("Results: "+JSON.stringify(stats)+"; all statuses remain UNVERIFIED.");
    for(const r of reviewed.filter(r=>r.flags))
      console.log("  "+r.lesson+"/"+r.placement+": "+r.declaredLicence+" | Commons: "+(r.commonsLicence||"?")+" | "+r.flags);
    console.log("Full details: rerun with --csv or --json.");
    console.log("This is metadata comparison, NOT legal, upstream or device clearance.");
  }
  if(failed.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
