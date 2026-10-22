(function(){
  'use strict';
  function escapeHtml(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function number(value){ var n=Number(value); return Number.isFinite(n) ? n : NaN; }
  function money(value, currency){ return new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:2}).format(value)+' '+(currency||'EGP'); }
  function dateToday(){ var d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
  function validDate(s){ if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) return false; var d=new Date(s+'T00:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s; }
  function id(prefix){ return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8); }
  window.AinUtils={escapeHtml:escapeHtml,number:number,money:money,dateToday:dateToday,validDate:validDate,id:id};
})();
