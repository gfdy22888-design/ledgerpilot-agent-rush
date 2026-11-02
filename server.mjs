import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,unlinkSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {demo} from './lib/demo.mjs';
import {reconcile,validateDataset,appendAudit,exportCSV} from './lib/reconcile.mjs';
import {explainCases} from './lib/agent.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp(options={}) {
  const dataDir=path.resolve(options.dataDir||process.env.DATA_DIR||path.join(root,'data'));
  mkdirSync(dataDir,{recursive:true,mode:0o700});
  const origin=options.origin||process.env.PUBLIC_ORIGIN||'http://127.0.0.1:4173';
  const states=new Map(),active=new Set(),ttl=86400000;
  const persist=s=>{const file=path.join(dataDir,s.id+'.json'),tmp=file+'.tmp';writeFileSync(tmp,JSON.stringify(s),{mode:0o600});renameSync(tmp,file);};
  const safeState=s=>({status:s.status,result:s.result,audit:s.audit,steps:s.steps,engine:s.engine,error:s.error,updatedAt:s.updatedAt,customData:options.allowCustom??(process.env.ALLOW_CUSTOM_DATA==='true')});
  const cleanup=()=>{for(const name of readdirSync(dataDir)){if(!/^[a-f0-9]{48}\.json$/.test(name))continue;const file=path.join(dataDir,name);if(Date.now()-statSync(file).mtimeMs>ttl&&!active.has(name.slice(0,-5))){unlinkSync(file);states.delete(name.slice(0,-5));}}};
  cleanup();const timer=setInterval(cleanup,3600000);timer.unref();
  function getSession(req,res){
    let id=req.headers.cookie?.match(/(?:^|;\s*)lp_session=([a-f0-9]{48})(?:;|$)/)?.[1];
    if(id&&!states.has(id)){try{const s=JSON.parse(readFileSync(path.join(dataDir,id+'.json'),'utf8'));if(Date.now()-new Date(s.updatedAt).getTime()>ttl)id=null;else{if(s.status==='running'){s.status='error';s.error='Run interrupted by server restart. Start a new reconciliation.';}states.set(id,s);}}catch{id=null;}}
    if(!id){id=randomBytes(24).toString('hex');states.set(id,{id,status:'idle',result:null,audit:[],steps:[],engine:{mode:'not-run'},updatedAt:new Date().toISOString()});res.setHeader('Set-Cookie',`lp_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${origin.startsWith('https:')?'; Secure':''}`);}
    return states.get(id);
  }
  async function body(req){
    if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('JSON content type required'),{status:415});
    let text='',size=0;for await(const chunk of req){size+=chunk.length;if(size>500000)throw Object.assign(new Error('Upload limit: 500 KB'),{status:413});text+=chunk;}
    let value;try{value=JSON.parse(text);}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}
    if(!value||typeof value!=='object'||Array.isArray(value))throw Object.assign(new Error('JSON object required'),{status:400});
    return value;
  }
  async function run(s,dataset){
    active.add(s.id);const step=(title,detail)=>{s.steps.push({title,detail,at:new Date().toISOString()});s.updatedAt=new Date().toISOString();persist(s);};
    try{
      step('Validate documents',`${dataset.purchaseOrders.length} purchase orders · ${dataset.receipts.length} receipts · ${dataset.invoices.length} invoices`);
      s.result=reconcile(dataset);appendAudit(s,'reconciled',{inputHash:s.result.inputHash,totals:s.result.totals});
      step('Match source evidence',`${s.result.totals.readyCount} matched · ${s.result.totals.heldCount} held for review`);
      step('Prepare explanations','Verified amounts and verdicts stay under the reconciliation engine.');
      try{s.engine=await explainCases(s.result,{key:process.env.VULTR_INFERENCE_KEY,model:process.env.VULTR_INFERENCE_MODEL});}
      catch{ s.engine={mode:'rules-fallback',message:'AI service unavailable or returned an invalid response. Verified rules and template drafts are retained.'}; }
      appendAudit(s,'explanations_prepared',{mode:s.engine.mode});
      step('Stage review packet','No payments or emails sent. Clean matches require your approval before export.');
      s.status='complete';s.updatedAt=new Date().toISOString();persist(s);
    }catch{ s.status='error';s.error='Reconciliation failed. Check the dataset and retry.';persist(s); }
    finally{active.delete(s.id);}
  }
  const server=http.createServer(async(req,res)=>{
    const send=(status,value,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(type.startsWith('application/json')?JSON.stringify(value):value);};
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/healthz')return send(200,{ok:true,service:'ledgerpilot'});
      if(req.method==='POST'&&req.headers.origin!==origin)return send(403,{error:'Request origin is not allowed'});
      if(url.pathname.startsWith('/api/')){
        const s=getSession(req,res);
        if(req.method==='GET'&&url.pathname==='/api/state')return send(200,safeState(s));
        if(req.method==='GET'&&url.pathname==='/api/sample')return send(200,demo);
        if(req.method==='POST'&&url.pathname==='/api/run'){
          if(s.status==='running'||active.size>=3)return send(429,{error:'A run is in progress. Please wait.'});
          if(s.lastRun&&Date.now()-s.lastRun<10000)return send(429,{error:'Please wait 10 seconds between runs.'});
          const input=await body(req);const allow=options.allowCustom??(process.env.ALLOW_CUSTOM_DATA==='true');
          if(s.status==='running'||active.size>=3)return send(429,{error:'A run is in progress. Please wait.'});
          if(s.lastRun&&Date.now()-s.lastRun<10000)return send(429,{error:'Please wait 10 seconds between runs.'});
          if(!input.demo&&!allow)return send(403,{error:'This public demo accepts synthetic data only.'});
          const dataset=validateDataset(input.demo?demo:input.dataset);
          s.status='running';s.result=null;s.error=null;s.audit=[];s.steps=[];s.engine={mode:'pending'};s.updatedAt=new Date().toISOString();s.lastRun=Date.now();
          appendAudit(s,'run_started',{source:input.demo?'synthetic-demo':'user-upload'});persist(s);
          send(202,safeState(s));void run(s,dataset);return;
        }
        if(req.method==='POST'&&url.pathname==='/api/review'){
          if(s.status!=='complete')return send(409,{error:'Finish reconciliation before review.'});
          const input=await body(req);
          if(s.status!=='complete')return send(409,{error:'Finish reconciliation before review.'});
          const c=s.result.cases.find(c=>c.id===input.id);
          if(!c)return send(404,{error:'Invoice not found'});
          if(input.decision==='approved'&&c.status!=='ready')return send(409,{error:'Held invoices cannot enter the export. Correct the source documents and rerun.'});
          if(!['approved','follow-up','pending'].includes(input.decision))return send(400,{error:'Invalid decision'});
          c.decision=input.decision;appendAudit(s,'human_review',{invoice:c.id,decision:c.decision});s.updatedAt=new Date().toISOString();persist(s);return send(200,safeState(s));
        }
        if(req.method==='POST'&&url.pathname==='/api/export'){
          if(s.status!=='complete')return send(409,{error:'No completed run'});
          const input=await body(req);if(input.confirm!==true)return send(400,{error:'Explicit review confirmation required'});
          if(s.status!=='complete')return send(409,{error:'No completed run'});
          if(!s.result.cases.some(c=>c.decision==='approved'&&c.status==='ready'))return send(409,{error:'Approve at least one clean invoice first'});
          appendAudit(s,'review_exported',{invoices:s.result.cases.filter(c=>c.decision==='approved').map(c=>c.id)});s.updatedAt=new Date().toISOString();persist(s);res.setHeader('Content-Disposition','attachment; filename="ledgerpilot-reviewed.csv"');return send(200,exportCSV(s),'text/csv; charset=utf-8');
        }
        if(req.method==='GET'&&url.pathname==='/api/evidence'){
          if(!s.result)return send(409,{error:'Run reconciliation first'});
          res.setHeader('Content-Disposition','attachment; filename="ledgerpilot-evidence.json"');return send(200,{...safeState(s),notice:'Synthetic demo or user-supplied batch; advisory review only. Audit hashes are verifiable within this packet, not independently notarized.'});
        }
        return send(404,{error:'Not found'});
      }
      const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/icon.svg':'icon.svg'};
      const file=files[url.pathname];if(req.method!=='GET'||!file)return send(404,'Not found','text/plain');
      const type=file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'text/css';
      return send(200,readFileSync(path.join(root,'public',file)),type+'; charset=utf-8');
    }catch(error){if(!res.headersSent)send(error.status||500,{error:error.status?error.message:'Request failed'});else res.end();}
  });
  server.on('close',()=>clearInterval(timer));return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4173);createApp().listen(port,host,()=>console.log(`LedgerPilot Local: http://${host}:${port}`));}
