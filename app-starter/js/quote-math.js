(function(root,factory){
 'use strict';
 var api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AinQuoteMath=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 var MAX_CENTS=Number.MAX_SAFE_INTEGER;
 function fail(message){throw new Error(message);}
 function finiteAmount(value,label){
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)fail(label+' غير صالح.');
  var scaled=value*100;
  if(!Number.isFinite(scaled)||scaled>MAX_CENTS)fail(label+' يتجاوز الحد المسموح.');
  var cents=Math.round(scaled+Number.EPSILON*Math.abs(scaled));
  if(!Number.isSafeInteger(cents))fail(label+' يتجاوز الحد المسموح.');
  return cents;
 }
 function inputNumber(value,label){
  if(typeof value!=='string'||value.trim()==='')fail(label+' مطلوب.');
  var number=Number(value);
  if(!Number.isFinite(number)||number<0)fail(label+' يجب أن يكون رقمًا غير سالب.');
  return number;
 }
 function percent(value,label){
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)fail(label+' غير صالح.');
  return value;
 }
 function selectVatRate(savedRate,projectRate,inputRate){
  if(savedRate!==null&&savedRate!==undefined)return savedRate;
  if(projectRate!==null&&projectRate!==undefined)return projectRate;
  return inputRate;
 }
 function calculate(items,discount,vatEnabled,vatPct){
  if(!Array.isArray(items)||!items.length)fail('أضف بندًا واحدًا على الأقل واكتب اسمه.');
  if(!discount||typeof discount!=='object'||(discount.type!=='fixed'&&discount.type!=='percent'))fail('نوع الخصم غير صالح.');
  var discountValue=finiteAmount(discount.value,'قيمة الخصم');
  if(discount.type==='percent'){
   if(typeof discount.value!=='number'||discount.value>100)fail('نسبة الخصم غير صالحة.');
   percent(discount.value,'نسبة الخصم');
  }
  if(typeof vatEnabled!=='boolean')fail('إعداد الضريبة غير صالح.');
  percent(vatPct,'نسبة الضريبة');
  var lineCents=[],subtotalCents=0,costComplete=true,costTotal=0;
  items.forEach(function(item,index){
   var label='البند '+(index+1);
   if(!item||typeof item!=='object'||typeof item.name!=='string'||!item.name.trim()||item.name.length>100)fail(label+': وصف البند مطلوب.');
   if(typeof item.category!=='string'||!item.category)fail(label+': فئة البند غير صالحة.');
   if(typeof item.qty!=='number'||!Number.isFinite(item.qty)||item.qty<0||item.qty>Number.MAX_SAFE_INTEGER||(item.category==='cable'?!Number.isFinite(item.qty):!Number.isSafeInteger(item.qty)))fail(label+': الكمية غير صالحة.');
   if(typeof item.price!=='number'||!Number.isFinite(item.price)||item.price<0)fail(label+': سعر الوحدة غير صالح.');
   var unitPriceCents=finiteAmount(item.price,'سعر الوحدة');
   if(Math.abs(item.price-unitPriceCents/100)>Number.EPSILON*Math.max(1,item.price)*2)fail(label+': سعر الوحدة لا يقبل أكثر من منزلتين عشريتين.');
   var lineCentsValue=finiteAmount(item.qty*item.price,'إجمالي '+label);
   if(subtotalCents>MAX_CENTS-lineCentsValue)fail('المجموع يتجاوز الحد المسموح.');
   lineCents.push(lineCentsValue);subtotalCents+=lineCentsValue;
   if(item.cost==null)costComplete=false;
   else if(typeof item.cost!=='number'||!Number.isFinite(item.cost)||item.cost<0)fail(label+': التكلفة الداخلية غير صالحة.');
   else{
    finiteAmount(item.cost,'التكلفة الداخلية');
    var costLine=item.qty*item.cost;
    if(!Number.isFinite(costLine)||!Number.isFinite(costTotal+costLine))costComplete=false;
    else costTotal+=costLine;
   }
  });
  var discountCents=discount.type==='percent'?finiteAmount((subtotalCents/100)*discount.value/100,'الخصم'):discountValue;
  if(discountCents>subtotalCents)fail('الخصم لا يمكن أن يتجاوز مجموع البنود.');
  var postDiscountCents=subtotalCents-discountCents;
  var taxCents=vatEnabled?finiteAmount((postDiscountCents/100)*vatPct/100,'الضريبة'):0;
  if(postDiscountCents>MAX_CENTS-taxCents)fail('الإجمالي النهائي يتجاوز الحد المسموح.');
  var totalCents=postDiscountCents+taxCents;
  return{
   lineTotals:lineCents.map(function(cents){return cents/100;}),
   subtotal:subtotalCents/100,
   discount:discountCents/100,
   tax:taxCents/100,
   total:totalCents/100,
   cost:costComplete?costTotal:null
  };
 }
 return{calculate:calculate,inputNumber:inputNumber,selectVatRate:selectVatRate};
});
