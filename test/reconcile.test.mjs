import test from 'node:test';
import assert from 'node:assert/strict';
import {demo} from '../lib/demo.mjs';
import {reconcile,validateDataset,appendAudit,verifyAudit,exportCSV,csvCell} from '../lib/reconcile.mjs';
import {explainCases} from '../lib/agent.mjs';
test('sample produces known independent accounting totals and specific exceptions',()=>{
  const r=reconcile(demo);
  assert.deepEqual(r.totals,{count:8,readyCount:3,heldCount:5,totalCents:1105000,readyCents:478000,heldCents:627000});
  for(const [id,code] of [['INV-1002','RECEIPT_SHORTFALL'],['INV-1003','PRICE_VARIANCE'],['INV-1005','DUPLICATE'],['INV-1007','MISSING_PO'],['INV-1008','SUPPLIER_MISMATCH']])assert.ok(r.cases.find(c=>c.id===id).findings.some(f=>f.code===code));
});
test('partial invoices cannot collectively over-allocate receipt or order quantities',()=>{
  const d=structuredClone(demo);d.invoices=d.invoices.slice(0,1);d.invoices[0].lines[0].qty=120;const second=structuredClone(d.invoices[0]);second.id='INV-PART2';second.lines[0].qty=100;d.invoices.push(second);
  const r=reconcile(d);assert.equal(r.cases[0].status,'ready');assert.equal(r.cases[1].status,'held');assert.equal(r.cases[1].evidence[0].previouslyAllocatedQty,120);
});
test('malformed prices, duplicate IDs, duplicate SKU and mixed currencies rejected',()=>{
  for(const mutate of [d=>d.invoices[0].lines[0].unitPrice=NaN,d=>d.invoices[0].lines[0].unitPrice=1.001,d=>d.invoices[0].lines[0].qty=-2,d=>d.invoices[1].id=d.invoices[0].id,d=>d.invoices[0].currency='EUR',d=>d.invoices[0].lines.push({...d.invoices[0].lines[0]})]){const d=structuredClone(demo);mutate(d);assert.throws(()=>validateDataset(d));}
});
test('audit tampering detected and only explicitly reviewed clean invoices export',()=>{
  const s={audit:[],result:reconcile(demo)};appendAudit(s,'created');appendAudit(s,'human_review',{invoice:'INV-1001',decision:'approved'});assert.ok(verifyAudit(s.audit));s.audit[0].action='tampered';assert.equal(verifyAudit(s.audit),false);
  s.result.cases[0].decision='approved';s.result.cases[1].decision='approved';const csv=exportCSV(s);assert.match(csv,/INV-1001/);assert.doesNotMatch(csv,/INV-1002/);assert.match(csvCell('=HYPERLINK("evil")'),/^"'/);
});
test('AI text cannot overwrite status or financial values; invalid batch is atomic',async()=>{
  const result=reconcile(demo),before=structuredClone(result),fake=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({cases:result.cases.map(c=>({id:c.id,summary:'Review the evidence.',draft:null,status:'ready',amountCents:0}))})}}]})});
  await explainCases(result,{key:'test',model:'test',fetchImpl:fake});assert.equal(result.cases[1].status,'held');assert.equal(result.cases[1].amountCents,before.cases[1].amountCents);
  const r=reconcile(demo);await assert.rejects(()=>explainCases(r,{key:'test',model:'test',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({cases:[{id:r.cases[0].id,summary:'changed'}]})}}]})})}));assert.deepEqual(r,before);
});
