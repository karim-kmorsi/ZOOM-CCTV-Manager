(function(){
  'use strict';
  var stores=['settings','clients','quotes','pricebook','projects','accounts','transactions','categories','suppliers','payables','receivables'];
  function status(message,isError){var target=document.getElementById('backup-status');if(target){target.textContent=message;target.classList.toggle('text-danger',!!isError);target.classList.toggle('text-success',!isError);}}
  function download(payload){var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a'),date=new Date().toISOString().slice(0,10);link.href=url;link.download='zoom-cctv-backup-'+date+'.json';document.body.appendChild(link);link.click();link.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  async function exportBackup(){var button=document.getElementById('backup-export');if(button)button.disabled=true;status('جارٍ تجهيز نسخة محلية…',false);try{var data=await AinDB.exportSnapshot();stores.forEach(function(name){if(!Array.isArray(data[name]))throw new Error('تعذر قراءة مخزن '+name+'.');});var backup={format:'zoom-cctv-manager-backup',schemaVersion:4,exportedAt:new Date().toISOString(),stores:data};download(backup);status('تم تنزيل النسخة الاحتياطية. تتضمن بيانات العملاء والموردين والعروض والحسابات والمستحقات والتكاليف الداخلية؛ احتفظ بها في مكان آمن.',false);}catch(err){status('تعذر إنشاء النسخة الاحتياطية: '+(err&&err.message?err.message:'خطأ غير معروف.'),true);}finally{if(button)button.disabled=false;}}
  document.addEventListener('DOMContentLoaded',function(){var button=document.getElementById('backup-export');if(button)button.addEventListener('click',exportBackup);});
  window.AinBackup={export:exportBackup};
})();
