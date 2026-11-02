import { createHash } from 'node:crypto';
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail = message => { throw Object.assign(new Error(message), {status:400}); };
const clean = (v,name) => { if(typeof v!=='string'||!v.trim()||v.length>120||/[\x00-\x1f]/.test(v)) fail(`Invalid ${name}`); return v.trim(); };
const qty = v => { if(!Number.isSafeInteger(v)||v<1||v>1000000) fail('Quantities must be positive integers <= 1000000');return v; };
export const cents = v => { if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000||Math.abs(v*100-Math.round(v*100))>1e-6) fail('Unit prices must have at most two decimals');return Math.round(v*100); };
export function validateDataset(raw) {
  if(!raw||typeof raw!=='object') fail('Dataset is required');
  const out={};
  for(const kind of ['purchaseOrders','receipts','invoices']) {
    if(!Array.isArray(raw[kind])||!raw[kind].length||raw[kind].length>300) fail(`${kind}: provide 1–300 records`);
    const ids=new Set();
    out[kind]=raw[kind].map(r=>{
      if(!r||typeof r!=='object') fail('Invalid record');
      const id=clean(r.id,'id'); if(ids.has(id)) fail(`Duplicate record id: ${id}`);ids.add(id);
      if(kind==='receipts') return {id,poId:clean(r.poId,'poId'),sku:clean(r.sku,'sku'),qty:qty(r.qty)};
      if(!['USD','EUR','GBP','CNY'].includes(r.currency)) fail('Supported currencies: USD, EUR, GBP, CNY');
      if(!Array.isArray(r.lines)||!r.lines.length||r.lines.length>50) fail('Provide 1–50 lines per document');
      const skus=new Set();
      const lines=r.lines.map(l=>{const sku=clean(l.sku,'sku');if(skus.has(sku)) fail(`Duplicate SKU in ${id}; merge lines first`);skus.add(sku);return {sku,qty:qty(l.qty),unitPrice:cents(l.unitPrice)/100};});
      return {id,...(kind==='invoices'?{poId:clean(r.poId,'poId')}:{}),supplier:clean(r.supplier,'supplier'),currency:r.currency,lines};
    });
  }
  const currencies=new Set([...out.purchaseOrders,...out.invoices].map(r=>r.currency));
  if(currencies.size!==1) fail('Use one currency per batch; currency conversion is not supported');
  let total=0;
  for(const invoice of out.invoices)for(const line of invoice.lines){total+=line.qty*cents(line.unitPrice);if(!Number.isSafeInteger(total))fail('Batch amount exceeds the exact integer-cent limit');}
  return out;
}
export function reconcile(raw) {
  const data=validateDataset(raw), orders=new Map(data.purchaseOrders.map(o=>[o.id,o])), seen=new Map(), allocated=new Map();
  const cases=data.invoices.map(invoice=>{
    const order=orders.get(invoice.poId), findings=[], evidence=[];
    const add=(code,message)=>findings.push({code,message});
    const amountCents=invoice.lines.reduce((s,l)=>s+l.qty*cents(l.unitPrice),0);
    const fingerprint=digest({poId:invoice.poId,supplier:invoice.supplier.toLowerCase(),lines:[...invoice.lines].sort((a,b)=>a.sku.localeCompare(b.sku))});
    const duplicateOf=seen.get(fingerprint); if(duplicateOf) add('DUPLICATE',`Same supplier, order and line items as ${duplicateOf}.`);else seen.set(fingerprint,invoice.id);
    if(!order) add('MISSING_PO',`Purchase order ${invoice.poId} is absent from this batch.`);
    else {
      if(order.supplier.toLowerCase()!==invoice.supplier.toLowerCase()) add('SUPPLIER_MISMATCH',`Invoice supplier differs from purchase order supplier ${order.supplier}.`);
      for(const line of invoice.lines) {
        const planned=order.lines.find(l=>l.sku===line.sku), receipts=data.receipts.filter(r=>r.poId===order.id&&r.sku===line.sku);
        const received=receipts.reduce((s,r)=>s+r.qty,0), key=`${order.id}\0${line.sku}`, previouslyAllocated=allocated.get(key)||0;
        evidence.push({sku:line.sku,invoiceId:invoice.id,poId:order.id,receiptIds:receipts.map(r=>r.id),orderedQty:planned?.qty??null,receivedQty:received,previouslyAllocatedQty:previouslyAllocated,invoicedQty:line.qty,agreedPrice:planned?.unitPrice??null,invoicedPrice:line.unitPrice});
        if(!planned) add('UNKNOWN_ITEM',`${line.sku} is not listed on ${order.id}.`);
        else {
          if(cents(line.unitPrice)!==cents(planned.unitPrice)) add('PRICE_VARIANCE',`${line.sku}: invoiced ${line.unitPrice.toFixed(2)}, agreed ${planned.unitPrice.toFixed(2)} per unit.`);
          if(line.qty+previouslyAllocated>planned.qty) add('ORDER_QUANTITY',`${line.sku}: batch quantity ${line.qty+previouslyAllocated} exceeds ordered quantity ${planned.qty}.`);
        }
        if(line.qty+previouslyAllocated>received) add('RECEIPT_SHORTFALL',`${line.sku}: ${line.qty} invoiced, ${Math.max(0,received-previouslyAllocated)} received units remain unallocated.`);
      }
    }
    const status=findings.length?'held':'ready';
    // Only clean invoices reserve receipts. Held documents never consume the allocation.
    if(status==='ready') for(const l of invoice.lines){const key=`${invoice.poId}\0${l.sku}`;allocated.set(key,(allocated.get(key)||0)+l.qty);}
    return {id:invoice.id,poId:invoice.poId,supplier:invoice.supplier,currency:invoice.currency,amountCents,status,decision:'pending',findings,evidence,summary:status==='ready'?'Purchase order, receipt and invoice agree. Ready for human review.':findings.map(f=>f.message).join(' '),draft:status==='held'?`Subject: Please clarify ${invoice.id}\n\nHello ${invoice.supplier},\n\nWe are reviewing invoice ${invoice.id} against ${invoice.poId}.\n${findings.map(f=>`- ${f.message}`).join('\n')}\n\nPlease provide the missing evidence or a corrected invoice. This is a draft for human review.\n\nThank you.`:null};
  });
  return {currency:data.invoices[0].currency,inputHash:digest(data),cases,totals:{count:cases.length,readyCount:cases.filter(c=>c.status==='ready').length,heldCount:cases.filter(c=>c.status==='held').length,totalCents:cases.reduce((s,c)=>s+c.amountCents,0),readyCents:cases.filter(c=>c.status==='ready').reduce((s,c)=>s+c.amountCents,0),heldCents:cases.filter(c=>c.status==='held').reduce((s,c)=>s+c.amountCents,0)}};
}
export function appendAudit(state,action,details={}) {
  const entry={index:state.audit.length+1,at:new Date().toISOString(),action,details,previous:state.audit.at(-1)?.hash||'0'.repeat(64)};
  entry.hash=digest(entry);state.audit.push(entry);return entry;
}
export function verifyAudit(entries) {
  let previous='0'.repeat(64);
  return entries.every((entry,index)=>{const {hash,...payload}=entry;const valid=entry.index===index+1&&entry.previous===previous&&digest(payload)===hash;previous=hash;return valid;});
}
export const csvCell = value => {let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function exportCSV(state) {
  const rows=[['Invoice','Purchase order','Supplier','Currency','Amount','Decision']];
  for(const c of state.result.cases.filter(c=>c.decision==='approved'&&c.status==='ready'))rows.push([c.id,c.poId,c.supplier,c.currency,(c.amountCents/100).toFixed(2),'reviewed_for_export']);
  return rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
