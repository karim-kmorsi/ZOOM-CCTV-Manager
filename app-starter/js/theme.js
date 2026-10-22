/* =====================================================================
   js/theme.js — تبديل الثيم (auto | light | dark | field) وحفظ الاختيار
   ضعه في <head> قبل بقية السكربتات حتى لا يحدث وميض أثناء التحميل.
   الاستخدام من أي مكان:  AinTheme.set('dark');  AinTheme.get();
   ===================================================================== */
(function () {
  var KEY = 'ain_theme';
  var TOPBAR = { light: '#14212B', dark: '#0A1218', field: '#000000' };

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function getSaved() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function apply(choice) {
    var t = choice === 'auto' ? systemTheme() : choice;
    if (!TOPBAR[t]) { t = 'light'; }
    var root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.setAttribute('data-bs-theme', t === 'dark' ? 'dark' : 'light'); // لمكونات Bootstrap
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', TOPBAR[t]); }
  }

  window.AinTheme = {
    get: getSaved,
    set: function (choice) {
      try { localStorage.setItem(KEY, choice); } catch (e) { /* التخزين غير متاح: نطبّق الثيم فقط */ }
      apply(choice);
    }
  };

  apply(getSaved());

  // عند اختيار "تلقائي": تابع إعداد الآيفون (فاتح/داكن)
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (getSaved() === 'auto') { apply('auto'); } };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
    else if (mq.addListener) { mq.addListener(onChange); }
  }
})();
