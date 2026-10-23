(function(root,factory){
 'use strict';
 var api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AinBackupFormat=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 var stores=['settings','clients','quotes','pricebook','projects','accounts','transactions','categories','suppliers','payables','receivables'];
 function fail(message){throw new Error(message);}
 function validate(backup,quoteMath){
  if(!backup||typeof backup!=='object'||Array.isArray(backup)||backup.format!=='zoom-cctv-manager-backup'||backup.schemaVersion!==4||!backup.stores||typeof backup.stores!=='object'||Array.isArray(backup.stores))fail('صيغة النسخة غير مدعومة؛ يلزم ملف ZOOM بإصدار 4.');
  var keys=Object.keys(backup.stores);
  if(keys.length!==stores.length||stores.some(function(name){return !Object.prototype.hasOwnProperty.call(backup.stores,name);}))fail('النسخة لا تحتوي جميع أقسام البيانات المطلوبة.');
  var summary={};
  stores.forEach(function(name){
   var rows=backup.stores[name];
   if(!Array.isArray(rows))fail('قسم '+name+' غير صالح.');
   var ids=new Set();
   rows.forEach(function(row,index){
    if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id.trim()||row.id.length>200)fail('سجل غير صالح في قسم '+name+' (رقم '+(index+1)+').');
    if(ids.has(row.id))fail('معرّف مكرر في قسم '+name+'.');
    ids.add(row.id);
   });
   summary[name]=rows.length;
  });
  function text(value,max){return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
  function positiveNumber(value,allowZero){return typeof value==='number'&&Number.isFinite(value)&&(allowZero?value>=0:value>0);}
  function isoDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;var date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
  (backup.stores.clients||[]).forEach(function(row){if(typeof row.name!=='string'||!row.name.trim()||row.name.length>100)fail('تحتوي النسخة سجل عميل بلا اسم صالح.');});
  (backup.stores.quotes||[]).forEach(function(row){
   if(typeof row.id!=='string'||!row.client||typeof row.client.name!=='string'||!Array.isArray(row.items)||!Array.isArray(row.terms)||typeof row.currency!=='string'||!row.currency.trim())fail('تحتوي النسخة عرض سعر ناقص البيانات الأساسية.');
   if(!quoteMath||typeof quoteMath.calculate!=='function')fail('تعذر التحقق من حسابات عروض الأسعار.');
   try{quoteMath.calculate(row.items,row.discount,row.vatEnabled,row.vatPct);}catch(error){fail('عرض السعر '+row.id+' غير صالح: '+error.message);}
  });
  (backup.stores.settings||[]).forEach(function(row){var logo=row.logoDataUrl;if(row.id!=='main'||row.businessName!=null&&typeof row.businessName!=='string'||row.defaults!=null&&(typeof row.defaults!=='object'||Array.isArray(row.defaults))||row.terms!=null&&(!Array.isArray(row.terms)||row.terms.some(function(term){return typeof term!=='string';}))||logo!=null&&logo!==''&&(typeof logo!=='string'||logo.length>1500000||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo)))fail('إعدادات النسخة غير صالحة.');});
  (backup.stores.pricebook||[]).forEach(function(row){if(!text(row.name,100)||!text(row.category,80)||!text(row.unit,20)||!positiveNumber(row.price,true)||row.cost!=null&&!positiveNumber(row.cost,true))fail('تحتوي النسخة منتجًا ببيانات أو أسعار غير صالحة.');});
  (backup.stores.projects||[]).forEach(function(row){if(!text(row.name,100)||!Array.isArray(row.items)||!text(row.currency,8)||!positiveNumber(row.total,true))fail('تحتوي النسخة تقدير مشروع ناقصًا أو غير صالح.');});
  (backup.stores.accounts||[]).forEach(function(row){if(!text(row.name,80)||!text(row.currency,8)||!positiveNumber(row.openingBalance,true)||!['cash','bank'].includes(row.type)||typeof row.active!=='boolean'||!isoDate(row.openingDate))fail('تحتوي النسخة حسابًا ببيانات غير صالحة.');});
  (backup.stores.transactions||[]).forEach(function(row){if(!['receipt','payment','withdrawal','transfer','payable-settlement','receivable-settlement'].includes(row.type)||!text(row.description,160)||!text(row.currency,8)||!positiveNumber(row.amount,false)||!isoDate(row.date))fail('تحتوي النسخة حركة مالية ببيانات غير صالحة.');});
  (backup.stores.categories||[]).forEach(function(row){if(!text(row.name,80)||!['income','expense'].includes(row.type)||typeof row.active!=='boolean')fail('تحتوي النسخة فئة ببيانات غير صالحة.');});
  (backup.stores.suppliers||[]).forEach(function(row){if(!text(row.name,100)||typeof row.active!=='boolean')fail('تحتوي النسخة موردًا ببيانات غير صالحة.');});
  ['payables','receivables'].forEach(function(name){(backup.stores[name]||[]).forEach(function(row){var party=name==='payables'?'supplierId':'clientId';if(!text(row[party],200)||!text(row.description,160)||!text(row.currency,8)||!positiveNumber(row.amount,false)||!positiveNumber(row.settledAmount==null?0:row.settledAmount,true)||!isoDate(row.date))fail('تحتوي النسخة مستحقًا ببيانات غير صالحة.');});});
  return summary;
 }
 return{stores:stores.slice(),validate:validate};
});
