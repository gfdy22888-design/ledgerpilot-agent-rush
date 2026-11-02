import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173';
assert.equal((await fetch(base+'/')).status,200);
const initial=await fetch(base+'/api/state');
const cookie=initial.headers.get('set-cookie').split(';')[0];
const post=(route,value)=>fetch(base+route,{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify(value)});
assert.equal((await post('/api/run',{demo:true})).status,202);
let state;
for(let n=0;n<30;n++){
  state=await(await fetch(base+'/api/state',{headers:{cookie}})).json();
  if(state.status==='complete')break;
  await new Promise(r=>setTimeout(r,100));
}
assert.equal(state.status,'complete');
assert.equal(state.result.totals.heldCount,5);
assert.equal((await post('/api/review',{id:'INV-1002',decision:'approved'})).status,409);
assert.equal((await post('/api/review',{id:'INV-1001',decision:'approved'})).status,200);
const exported=await post('/api/export',{confirm:true});
assert.equal(exported.status,200);
const csv=await exported.text();
assert.match(csv,/INV-1001/);assert.doesNotMatch(csv,/INV-1002/);
console.log('Container serves UI, reconciles synthetic batch, enforces holds and exports approved invoices.');
