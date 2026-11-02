const po = (id,supplier,sku,qty,unitPrice) => ({id,supplier,currency:'USD',lines:[{sku,qty,unitPrice}]});
const inv = (id,poId,supplier,sku,qty,unitPrice) => ({id,poId,supplier,currency:'USD',lines:[{sku,qty,unitPrice}]});
export const demo = {
  purchaseOrders:[po('PO-2401','Northstar Materials','STEEL-12',200,12.5),po('PO-2402','Harbor Electric','CABLE-08',100,18),po('PO-2403','Kinetic Supply','PUMP-02',20,75),po('PO-2404','Northstar Materials','CEMENT-01',120,9),po('PO-2405','Alloy Works','VALVE-04',50,24)],
  receipts:[{id:'GR-401',poId:'PO-2401',sku:'STEEL-12',qty:200},{id:'GR-402',poId:'PO-2402',sku:'CABLE-08',qty:80},{id:'GR-403',poId:'PO-2403',sku:'PUMP-02',qty:20},{id:'GR-404',poId:'PO-2404',sku:'CEMENT-01',qty:120},{id:'GR-405',poId:'PO-2405',sku:'VALVE-04',qty:50}],
  invoices:[inv('INV-1001','PO-2401','Northstar Materials','STEEL-12',200,12.5),inv('INV-1002','PO-2402','Harbor Electric','CABLE-08',100,18),inv('INV-1003','PO-2403','Kinetic Supply','PUMP-02',20,82),inv('INV-1004','PO-2404','Northstar Materials','CEMENT-01',120,9),inv('INV-1005','PO-2404','Northstar Materials','CEMENT-01',120,9),inv('INV-1006','PO-2405','Alloy Works','VALVE-04',50,24),inv('INV-1007','PO-9999','Frost Industrial','FIXTURE-03',10,55),inv('INV-1008','PO-2405','Frost Industrial','VALVE-04',50,24)]
};
