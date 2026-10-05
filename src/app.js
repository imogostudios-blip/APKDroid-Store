 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
const {useState,useEffect,useRef,useCallback}=React;

const _mem={};
let _idb=null;
const IDB_NAME='apkdroid_store';
const IDB_STORE='kv';
const _openIdb=()=>new Promise((res,rej)=>{
  const r=indexedDB.open(IDB_NAME,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(IDB_STORE))r.result.createObjectStore(IDB_STORE)};
  r.onsuccess=()=>res(r.result);
  r.onerror=()=>rej(r.error);
});
const _idbPut=(k,v)=>{if(!_idb)return;try{_idb.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).put(v,k)}catch (e4){}};
const _idbDel=k=>{if(!_idb)return;try{_idb.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).delete(k)}catch (e5){}};
const getS=(k,d)=>{if(!Object.prototype.hasOwnProperty.call(_mem,k))return d;const v=_mem[k];return v==null?d:v};
const setS=(k,v)=>{_mem[k]=v;_idbPut(k,v);return true};
const delS=k=>{delete _mem[k];_idbDel(k)};
const listS=prefix=>{const out=[];for(const k in _mem){if(k.indexOf(prefix)===0)out.push(k)}return out};
const wipeStore=()=>{
  try{Object.keys(_mem).forEach(k=>delete _mem[k])}catch (e6){}
  try{if(_idb)_idb.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).clear()}catch (e7){}
  try{localStorage.clear()}catch (e8){}
  try{sessionStorage.clear()}catch (e9){}
  try{location.hash='#/'}catch (e10){}
  location.reload();
};
const _bootStore=async()=>{
  try{
    _idb=await _openIdb();
    await new Promise(res=>{
      const tx=_idb.transaction(IDB_STORE,'readonly');
      const st=tx.objectStore(IDB_STORE);
      const req=st.getAllKeys();
      req.onsuccess=()=>{
        const keys=req.result||[];
        if(!keys.length){res();return}
        let left=keys.length;
        keys.forEach(k=>{
          const g=st.get(k);
          g.onsuccess=()=>{_mem[k]=g.result;if(--left<=0)res()};
          g.onerror=()=>{if(--left<=0)res()};
        });
      };
      req.onerror=()=>res();
    });
  }catch(e){}
  try{
    const keys=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf('apk_')===0)keys.push(k)}
    keys.forEach(k=>{
      if(!Object.prototype.hasOwnProperty.call(_mem,k)){
        try{const raw=localStorage.getItem(k);if(raw!=null&&raw!=='')_mem[k]=JSON.parse(raw);_idbPut(k,_mem[k])}catch (e11){}
      }
      try{localStorage.removeItem(k)}catch (e12){}
    });
  }catch (e13){}
  try{_lang=getS('apk_lang',_lang||'ar')}catch (e14){}
};

const STORE_LOGO_SRC='res/icons/icon-source.png';
const slimApp=a=>!a?null:{trackId:a.trackId,trackName:a.trackName||'',artistName:a.artistName||'',artworkUrl100:a.artworkUrl100||a.artworkUrl60||'',artworkUrl512:a.artworkUrl512||a.artworkUrl100||'',averageUserRating:a.averageUserRating,formattedPrice:a.formattedPrice,primaryGenreName:a.primaryGenreName||'',fileSizeBytes:a.fileSizeBytes,screenshotUrls:(a.screenshotUrls||[]).slice(0,1)};
const slimSong=s=>!s?null:{trackId:s.trackId,trackName:s.trackName||'',artistName:s.artistName||'',artworkUrl100:s.artworkUrl100||s.artworkUrl60||'',previewUrl:s.previewUrl||'',duration:s.duration||0};
const loadFavs=()=>{const v=getS('apk_favorites',[]);return Array.isArray(v)?v.filter(Boolean):[]};
const loadSongFavs=()=>{const v=getS('apk_song_favs',[]);return Array.isArray(v)?v.filter(Boolean):[]};
const saveFavs=list=>{const n=(list||[]).map(slimApp).filter(Boolean);setS('apk_favorites',n);return n};
const saveSongFavs=list=>{const n=(list||[]).map(slimSong).filter(Boolean);setS('apk_song_favs',n);return n};

/* ===== i18n ===== */
const STRINGS={
  ar:{
    menu:'القائمة',home:'الرئيسية',top_rated:'الأعلى تقييماً',favorites:'المفضلة',games:'الألعاب',music:'الموسيقى',settings:'الإعدادات',
    terms:'بنود الخدمة',privacy:'سياسة الخصوصية',
    search_placeholder:'ابحث عن تطبيقات وألعاب',search_apps:'Search apps & games',
    nav_games:'ألعاب',nav_apps:'تطبيقات',nav_search:'بحث',nav_library:'مكتبة',nav_music:'موسيقى',
    featured:'مميز',top_free_apps:'أفضل التطبيقات المجانية',productivity:'الإنتاجية',education:'التعليم',entertainment:'الترفيه',top_paid_apps:'أفضل التطبيقات المدفوعة',see_all:'عرض الكل',
    top_game:'أفضل لعبة',top_free_games:'أفضل الألعاب المجانية',action_games:'ألعاب الأكشن',
    recent_searches:'عمليات البحث الأخيرة',
    back:'رجوع',install:'تثبيت',description:'الوصف',more:'المزيد',less:'أقل',
    ratings_reviews:'التقييمات والمراجعات',ratings_count:'تقييم',comments:'التعليقات',
    loading_reviews:'جاري تحميل التعليقات...',no_reviews:'لا توجد تعليقات متاحة لهذا التطبيق.',
    show_more:'المزيد',hide_reviews:'إخفاء التعليقات',loading:'جاري التحميل...',
    info:'معلومات',version:'الإصدار',last_update:'آخر تحديث',size:'الحجم',age_rating:'العمر المناسب',developer:'المطور',category:'التصنيف',
    you_might_like:'قد يعجبك أيضاً',share_via:'مشاركة عبر',
    share_bt:'عبر بلوتوث',share_qs:'Quick Share',share_copy:'نسخ الرابط',share_wa:'مشاركة عبر واتساب',share_tg:'تليجرام',share_ig:'انستجرام',share_fb:'فيسبوك',share_gh:'GitHub',
    toast_copied:'تم نسخ الرابط',toast_ig:'تم نسخ الرابط، الصقه في انستجرام',toast_bt:'ميزة البلوتوث تتطلب جهازاً داعماً',toast_qs:'Quick Share متاح على أجهزة أندرويد المدعومة',
    library:'المكتبة',reset_data:'حذف البيانات وإعادة التعيين',reset_data_desc:'حذف كل شيء والعودة لإعداد المتجر الأول',reset_confirm:'سيتم حذف كل البيانات. متابعة؟',lock_protect:'القفل والحماية',lock_protect_desc:'قفل المتجر أو قفل صفحة تثبيت تطبيق',lock_general:'القفل العام للتطبيق',lock_named:'منع دخول صفحة تثبيت تطبيق',lock_named_hint:'اكتب اسم التطبيق أو الصقه',lock_choose:'نوع القفل',lock_pin:'قفل PIN',lock_pattern:'قفل نقش',lock_pass:'قفل كلمة المرور',lock_enter:'أدخل القفل',lock_again:'أعد الإدخال للتأكيد',lock_mismatch:'غير متطابق، أعد المحاولة',lock_wrong:'القفل غير صحيح',lock_set:'تم ضبط القفل',lock_off:'إلغاء القفل',lock_forgot:'نسيت القفل؟ إعادة تعيين المتجر',lock_name_ph:'اسم التطبيق',archive:'أرشفة',archives:'الأرشيف',archive_pin:'تثبيت في الأعلى',archive_unpin:'إلغاء التثبيت',archive_empty:'لا يوجد أرشيف',archive_one:'أرشيف',no_favs:'لا توجد مفضلات بعد',no_favs_hint:'اضغط على القلب في أي تطبيق لحفظه',
    top_songs:'أفضل الأغاني',results:'النتائج',search_songs:'ابحث عن أغاني',
    settings_title:'الإعدادات',store_country:'دولة متجر التطبيقات',appearance:'المظهر',light:'فاتح',dark:'داكن',language:'اللغة',
    lang_ar:'العربية',lang_en:'English',
    footer_line1:'APKDroid Store — نسخة HTML واحدة',footer_line2:'التطبيقات من iTunes · الموسيقى من Audius. بدون إعلانات.',
    sec_best:'الأفضل',sec_for_you:'من أجلك',sec_social:'التواصل',sec_most_dl:'الأكثر تحميلاً',
    g_most_dl:'الأكثر تحميلاً',g_br:'ألعاب باتل رويال',g_sandbox:'ألعاب صندوق الرمل',g_tanks:'ألعاب الدبابات',
    g_adventure:'ألعاب المغامرات',g_popular:'الأكثر شيوعاً',g_horror:'ألعاب رعب',g_kids:'ألعاب أطفال',
    g_rpg:'ألعاب تقمص الأدوار',g_strategy:'ألعاب الاستراتيجية',g_sim:'ألعاب محاكاة وشاحنات',g_puzzle:'ألعاب الذكاء',
    exp_mode:'وضع التجربة',exp_mode_desc:'صورة دعائية من لقطة الشاشة في صفحة التثبيت',
    style2:'ستايل أزرق بدون دعائية',style2_desc:'مطفأ: ستايل أخضر مع دعائية في صفحة التثبيت · مفعّل: ستايل أزرق بدون دعائية',style_classic:'الستايل الأساسي',style_blue:'ستايل 2',
    style_look:'ستايل المتجر',style_look_off:'ستايل أخضر مع دعائية',style_look_on:'ستايل أزرق دون دعائية',
    req_title:'متطلبات التطبيق',req_confirm:'تأكيد',req_cancel:'إلغاء',req_open_store:'فتح في متجر محلي',
    req_open_play:'فتح في Google Play',req_open_files:'فتح الملفات',reinstall:'إعادة التثبيت',
    req_money:'قد يكلفك هذا مالاً',req_wifi:'قد يتمكن هذا التطبيق من الدخول لشبكة Wi‑Fi',
    req_storage:'قد يطلب هذا التطبيق الدخول إلى قرص التخزين المحلي',req_notify:'قد يتطلب الدخول إلى إذن الإشعارات',
    req_vibrate:'قد يتمكن من الدخول إلى ارتجاج الجهاز',req_system:'قد يتمكن هذا التطبيق من تعديل النظام',
    req_note:'ملاحظة: لا يمكن معرفة ما الذي قد يطلب التطبيق من أذونات. هذه الاحتمالات ليست مؤكدة!',
    dl_manager:'إدارة عمليات التنزيل',dl_active:'جاري التنزيل',dl_done:'عمليات التنزيل الناجحة',
    dl_empty_active:'لا توجد عمليات تنزيل جارية',dl_empty_done:'لا توجد تنزيلات مكتملة',
    dl_progress:'التقدم',dl_spinning:'جارٍ التحضير…',dl_complete:'مكتمل',
    search_log:'سجل البحث',search_log_empty:'لا يوجد سجل بحث',select_all:'تحديد الكل',
    delete_sel:'حذف',delete_confirm:'هل تريد حذف العناصر المحددة؟',delete_one_confirm:'هل تريد حذف هذا العنصر من المفضلة؟',
    fav_apps:'تطبيقات',fav_songs:'موسيقى',type_apps:'تطبيقات',type_music:'موسيقى',type_games:'ألعاب',
    app_not_found:'التطبيق غير موجود',years_old:'سنة',
    load_timeout:'استغرق جلب المحتوى وقت أطول مما يجب تحقق من اتصالك بالخادم',
    retry_load:'إعادة المحاولة',
    choose_country:'اختر البلد',
    country_blocked:'بلدك محظور لا يمكن المتابعة يمكنك تغيير بلدك من هنا',
    choose_platform:'اختر المنصة',choose_store:'اختر المتجر',platform_android:'Android',platform_ios:'iOS',platform_windows:'Windows',
    back_platforms:'رجوع للمنصات',categories:'الفئات',
    cat_games:'ألعاب',cat_productivity:'إنتاجية',cat_education:'تعليم',cat_entertainment:'ترفيه',cat_social:'اجتماعي',
    cat_photo:'صور وفيديو',cat_music:'موسيقى',cat_shopping:'تسوق',cat_finance:'مالية',cat_health:'صحة',
    cat_news:'أخبار',cat_travel:'سفر',cat_food:'طعام',cat_sports:'رياضة',cat_weather:'طقس',
    cat_utilities:'أدوات',cat_business:'أعمال',cat_lifestyle:'نمط حياة',cat_books:'كتب',cat_kids:'أطفال',
    now_playing:'الآن يعمل',download_song:'تحميل',equalizer:'المعادل',eq_on:'مفعّل',eq_off:'معطّل',
    master_volume:'مستوى الصوت',eq_title:'المعادل والتأثيرات',
    store_direct:'مباشر',store_direct_hint:'تحميل APK مباشرة بدون فتح صفحة خارجية',
    api_search_app:'API Search Application',api_search_app_desc:'اختر مصدر التثبيت الافتراضي للتطبيقات',
    store_play:'Google Play Store',store_happymod:'HappyMod',store_uptodown:'Uptodown',
    dl_resolving:'جاري جلب رابط التحميل المباشر…',dl_fetch_badge:'جاري جلب رابط التحميل',dl_run_badge:'جاري التحميل',
    dl_direct_ok:'بدأ التحميل المباشر',
    dl_direct_fail:'تعذر إيجاد رابط مباشر لهذا التطبيق',
    more_options:'خيارات',toggle_theme:'تبديل الثيم',
    ads_suggested:'إعلان • إعلانات مقترحة لك',suggested_for_you:'مقترحة لك',ad_label:'إعلان',
    account:'الحساب',manage_account:'إدارة حسابك على APKDroid Store',edit_profile:'تعديل الملف الشخصي',profile_name:'الاسم',profile_photo:'صورة الملف الشخصي',save_profile:'حفظ',theme_black:'أسود',night_mode:'الوضع الليلي',theme_dim:'معتم',chip_all:'الكل',night_mode_desc:'أولوية على كل الستايلات — أسود وأبيض ورمادي',choose_theme:'المظهر',pages_menu:'القائمة',guest_name:'حسابك',change_photo:'تغيير الصورة',
    dt_share:'مشاركة',dt_open_in:'الفتح في...',dt_theme:'تغيير الثيم',dt_info:'معلومات عن التطبيق',dt_save:'حفظ في المكتبة',dt_unsave:'إزالة من المكتبة',dt_close:'إغلاق',dt_yes:'نعم',dt_no:'لا',
  },
  en:{
    menu:'Menu',home:'Home',top_rated:'Top Rated',favorites:'Favorites',games:'Games',music:'Music',settings:'Settings',
    terms:'Terms of Service',privacy:'Privacy Policy',
    search_placeholder:'Search apps & games',search_apps:'Search apps & games',
    nav_games:'Games',nav_apps:'Apps',nav_search:'Search',nav_library:'Library',nav_music:'Music',
    featured:'Featured',top_free_apps:'Top Free Apps',productivity:'Productivity',education:'Education',entertainment:'Entertainment',top_paid_apps:'Top Paid Apps',see_all:'See All',
    top_game:'Top Game',top_free_games:'Top Free Games',action_games:'Action Games',
    recent_searches:'RECENT SEARCHES',
    back:'Back',install:'Install',description:'Description',more:'More',less:'Less',
    ratings_reviews:'Ratings & Reviews',ratings_count:'ratings',comments:'Reviews',
    loading_reviews:'Loading reviews...',no_reviews:'No reviews available for this app.',
    show_more:'More',hide_reviews:'Hide reviews',loading:'Loading...',
    info:'Information',version:'Version',last_update:'Last Updated',size:'Size',age_rating:'Age Rating',developer:'Developer',category:'Category',
    you_might_like:'You Might Also Like',share_via:'Share via',
    share_bt:'Bluetooth',share_qs:'Quick Share',share_copy:'Copy link',share_wa:'WhatsApp',share_tg:'Telegram',share_ig:'Instagram',share_fb:'Facebook',share_gh:'GitHub',
    toast_copied:'Link copied',toast_ig:'Link copied — paste it in Instagram',toast_bt:'Bluetooth requires a supported device',toast_qs:'Quick Share is available on supported Android devices',
    library:'Library',reset_data:'Delete data and reset',reset_data_desc:'Erase everything and return to first-time setup',reset_confirm:'All data will be deleted. Continue?',lock_protect:'Lock and protection',lock_protect_desc:'Lock the store or an app install page',lock_general:'App lock',lock_named:'Lock an app install page',lock_named_hint:'Type or paste the app name',lock_choose:'Lock type',lock_pin:'PIN lock',lock_pattern:'Pattern lock',lock_pass:'Password lock',lock_enter:'Enter lock',lock_again:'Enter again to confirm',lock_mismatch:'Did not match, try again',lock_wrong:'Wrong lock',lock_set:'Lock saved',lock_off:'Remove lock',lock_forgot:'Forgot lock? Reset store',lock_name_ph:'App name',archive:'Archive',archives:'Archives',archive_pin:'Pin to top',archive_unpin:'Unpin',archive_empty:'No archives',archive_one:'Archive',no_favs:'No favorites yet',no_favs_hint:'Tap the heart on any app to save it',
    top_songs:'Top Songs',results:'Results',search_songs:'Search songs',
    settings_title:'Settings',store_country:'App Store Country',appearance:'Appearance',light:'Light',dark:'Dark',language:'Language',
    lang_ar:'العربية',lang_en:'English',
    footer_line1:'APKDroid Store — Single HTML edition',footer_line2:'Apps from iTunes · Music from Audius. No ads.',
    sec_best:'Best',sec_for_you:'For You',sec_social:'Communication',sec_most_dl:'Most Downloaded',
    g_most_dl:'Most Downloaded',g_br:'Battle Royale',g_sandbox:'Sandbox Games',g_tanks:'Tank Games',
    g_adventure:'Adventure Games',g_popular:'Most Popular',g_horror:'Horror Games',g_kids:'Kids Games',
    g_rpg:'Role-Playing Games',g_strategy:'Strategy Games',g_sim:'Simulation & Trucks',g_puzzle:'Puzzle Games',
    exp_mode:'Experimental Mode',exp_mode_desc:'Promo banner from screenshot on install page',
    style2:'Blue style without promo',style2_desc:'Off: green style with promo banner on the install page · On: blue style without promo',style_classic:'Classic style',style_blue:'Style 2',
    style_look:'Store style',style_look_off:'Green style with promo',style_look_on:'Blue style without promo',
    req_title:'App requirements',req_confirm:'Confirm',req_cancel:'Cancel',req_open_store:'Open in local store',
    req_open_play:'Open in Google Play',req_open_files:'Open files',reinstall:'Reinstall',
    req_money:'This may cost you money',req_wifi:'This app may access the Wi‑Fi network',
    req_storage:'This app may request access to local storage',req_notify:'This app may require notification permission',
    req_vibrate:'This app may access device vibration',req_system:'This app may modify system settings',
    req_note:'Note: It is not possible to know which permissions the app may request. These possibilities are not confirmed!',
    dl_manager:'Download Manager',dl_active:'Downloading',dl_done:'Completed downloads',
    dl_empty_active:'No active downloads',dl_empty_done:'No completed downloads',
    dl_progress:'Progress',dl_spinning:'Preparing…',dl_complete:'Complete',
    search_log:'Search history',search_log_empty:'No search history',select_all:'Select all',
    delete_sel:'Delete',delete_confirm:'Delete selected items?',delete_one_confirm:'Remove this item from favorites?',
    fav_apps:'Apps',fav_songs:'Music',type_apps:'Apps',type_music:'Music',type_games:'Games',
    app_not_found:'App not found',years_old:'Years Old',
    load_timeout:'Fetching content took longer than expected. Check your connection to the server',
    retry_load:'Retry',
    choose_country:'Choose country',
    country_blocked:'Your country is blocked. You cannot continue. You can change your country from here',
    choose_platform:'Choose platform',choose_store:'Choose store',platform_android:'Android',platform_ios:'iOS',platform_windows:'Windows',
    back_platforms:'Back to platforms',categories:'Categories',
    cat_games:'Games',cat_productivity:'Productivity',cat_education:'Education',cat_entertainment:'Entertainment',cat_social:'Social',
    cat_photo:'Photo & Video',cat_music:'Music',cat_shopping:'Shopping',cat_finance:'Finance',cat_health:'Health',
    cat_news:'News',cat_travel:'Travel',cat_food:'Food',cat_sports:'Sports',cat_weather:'Weather',
    cat_utilities:'Utilities',cat_business:'Business',cat_lifestyle:'Lifestyle',cat_books:'Books',cat_kids:'Kids',
    now_playing:'Now Playing',download_song:'Download',equalizer:'Equalizer',eq_on:'On',eq_off:'Off',
    master_volume:'Master Volume',eq_title:'Equalizer & Effects',
    store_direct:'Direct',store_direct_hint:'Download the APK directly without opening another page',
    api_search_app:'API Search Application',api_search_app_desc:'Choose the default install source for apps',
    store_play:'Google Play Store',store_happymod:'HappyMod',store_uptodown:'Uptodown',
    dl_resolving:'Fetching a direct download link…',dl_fetch_badge:'Fetching download link',dl_run_badge:'Downloading',
    dl_direct_ok:'Direct download started',
    dl_direct_fail:'Could not find a direct link for this app',
    more_options:'Options',toggle_theme:'Toggle theme',
    ads_suggested:'Ad • Suggested ads for you',suggested_for_you:'Suggested for you',ad_label:'Ad',
    account:'Account',manage_account:'Manage your APKDroid Store account',edit_profile:'Edit profile',profile_name:'Name',profile_photo:'Profile photo',save_profile:'Save',theme_black:'Black',night_mode:'Night mode',theme_dim:'Dim',chip_all:'All',night_mode_desc:'Overrides every style with black, white and gray',choose_theme:'Appearance',pages_menu:'Menu',guest_name:'Your account',change_photo:'Change photo',
    dt_share:'Share',dt_open_in:'Open in...',dt_theme:'Change theme',dt_info:'App info',dt_save:'Save to library',dt_unsave:'Remove from library',dt_close:'Close',dt_yes:'Yes',dt_no:'No',
  }
};
let _lang='ar';
const t=(k)=> (STRINGS[_lang]&&STRINGS[_lang][k]) || STRINGS.en[k] || k;
const setLangGlobal=(l)=>{_lang=l;setS('apk_lang',l)};

const TTL=30*60*1000;
async function fetchC(url){
  // Key from end of base64 so unique parts of URL (e.g. app id) are included — avoids cache collisions across different apps
  const key='apk_'+btoa(unescape(encodeURIComponent(url))).replace(/=+$/,'').slice(-70);
  const c=getS(key,null);
  if(c&&Date.now()-c.ts<TTL)return c.data;
  const r=await fetch(url);if(!r.ok)throw new Error('fail');
  const d=await r.json();setS(key,{ts:Date.now(),data:d});return d;
}
const country=()=>getS('apk_country','us');
const pushSearchHist=(term,type='apps')=>{
  const t=String(term||'').trim();if(!t)return;
  const prev=getS('apk_search_log',[]);
  const id=type+'|'+t.toLowerCase();
  const next=[{id,term:t,type,ts:Date.now()},...prev.filter(x=>x&&x.id!==id)].slice(0,100);
  setS('apk_search_log',next);
  // keep legacy recent list in sync for search page chips
  const terms=[t,...getS('apk_search_history',[]).filter(x=>x!==t)].slice(0,20);
  setS('apk_search_history',terms);
};
const getSearchLog=()=>getS('apk_search_log',[]);
const DL_SPIN_MS=8000;
const DL_CIRC=2*Math.PI*45;
const dlDurationMs=bytes=>{
  const b=Number(bytes)||0;
  const MB=1024*1024;
  if(b>1024*MB)return 28*60*1000;
  if(b>700*MB)return 20*60*1000;
  if(b>500*MB)return 16*60*1000;
  if(b>300*MB)return 12*60*1000;
  return 9*60*1000;
};
const dlKey=id=>'apk_dl_'+id;
const getDlRec=id=>getS(dlKey(id),null);
const startDlRec=(id,sizeBytes,meta={},force=false)=>{
  const cur=getDlRec(id);
  if(!force&&cur&&cur.startMs){
    const p=computeDlProgress(cur);
    if(p.phase!=='done'&&p.phase!=='idle')return{rec:cur,fresh:false};
  }
  const rec={
    startMs:Date.now(),spinMs:DL_SPIN_MS,dlMs:dlDurationMs(sizeBytes),postSpinMs:DL_SPIN_MS,sizeBytes:Number(sizeBytes)||0,
    trackId:id,trackName:meta.trackName||'',artworkUrl100:meta.artworkUrl100||'',installHref:meta.installHref||'',
  };
  setS(dlKey(id),rec);
  return{rec,fresh:true};
};
const clearDlRec=id=>{delS(dlKey(id))};
const listAllDownloads=()=>{
  const out=[];
  try{
    listS('apk_dl_').forEach(k=>{
      const rec=getS(k,null);
      if(rec&&rec.startMs)out.push({...rec,trackId:rec.trackId||k.slice(7)});
    });
  }catch (e15){}
  return out.sort((a,b)=>(b.startMs||0)-(a.startMs||0));
};
const isPaidApp=app=>{
  if(!app)return false;
  const price=Number(app.price);
  if(!isNaN(price)&&price>0)return true;
  const f=String(app.formattedPrice||'').trim().toLowerCase();
  if(!f)return false;
  if(['free','get','مجاني','gratis','0','$0','$0.00','0.00'].includes(f))return false;
  if(f.indexOf('free')>=0||f.indexOf('مجاني')>=0)return false;
  if(/[0-9]/.test(f))return true;
  return false;
};
const openNativePlayStore=name=>{
  const q=encodeURIComponent(name||'');
  const market=`market://search?q=${q}&c=apps`;
  const intent=`intent://search?q=${q}&c=apps#Intent;scheme=market;package=com.android.vending;end`;
  try{window.location.href=market}catch(e){
    try{window.location.href=intent}catch(e2){window.location.href=`https://play.google.com/store/search?q=${q}&c=apps`}
  }
};
const openGooglePlay=app=>{
  const name=(app&&app.trackName)||'';
  const pkg=(app&&app.bundleId)||'';
  const market=pkg?`market://details?id=${encodeURIComponent(pkg)}`:`market://search?q=${encodeURIComponent(name)}&c=apps`;
  const intent=pkg
    ?`intent://details?id=${encodeURIComponent(pkg)}#Intent;scheme=market;package=com.android.vending;end`
    :`intent://search?q=${encodeURIComponent(name)}&c=apps#Intent;scheme=market;package=com.android.vending;end`;
  const web=pkg?`https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}`:`https://play.google.com/store/search?q=${encodeURIComponent(name)}&c=apps`;
  try{window.location.href=market}catch(e){
    try{window.location.href=intent}catch(e2){try{window.location.href=web}catch(e3){}}
  }
};
const openLocalStores=()=>{
  const intents=[
    'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_MARKET;end',
    'market://search?q=',
    '/store',
  ];
  try{window.location.href=intents[0]}catch(e){
    try{window.location.href=intents[1]}catch(e2){try{window.location.href=intents[2]}catch (e16){}}
  }
};
const computeDlProgress=(rec,now)=>{
  if(!rec||!rec.startMs)return{active:false,phase:'idle',pct:0,overall:0,ring:false};
  const t=typeof now==='number'?now:Date.now();
  const dlMs=rec.dlMs||9*60*1000;
  const postMs=rec.postSpinMs||DL_SPIN_MS;
  if(!rec.runMs)return{active:true,phase:'spin',pct:0,overall:0,ring:true};
  const dlElapsed=Math.max(0,t-rec.runMs);
  const total=Math.max(1,dlMs+postMs);
  const overall=Math.min(1,dlElapsed/total);
  if(dlElapsed<dlMs)return{active:true,phase:'download',pct:Math.min(1,dlElapsed/dlMs),overall,ring:true};
  const postElapsed=dlElapsed-dlMs;
  if(postElapsed<postMs)return{active:true,phase:'postspin',pct:1,overall,ring:true};
  return{active:true,phase:'done',pct:1,overall:1,ring:false};
};
const api={
  search:(t,l=25)=>fetchC(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&entity=software&limit=${l}&country=${country()}`).then(d=>d.results||[]),
  lookup:id=>fetchC(`https://itunes.apple.com/lookup?id=${id}&country=${country()}`).then(d=>_optionalChain([d, 'access', _2 => _2.results, 'optionalAccess', _3 => _3[0]])||null),
  top:()=>fetchC(`https://itunes.apple.com/search?term=app&entity=software&limit=30&country=${country()}`).then(d=>d.results||[]),
  cat:(t,g,l=20)=>fetchC(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&entity=software&genreId=${g}&limit=${l}&country=${country()}`).then(d=>d.results||[]),
  // Full tracks via Audius (not 30s iTunes previews)
  songs:async(t,l=25)=>{
    const appName='APKDroidStore';
    const base='https://api.audius.co/v1';
    const url=t&&String(t).trim()
      ?`${base}/tracks/search?query=${encodeURIComponent(t)}&app_name=${appName}&limit=${l}`
      :`${base}/tracks/trending?app_name=${appName}&limit=${l}`;
    const d=await fetchC(url);
    const list=Array.isArray(_optionalChain([d, 'optionalAccess', _4 => _4.data]))?d.data:[];
    return list.filter(x=>x&&x.id&&x.is_streamable!==false).map(x=>({
      trackId:x.id,
      trackName:x.title||'Untitled',
      artistName:(x.user&&x.user.name)||'Unknown Artist',
      artworkUrl100:(x.artwork&&(x.artwork['480x480']||x.artwork['1000x1000']||x.artwork['150x150']))||'',
      artworkUrl60:(x.artwork&&x.artwork['150x150'])||'',
      previewUrl:`${base}/tracks/${x.id}/stream?app_name=${appName}`,
      duration:x.duration||0,
    }));
  },
};
const GENRES={games:{id:6014,term:'game'},productivity:{id:6007,term:'productivity'},education:{id:6017,term:'education'},entertainment:{id:6016,term:'entertainment'}};

const SEARCH_CATEGORIES=[
  {k:'cat_games',term:'game',gid:6014,color:'#EA4335',icon:'gamepad'},
  {k:'cat_productivity',term:'productivity',gid:6007,color:'#4285F4',icon:'briefcase'},
  {k:'cat_education',term:'education',gid:6017,color:'#34A853',icon:'book'},
  {k:'cat_entertainment',term:'entertainment',gid:6016,color:'#FBBC04',icon:'clapper'},
  {k:'cat_social',term:'social',gid:6005,color:'#E4405F',icon:'users'},
  {k:'cat_photo',term:'photo video',gid:6008,color:'#9C27B0',icon:'camera'},
  {k:'cat_music',term:'music',gid:6011,color:'#FF5722',icon:'music'},
  {k:'cat_shopping',term:'shopping',gid:6024,color:'#00BCD4',icon:'bag'},
  {k:'cat_finance',term:'finance',gid:6015,color:'#00897B',icon:'dollar'},
  {k:'cat_health',term:'health fitness',gid:6013,color:'#E91E63',icon:'heart'},
  {k:'cat_news',term:'news',gid:6009,color:'#607D8B',icon:'news'},
  {k:'cat_travel',term:'travel',gid:6003,color:'#3F51B5',icon:'plane'},
  {k:'cat_food',term:'food drink',gid:6023,color:'#FF9800',icon:'food'},
  {k:'cat_sports',term:'sports',gid:6004,color:'#4CAF50',icon:'ball'},
  {k:'cat_weather',term:'weather',gid:6001,color:'#03A9F4',icon:'cloud'},
  {k:'cat_utilities',term:'utilities',gid:6002,color:'#795548',icon:'wrench'},
  {k:'cat_business',term:'business',gid:6000,color:'#455A64',icon:'chart'},
  {k:'cat_lifestyle',term:'lifestyle',gid:6012,color:'#8BC34A',icon:'leaf'},
  {k:'cat_books',term:'books',gid:6018,color:'#673AB7',icon:'bookopen'},
  {k:'cat_kids',term:'kids',gid:6061,color:'#FF4081',icon:'smile'},
];

const CatIcon=({name,color})=>{
  const stroke=color||'currentColor';
  const common={fill:'none',stroke,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'};
  const paths={
    gamepad:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('rect', { x: "2", y: "6", width: "20", height: "12", rx: "2",}), React.createElement('line', { x1: "6", y1: "12", x2: "10", y2: "12",}), React.createElement('line', { x1: "8", y1: "10", x2: "8", y2: "14",}), React.createElement('line', { x1: "15", y1: "13", x2: "15.01", y2: "13",}), React.createElement('line', { x1: "18", y1: "11", x2: "18.01", y2: "11",})),
    briefcase:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('rect', { x: "2", y: "7", width: "20", height: "14", rx: "2",}), React.createElement('path', { d: "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"        ,}), React.createElement('line', { x1: "12", y1: "12", x2: "12", y2: "12.01",})),
    book:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M4 19.5A2.5 2.5 0 016.5 17H20"     ,}), React.createElement('path', { d: "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"         ,})),
    clapper:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M4 11v8a2 2 0 002 2h12a2 2 0 002-2v-8"        ,}), React.createElement('path', { d: "M4 11l2.5-6.5L9 11l2.5-6.5L14 11l2.5-6.5L19 11"    ,}), React.createElement('line', { x1: "2", y1: "11", x2: "22", y2: "11",})),
    users:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"        ,}), React.createElement('circle', { cx: "9", cy: "7", r: "4",}), React.createElement('path', { d: "M23 21v-2a4 4 0 00-3-3.87"    ,}), React.createElement('path', { d: "M16 3.13a4 4 0 010 7.75"     ,})),
    camera:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"                ,}), React.createElement('circle', { cx: "12", cy: "13", r: "4",})),
    music:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M9 18V5l12-2v13" ,}), React.createElement('circle', { cx: "6", cy: "18", r: "3",}), React.createElement('circle', { cx: "18", cy: "16", r: "3",})),
    bag:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"         ,}), React.createElement('line', { x1: "3", y1: "6", x2: "21", y2: "6",}), React.createElement('path', { d: "M16 10a4 4 0 01-8 0"     ,})),
    dollar:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('line', { x1: "12", y1: "1", x2: "12", y2: "23",}), React.createElement('path', { d: "M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"         ,})),
    heart:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"                ,})),
    news:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"                    ,}), React.createElement('line', { x1: "10", y1: "6", x2: "18", y2: "6",}), React.createElement('line', { x1: "10", y1: "10", x2: "18", y2: "10",}), React.createElement('line', { x1: "10", y1: "14", x2: "14", y2: "14",})),
    plane:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"                          ,})),
    food:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M18 8h1a4 4 0 010 8h-1"     ,}), React.createElement('path', { d: "M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"        ,}), React.createElement('line', { x1: "6", y1: "1", x2: "6", y2: "4",}), React.createElement('line', { x1: "10", y1: "1", x2: "10", y2: "4",}), React.createElement('line', { x1: "14", y1: "1", x2: "14", y2: "4",})),
    ball:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('circle', { cx: "12", cy: "12", r: "10",}), React.createElement('path', { d: "M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20"         ,}), React.createElement('path', { d: "M2 12h20" ,})),
    cloud:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"        ,})),
    wrench:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"                      ,})),
    chart:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('line', { x1: "18", y1: "20", x2: "18", y2: "10",}), React.createElement('line', { x1: "12", y1: "20", x2: "12", y2: "4",}), React.createElement('line', { x1: "6", y1: "20", x2: "6", y2: "14",})),
    leaf:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"                   ,}), React.createElement('path', { d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"        ,})),
    bookopen:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('path', { d: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"        ,}), React.createElement('path', { d: "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"        ,})),
    smile:React.createElement('svg', { viewBox: "0 0 24 24"   , ...common,}, React.createElement('circle', { cx: "12", cy: "12", r: "10",}), React.createElement('path', { d: "M8 14s1.5 2 4 2 4-2 4-2"      ,}), React.createElement('line', { x1: "9", y1: "9", x2: "9.01", y2: "9",}), React.createElement('line', { x1: "15", y1: "9", x2: "15.01", y2: "9",})),
  };
  return paths[name]||null;
};

const Icon=({name,className='w-5 h-5'})=>{
  const p={
    home:React.createElement(React.Fragment, null, React.createElement('path', { d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"          ,}), React.createElement('polyline', { points: "9 22 9 12 15 12 15 22"       ,})),
    search:React.createElement(React.Fragment, null, React.createElement('circle', { cx: "11", cy: "11", r: "8",}), React.createElement('line', { x1: "21", y1: "21", x2: "16.65", y2: "16.65",})),
    mic:React.createElement(React.Fragment, null, React.createElement('path', { d: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"            ,}), React.createElement('path', { d: "M19 10v2a7 7 0 01-14 0v-2"     ,}), React.createElement('line', { x1: "12", y1: "19", x2: "12", y2: "23",}), React.createElement('line', { x1: "8", y1: "23", x2: "16", y2: "23",})),
    heart:React.createElement('path', { d: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"                ,}),
    person:React.createElement('path', { fill: "currentColor", stroke: "none", d: "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z"                   ,}),
    bookmark:React.createElement('path', { fill: "currentColor", stroke: "none", d: "M11.539 17.112C11.876 16.937 12.288 16.967 12.6 17.2L17.4 20.8C18.06 21.294 19 20.824 19 20V5C19 3.895 18.105 3 17 3H7C5.895 3 5 3.895 5 5V20C5 20.824 5.94 21.294 6.6 20.8L11.4 17.2L11.539 17.112ZM21 20C21 22.472 18.178 23.883 16.2 22.4L12 19.249L7.8 22.4C5.822 23.883 3 22.472 3 20V5C3 2.791 4.791 1 7 1H17C19.209 1 21 2.791 21 5V20Z"                                                    ,}),
    bookmarkFill:React.createElement('path', { fill: "currentColor", stroke: "none", d: "M3 5C3 2.791 4.791 1 7 1H17C19.209 1 21 2.791 21 5V20C21 22.472 18.178 23.883 16.2 22.4L12 19.25L7.8 22.4C5.822 23.883 3 22.472 3 20V5Z"                       ,}),
    game:React.createElement(React.Fragment, null, React.createElement('line', { x1: "6", y1: "12", x2: "10", y2: "12",}), React.createElement('line', { x1: "8", y1: "10", x2: "8", y2: "14",}), React.createElement('line', { x1: "15", y1: "13", x2: "15.01", y2: "13",}), React.createElement('line', { x1: "18", y1: "11", x2: "18.01", y2: "11",}), React.createElement('rect', { x: "2", y: "6", width: "20", height: "12", rx: "2",})),
    head:React.createElement(React.Fragment, null, React.createElement('path', { d: "M3 18v-6a9 9 0 0118 0v6"     ,}), React.createElement('path', { d: "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"                      ,})),
    moon:React.createElement('path', { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"          ,}),
    sun:React.createElement(React.Fragment, null, React.createElement('circle', { cx: "12", cy: "12", r: "5",}), React.createElement('line', { x1: "12", y1: "1", x2: "12", y2: "3",}), React.createElement('line', { x1: "12", y1: "21", x2: "12", y2: "23",}), React.createElement('line', { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64",}), React.createElement('line', { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78",}), React.createElement('line', { x1: "1", y1: "12", x2: "3", y2: "12",}), React.createElement('line', { x1: "21", y1: "12", x2: "23", y2: "12",}), React.createElement('line', { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36",}), React.createElement('line', { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22",})),
    star:React.createElement('polygon', { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"                     ,}),
    x:React.createElement(React.Fragment, null, React.createElement('line', { x1: "18", y1: "6", x2: "6", y2: "18",}), React.createElement('line', { x1: "6", y1: "6", x2: "18", y2: "18",})),
    left:React.createElement('polyline', { points: "15 18 9 12 15 6"     ,}),
    play:React.createElement('polygon', { points: "5 3 19 12 5 21 5 3"       ,}),
    pause:React.createElement('g', { fill: "currentColor", stroke: "none",}, React.createElement('path', { d: "M23,7H9C7.9,7,7,7.9,7,9v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9C25,7.9,24.1,7,23,7z M23,23H9V9h14V23z" ,}), React.createElement('path', { d: "M23,7H9C7.9,7,7,7.9,7,9v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9C25,7.9,24.1,7,23,7z",})),
    dl:React.createElement(React.Fragment, null, React.createElement('path', { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"        ,}), React.createElement('polyline', { points: "7 10 12 15 17 10"     ,}), React.createElement('line', { x1: "12", y1: "15", x2: "12", y2: "3",})),
    gear:React.createElement(React.Fragment, null, React.createElement('circle', { cx: "12", cy: "12", r: "3",}), React.createElement('path', { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"                                                                                                                               ,})),
    hist:React.createElement(React.Fragment, null, React.createElement('path', { d: "M3 3v5h5" ,}), React.createElement('path', { d: "M3.05 13A9 9 0 106 5.3L3 8"      ,}), React.createElement('path', { d: "M12 7v5l4 2"  ,})),
    phone:React.createElement(React.Fragment, null, React.createElement('rect', { x: "5", y: "2", width: "14", height: "20", rx: "2", ry: "2",}), React.createElement('line', { x1: "12", y1: "18", x2: "12.01", y2: "18",})),
    prev:React.createElement(React.Fragment, null, React.createElement('polygon', { points: "19 20 9 12 19 4 19 20"       ,}), React.createElement('line', { x1: "5", y1: "19", x2: "5", y2: "5",})),
    next:React.createElement(React.Fragment, null, React.createElement('polygon', { points: "5 4 15 12 5 20 5 4"       ,}), React.createElement('line', { x1: "19", y1: "5", x2: "19", y2: "19",})),
    download:React.createElement(React.Fragment, null, React.createElement('path', { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"        ,}), React.createElement('polyline', { points: "7 10 12 15 17 10"     ,}), React.createElement('line', { x1: "12", y1: "15", x2: "12", y2: "3",})),
    eq:React.createElement(React.Fragment, null, React.createElement('line', { x1: "4", y1: "21", x2: "4", y2: "14",}), React.createElement('line', { x1: "4", y1: "10", x2: "4", y2: "3",}), React.createElement('line', { x1: "12", y1: "21", x2: "12", y2: "12",}), React.createElement('line', { x1: "12", y1: "8", x2: "12", y2: "3",}), React.createElement('line', { x1: "20", y1: "21", x2: "20", y2: "16",}), React.createElement('line', { x1: "20", y1: "12", x2: "20", y2: "3",}), React.createElement('line', { x1: "1", y1: "14", x2: "7", y2: "14",}), React.createElement('line', { x1: "9", y1: "8", x2: "15", y2: "8",}), React.createElement('line', { x1: "17", y1: "16", x2: "23", y2: "16",})),
    dots:React.createElement(React.Fragment, null, React.createElement('circle', { cx: "12", cy: "5", r: "1.8", fill: "currentColor", stroke: "none",}), React.createElement('circle', { cx: "12", cy: "12", r: "1.8", fill: "currentColor", stroke: "none",}), React.createElement('circle', { cx: "12", cy: "19", r: "1.8", fill: "currentColor", stroke: "none",})),
    folder:React.createElement(React.Fragment, null, React.createElement('path', { d: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"                ,})),
    arrowRight:React.createElement(React.Fragment, null, React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12",}), React.createElement('polyline', { points: "12 5 19 12 12 19"     ,})),
    info:React.createElement(React.Fragment, null, React.createElement('circle', { cx: "12", cy: "12", r: "10",}), React.createElement('line', { x1: "12", y1: "16", x2: "12", y2: "12",}), React.createElement('line', { x1: "12", y1: "8", x2: "12.01", y2: "8",})),
    external:React.createElement(React.Fragment, null, React.createElement('path', { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"           ,}), React.createElement('polyline', { points: "15 3 21 3 21 9"     ,}), React.createElement('line', { x1: "10", y1: "14", x2: "21", y2: "3",})),
  };
  if(name==='pause')return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 32 32"   , fill: "currentColor",}, p.pause);
  return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, p[name]||null);
};

const Stars=({r=0,s='w-3 h-3'})=>(
  React.createElement('div', { className: "flex gap-0.5 text-amber-400"  ,}, [1,2,3,4,5].map(i=>React.createElement(Icon, { key: i, name: "star", className: `${s} ${i<=Math.round(r)?'fill-current':'opacity-30'}`,})))
);

const M3Spin=({size=18})=> (
  React.createElement('svg', { className: "m3-spin", width: size, height: size, viewBox: "0 0 48 48"   , 'aria-hidden': "true",}
    , React.createElement('g', { className: "m3-container",}, React.createElement('circle', { className: "m3-track", cx: "24", cy: "24", r: "18",}))
  )
);
const GridPulse=({size=42})=> (
  React.createElement('svg', { className: "grid-pulse", width: size, height: size, viewBox: "0 0 100 100"   , 'aria-hidden': "true",}
    , React.createElement('rect', { className: "grid-dot d-1" , x: "20", y: "20", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-2" , x: "42", y: "20", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-3" , x: "64", y: "20", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-2" , x: "20", y: "42", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-3" , x: "42", y: "42", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-4" , x: "64", y: "42", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-3" , x: "20", y: "64", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-4" , x: "42", y: "64", width: "16", height: "16", rx: "4",})
    , React.createElement('rect', { className: "grid-dot d-5" , x: "64", y: "64", width: "16", height: "16", rx: "4",})
  )
);
const PhImg=({src, kind='icon', className='', imgClass='', alt='', eager, onClick})=>{
  const [on,setOn]=useState(false);
  useEffect(()=>{setOn(false)},[src]);
  const done=()=>setOn(true);
  const spinSize=kind==='banner'?28:kind==='ad'?40:16;
  return (
    React.createElement('span', { className: `ph-wrap ph-${kind} ${on?'ready':''} ${className}`, onClick: onClick,}
      , !on&&React.createElement('span', { className: "ph-shimmer",})
      , !on&&React.createElement('span', { className: "ph-ind",}, kind==='ad'?React.createElement(GridPulse, { size: spinSize,}):React.createElement(M3Spin, { size: spinSize,}))
      , src?React.createElement('img', { src: src, alt: alt||'', className: imgClass, loading: eager?'eager':'lazy', onLoad: done, onError: done,}):null
    )
  );
};

let _navMoved=false;
window.addEventListener('hashchange',()=>{_navMoved=true});
const AppCard=({app,onClick,small})=>{
  if(!app)return null;
  const img=app.artworkUrl100||app.artworkUrl60;
  if(small){
    return(
      React.createElement('button', { onClick: ()=>onClick(app), className: "flex flex-col w-[120px] shrink-0 text-left group"     ,}
        , React.createElement(PhImg, { src: img, kind: "icon", className: "w-[120px] h-[120px] rounded-[24px] shadow-sm border border-[hsl(var(--border))]"     , imgClass: "w-full h-full object-cover rounded-[24px]"   ,})
        , React.createElement('div', { className: "mt-2 flex flex-col"  ,}
          , React.createElement('h3', { className: "font-medium text-[13px] leading-tight line-clamp-2"   ,}, app.trackName)
          , React.createElement('p', { className: "text-[11px] text-muted-foreground truncate mt-0.5"   ,}, app.primaryGenreName||app.artistName)
        )
      )
    );
  }
  return(
    React.createElement('button', { onClick: ()=>onClick(app), className: "flex items-center gap-3 w-full p-3 hover:bg-[hsl(var(--muted))]/50 rounded-xl text-left transition"        ,}
      , React.createElement(PhImg, { src: img, kind: "icon", className: "w-14 h-14 rounded-2xl shadow-sm border border-[hsl(var(--border))]"     , imgClass: "w-full h-full object-cover rounded-2xl"   ,})
      , React.createElement('div', { className: "flex-1 min-w-0" ,}
        , React.createElement('p', { className: "font-medium truncate text-sm"  ,}, app.trackName)
        , React.createElement('p', { className: "text-muted-foreground truncate text-xs"  ,}, app.artistName)
        , React.createElement('div', { className: "flex items-center gap-2 mt-1"   ,}, React.createElement(Stars, { r: app.averageUserRating,}), React.createElement('span', { className: "text-[10px] text-muted-foreground" ,}, app.formattedPrice||'Free'))
      )
    )
  );
};

const HScroll=({title,children,onSeeAll,ltr,rtl,pad,free})=>(
  React.createElement('section', { className: "mb-6",}
    , React.createElement('div', { className: "flex items-center justify-between px-4 mb-3"    ,}
      , React.createElement('h2', { className: "font-semibold text-lg" ,}, title)
      , onSeeAll&&React.createElement('button', { onClick: onSeeAll, className: "text-sm text-primary font-medium"  ,}, t('see_all'))
    )
    , React.createElement('div', {
      className: `flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${free?'':'snap-x snap-mandatory'} ${pad||'px-4'}`,
      style: rtl?{direction:'rtl'}:ltr?{direction:'ltr'}:undefined,}
, children)
  )
);

const Skel=({c})=>React.createElement('div', { className: `animate-pulse bg-muted rounded-2xl ${c}`,});
const useHash=()=>{
  const [r,setR]=useState(()=>location.hash.slice(1)||'/');
  useEffect(()=>{const f=()=>setR(location.hash.slice(1)||'/');window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[]);
  return[r,p=>{location.hash=p}];
};

const PersonMark=({className='w-6 h-6'})=>(
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, height: "24", viewBox: "0 -960 960 960"   , width: "24", fill: "currentColor",}
    , React.createElement('path', { d: "M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"                            ,})
  )
);

const TopNav=({nav,isDetail,onOpenAccount,route,photo})=>{
  const showChips=!isDetail&&(route==='/'||route===''||route==='/games'||(route||'').startsWith('/category/'));
  const chips=route==='/games'||((route||'').startsWith('/category/')&&GAME_SECTIONS.some(g=>route.indexOf(encodeURIComponent(g.term))>=0||route.indexOf(g.term)>=0))
    ?[{k:'chip_all',path:'/games',term:''}].concat(GAME_SECTIONS.map(g=>({k:g.k,path:'/category/'+encodeURIComponent(g.term),term:g.term})))
    :[{k:'chip_all',path:'/',term:''}].concat(SEARCH_CATEGORIES.map(c=>({k:c.k,path:'/category/'+encodeURIComponent(c.term),term:c.term})));
  const activePath=route||'/';
  return(
    React.createElement(React.Fragment, null
      , React.createElement('div', { className: `hdr-top-row flex items-center px-4 max-w-screen-2xl mx-auto w-full ${isDetail?'sticky top-0 z-40 bg-[hsl(var(--bg))]':''}`, style: {direction:'ltr'},}
        , isDetail ? (
          React.createElement('button', { type: "button", className: "nav-chip shrink-0" , onClick: ()=>window.history.back(), 'aria-label': t('back'),}
            , React.createElement(Icon, { name: "left", className: "w-5 h-5" ,})
          )
        ) : (
          React.createElement('button', { type: "button", className: "nav-chip shrink-0" , onClick: onOpenAccount, 'aria-label': t('account'),}
            , photo?React.createElement('img', { src: photo, alt: "", className: "nav-avatar",}):React.createElement(PersonMark, { className: "w-6 h-6" ,})
          )
        )
        , React.createElement('div', { className: "flex-1",})
        , React.createElement('button', { type: "button", onClick: ()=>nav('/'), className: "shrink-0 group" , 'aria-label': "APKDroid Store" ,}
          , React.createElement('div', { className: "group-hover:scale-105 transition-transform" ,}
            , React.createElement(StoreLogo, { size: 48,})
          )
        )
      )
      , showChips&&(
        React.createElement('div', { className: "hdr-chips",}
          , chips.map(ch=>{
            const on=ch.path==='/'||ch.path==='/games'?activePath===ch.path:activePath===ch.path||(ch.term&&activePath.indexOf(encodeURIComponent(ch.term))>=0);
            return(
              React.createElement('button', { key: ch.k+ch.path, type: "button", className: `hdr-chip ${on?'on':''}`, onClick: ()=>nav(ch.path),}, t(ch.k))
            );
          })
        )
      )
    )
  );
};

const AccPick=({open,title,onClose,children})=>{
  if(!open&&open!==false)return null;
  return(
    React.createElement('div', { className: `acc-pick-overlay ${open?'show':''}`, onClick: e=>{if(e.target===e.currentTarget)onClose&&onClose()},}
      , React.createElement('div', { className: "acc-pick", onClick: e=>e.stopPropagation(),}
        , React.createElement('div', { className: "acc-pick-title",}, title)
        , children
      )
    )
  );
};

const AccountHub=({open,onClose,nav,theme,setTheme,profile,setProfile,lang,night,setNight})=>{
  const[view,setView]=useState('main');
  const[themeOpen,setThemeOpen]=useState(false);
  const[pagesOpen,setPagesOpen]=useState(false);
  const[name,setName]=useState(profile&&profile.name||'');
  const fileRef=useRef(null);
  useEffect(()=>{
    if(open){setView('main');setThemeOpen(false);setPagesOpen(false);setName(profile&&profile.name||'')}
  },[open]);
  const photo=profile&&profile.photo;
  const displayName=(profile&&profile.name)||t('guest_name');
  const saveProfile=()=>{
    const n={name:String(name||'').trim(),photo:photo||''};
    setProfile(n);setS('apk_profile',n);setView('main');
  };
  const onPhoto=e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=()=>{const n={name:profile&&profile.name||'',photo:String(r.result||'')};setProfile(n);setS('apk_profile',n)};
    r.readAsDataURL(f);
  };
  const go=p=>{onClose&&onClose();nav(p)};
  const ar=lang==='ar';
  return(
    React.createElement('div', { className: `acc-overlay ${open?'open':''}`, dir: ar?'rtl':'ltr',}
      , React.createElement('div', { className: "acc-top",}
        , React.createElement('button', { type: "button", className: "acc-x", onClick: ()=>{if(view==='edit')setView('main');else onClose&&onClose()}, 'aria-label': t('back'),}
          , React.createElement(Icon, { name: "x", className: "w-5 h-5" ,})
        )
      )
      , view==='edit'?(
        React.createElement('div', { className: "acc-edit",}
          , React.createElement('h2', { className: "text-lg font-bold text-center mb-2"   ,}, t('edit_profile'))
          , React.createElement('button', { type: "button", onClick: ()=>fileRef.current&&fileRef.current.click(), style: {background:'none',border:'none',display:'block',margin:'0 auto',cursor:'pointer',color:'#eee'},}
            , photo?React.createElement('img', { src: photo, alt: "", className: "acc-edit-avatar",}):React.createElement('div', { className: "acc-edit-ph",}, React.createElement(PersonMark, { className: "w-10 h-10" ,}))
            , React.createElement('div', { style: {fontSize:'.82rem',color:'#9aa',marginTop:4},}, t('change_photo'))
          )
          , React.createElement('input', { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: onPhoto,})
          , React.createElement('label', { className: "text-sm text-muted-foreground" , style: {display:'block',margin:'14px 0 6px'},}, t('profile_name'))
          , React.createElement('input', { type: "text", value: name, onChange: e=>setName(e.target.value), placeholder: t('profile_name'),})
          , React.createElement('button', { type: "button", className: "acc-save", onClick: saveProfile,}, t('save_profile'))
        )
      ):(
        React.createElement('div', { className: "acc-body",}
          , React.createElement('div', { className: "acc-card",}
            , React.createElement('button', { type: "button", className: "acc-profile-row", onClick: ()=>setView('edit'),}
              , React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", style: {opacity:.7},}, React.createElement('polyline', { points: "6 9 12 15 18 9"     ,}))
              , React.createElement('div', { className: "acc-profile-meta",}
                , React.createElement('div', { className: "acc-name",}, displayName)
                , React.createElement('div', { className: "acc-sub",}, "APKDroid Store" )
              )
              , photo?React.createElement('img', { src: photo, alt: "", className: "acc-avatar",}):React.createElement('div', { className: "acc-avatar-ph",}, React.createElement(PersonMark, { className: "w-7 h-7" ,}))
            )
          )
          , React.createElement('button', { type: "button", className: "acc-manage", onClick: ()=>window.open('https://apkdroidstore3.blogspot.com/','_blank','noopener'),}
            , React.createElement('span', { className: "acc-manage-title",}, t('manage_account'))
            , React.createElement(StoreLogo, { size: 28,})
          )
          , React.createElement('div', { className: "acc-list",}
            , React.createElement('button', { type: "button", className: "acc-row", onClick: ()=>go('/search-log'),}
              , React.createElement('span', { className: "acc-row-label",}, t('search_log'))
              , React.createElement(Icon, { name: "hist", className: "w-5 h-5" ,})
            )
            , React.createElement('button', { type: "button", className: "acc-row", onClick: ()=>go('/downloads'),}
              , React.createElement('span', { className: "acc-row-label",}, t('dl_manager'))
              , React.createElement(Icon, { name: "download", className: "w-5 h-5" ,})
            )
            , React.createElement('button', { type: "button", className: "acc-row", onClick: ()=>setThemeOpen(true),}
              , React.createElement('span', { className: "acc-row-label",}, t('appearance'))
              , React.createElement(Icon, { name: night?'moon':(theme==='light'?'sun':'moon'), className: "w-5 h-5" ,})
            )
            , React.createElement('button', { type: "button", className: "acc-row", onClick: ()=>setPagesOpen(true),}
              , React.createElement('span', { className: "acc-row-label",}, t('pages_menu'))
              , React.createElement(Icon, { name: "folder", className: "w-5 h-5" ,})
            )
            , React.createElement('button', { type: "button", className: "acc-row", onClick: ()=>go('/settings'),}
              , React.createElement('span', { className: "acc-row-label",}, t('settings'))
              , React.createElement(Icon, { name: "gear", className: "w-5 h-5" ,})
            )
          )
        )
      )
      , React.createElement(AccPick, { open: themeOpen, title: t('choose_theme'), onClose: ()=>setThemeOpen(false),}
        , [
          {id:'light',label:t('light')},
          {id:'dark',label:t('dark')},
          {id:'dim',label:t('theme_dim')},
        ].map(it=>{
          const cur=night?'dim':(theme==='dark'?'dark':'light');
          return(
            React.createElement('button', { key: it.id, type: "button", className: `acc-pick-item ${cur===it.id?'on':''}`, onClick: ()=>{
              if(it.id==='dim'){setNight(true);setTheme('dark')}
              else{setNight(false);setTheme(it.id)}
              setThemeOpen(false);
            },}
              , React.createElement('span', null, it.label)
              , cur===it.id&&React.createElement('span', { style: {marginInlineStart:'auto'},}, "✓")
            )
          );
        })
      )
      , React.createElement(AccPick, { open: pagesOpen, title: t('pages_menu'), onClose: ()=>setPagesOpen(false),}
        , [
          {p:'/',k:'nav_apps'},
          {p:'/games',k:'nav_games'},
          {p:'/favorites',k:'nav_library'},
          {p:'/music',k:'nav_music'},
          {p:'/search',k:'nav_search'},
        ].map(it=>(
          React.createElement('button', { key: it.p, type: "button", className: "acc-pick-item", onClick: ()=>{setPagesOpen(false);go(it.p)},}
            , t(it.k)
          )
        ))
      )
    )
  );
};

const NavIcon=({kind,on,className='w-6 h-6'})=>{
  const common={fill:'currentColor'};
  if(kind==='search')return React.createElement(Icon, { name: "search", className: className,});
  if(kind==='game'){
    return on?(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 960 960"   ,}, React.createElement('path', { d: "M182,760q-51,0 -79,-35.5T82,638l42,-300q9,-60 53.5,-99T282,200h396q60,0 104.5,39t53.5,99l42,300q7,51 -21,86.5T778,760q-21,0 -39,-7.5T706,730l-90,-90L344,640l-90,90q-15,15 -33,22.5t-39,7.5ZM680,520q17,0 28.5,-11.5T720,480q0,-17 -11.5,-28.5T680,440q-17,0 -28.5,11.5T640,480q0,17 11.5,28.5T680,520ZM600,400q17,0 28.5,-11.5T640,360q0,-17 -11.5,-28.5T600,320q-17,0 -28.5,11.5T560,360q0,17 11.5,28.5T600,400ZM310,520h60v-70h70v-60h-70v-70h-60v70h-70v60h70v70Z"              , fill: "currentColor",}))
    ):(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 -960 960 960"   ,}, React.createElement('path', { d: "M182-200q-51 0-79-35.5T82-322l42-300q9-60 53.5-99T282-760h396q60 0 104.5 39t53.5 99l42 300q7 51-21 86.5T778-200q-21 0-39-7.5T706-230l-90-90H344l-90 90q-15 15-33 22.5t-39 7.5Zm16-86 114-114h336l114 114q2 2 16 6 11 0 17.5-6.5T800-304l-44-308q-4-29-26-48.5T678-680H282q-30 0-52 19.5T204-612l-44 308q-2 11 4.5 17.5T182-280q2 0 16-6Zm510.5-165.5Q720-463 720-480t-11.5-28.5Q697-520 680-520t-28.5 11.5Q640-497 640-480t11.5 28.5Q663-440 680-440t28.5-11.5Zm-80-120Q640-583 640-600t-11.5-28.5Q617-640 600-640t-28.5 11.5Q560-617 560-600t11.5 28.5Q583-560 600-560t28.5-11.5ZM310-440h60v-70h70v-60h-70v-70h-60v70h-70v60h70v70Zm170-40Z"                                          , fill: "currentColor",}))
    );
  }
  if(kind==='home'){
    return on?(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   ,}, React.createElement('path', { d: "M6 13h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm9 0h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0-9h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zM6 4h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2z"                                               , fill: "currentColor",}))
    ):(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   ,}, React.createElement('path', { d: "M6 13h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0 2v3h3v-3H6zm9-2h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2v-3c0-1.1 0.9-2 2-2zm0 2v3h3v-3h-3zm0-11h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2h-3c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zm0 2v3h3V6h-3zM6 4h3c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H6c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2zm0 2v3h3V6H6z"                                                  , fill: "currentColor",}))
    );
  }
  if(kind==='heart'){
    return on?(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   ,}, React.createElement('path', { d: "M3,5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20C21,22.472 18.178,23.883 16.2,22.4L12,19.25L7.8,22.4C5.822,23.883 3,22.472 3,20V5Z"        , fill: "currentColor",}))
    ):(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   ,}, React.createElement('path', { d: "M11.539,17.112C11.876,16.937 12.288,16.967 12.6,17.2L17.4,20.8C18.06,21.294 19,20.824 19,20V5C19,3.895 18.105,3 17,3H7C5.895,3 5,3.895 5,5V20C5,20.824 5.94,21.294 6.6,20.8L11.4,17.2L11.539,17.112ZM21,20C21,22.472 18.178,23.883 16.2,22.4L12,19.249L7.8,22.4C5.822,23.883 3,22.472 3,20V5C3,2.791 4.791,1 7,1H17C19.209,1 21,2.791 21,5V20Z"                  , fill: "currentColor",}))
    );
  }
  if(kind==='head'){
    return on?(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 24 24"   ,}, React.createElement('path', { d: "M12,3a9,9 0,0 0,-9 9v7a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-4a2,2 0,0 0,-2 -2H5v-1a7,7 0,1 1,14 0v1h-2a2,2 0,0 0,-2 2v4a2,2 0,0 0,2 2h2a2,2 0,0 0,2 -2v-7a9,9 0,0 0,-9 -9Z"                           , fill: "currentColor",}))
    ):(
      React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, viewBox: "0 0 960 960"   ,}, React.createElement('path', { d: "M360,840H200q-33,0-56.5-23.5T120,760V480q0-75 28.5-140.5t77-114t114-77T480,120t140.5,28.5t114,77t77,114T840,480V760q0,33-23.5,56.5T760,840H600V520H760V480q0-117-81.5-198.5T480,200T281.5,281.5T200,480v40H360V840ZM280,600H200V760h80V600Zm400,0V760h80V600H680Zm-400,0H200H200Zm400,0H680H680Z" , fill: "currentColor",}))
    );
  }
  return null;
};

const BottomNav=({route,nav})=>{
  const items=[
    {k:'nav_games',p:'/games',i:'game'},
    {k:'nav_apps',p:'/',i:'home',root:true},
    {k:'nav_search',p:'/search',i:'search'},
    {k:'nav_library',p:'/favorites',i:'heart'},
    {k:'nav_music',p:'/music',i:'head'}
  ];
  return(
    React.createElement('nav', { className: "app-footer bot-nav w-full bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] pb-safe sm:hidden"       ,}
      , React.createElement('div', { className: "flex justify-around items-center h-16 px-2"    ,}
        , items.map(it=>{
          const a=it.root ? route==='/' : route.startsWith(it.p);
          return (
            React.createElement('button', { key: it.k, onClick: ()=>nav(it.p),
              className: `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${a?'text-primary nav-ico-on':'text-muted-foreground hover:text-foreground'}`,}
              , React.createElement('div', { className: `flex items-center justify-center rounded-full transition-all duration-200 ${a?'nav-pill-on bg-primary/10 w-14 h-8':'w-8 h-8'}`,}
                , React.createElement(NavIcon, { kind: it.i, on: !!a, className: "w-6 h-6" ,})
              )
              , React.createElement('span', { className: "bot-nav-label",}, t(it.k))
            )
          );
        })
      )
    )
  );
};

const bumpReloadSeed=()=>{
  const c=(getS('apk_reload_count',0)|0)+1;
  setS('apk_reload_count',c);
  return Math.floor((c-1)/5);
};
const getContentSeed=()=>{const c=getS('apk_reload_count',0)|0;return c||1};
const FRESH_WORDS=['new','latest','best','top','free','popular','trending','hd','pro','lite','plus','mini','offline','2024','2025','2026','daily','hot','editor','choice','fun','fast','smart','social','tools'];
const freshTerm=(base,seed,i=0)=>String(base||'')+' '+FRESH_WORDS[(Math.abs(seed)+i)%FRESH_WORDS.length];
const dropSeen=(key,list)=>{const seen=new Set((getS(key,[])||[]).map(String));const fresh=(list||[]).filter(a=>a&&!seen.has(String(a.trackId)));return fresh.length>=6?fresh:list};
const rememberIds=(key,list)=>setS(key,(list||[]).map(a=>a&&a.trackId).filter(Boolean).slice(0,140));
const pickSlice=(arr,n,seed)=>{
  if(!arr||!arr.length)return [];
  const start=(seed*3)%Math.max(1,arr.length);
  const out=[];
  for(let i=0;i<n&&i<arr.length;i++)out.push(arr[(start+i)%arr.length]);
  return out;
};

const GameShotCard=({app,onClick})=>{
  if(!app)return null;
  const shot=(app.screenshotUrls&&app.screenshotUrls[0])||app.artworkUrl512||app.artworkUrl100;
  const icon=app.artworkUrl100||app.artworkUrl60;
  return(
    React.createElement('button', { type: "button", className: "g-shot-card", onClick: ()=>onClick(app),}
      , React.createElement('div', { className: "g-shot-wrap",}
        , React.createElement(PhImg, { src: shot, kind: "banner", className: "g-shot-ph", imgClass: "shot",})
        , React.createElement('div', { className: "g-shot-grad",})
      )
      , React.createElement('div', { className: "g-shot-meta",}
        , React.createElement(PhImg, { src: icon, kind: "icon", className: "g-shot-icon", imgClass: "g-shot-icon-img",})
        , React.createElement('span', { className: "g-shot-name",}, app.trackName)
      )
    )
  );
};

const uniqApps=arr=>{
  const seen=new Set();const out=[];
  (arr||[]).forEach(a=>{
    if(!a||a.trackId==null)return;
    const k=String(a.trackId);
    if(seen.has(k))return;
    seen.add(k);out.push(a);
  });
  return out;
};
const takeLoop=(arr,n,off)=>{
  if(!arr||!arr.length||!n)return [];
  const out=[];
  for(let i=0;i<n;i++)out.push(arr[(off+i)%arr.length]);
  return out;
};
const framesOf3=arr=>{
  const out=[];
  for(let i=0;i<arr.length;i+=3){
    const g=arr.slice(i,i+3);
    if(g.length)out.push(g);
  }
  return out;
};
const homeSize=bytes=>{
  if(!bytes)return '';
  const mb=bytes/(1024*1024);
  if(mb<1)return Math.max(1,Math.round(bytes/1024))+' KB';
  return (mb>=100?mb.toFixed(0):mb.toFixed(1))+' MB';
};
const promoShot=app=>(app&&((app.screenshotUrls&&app.screenshotUrls[0])||app.artworkUrl512||app.artworkUrl100))||'';

const PromoCarousel=({apps,open,openInstall,auto})=>{
  const ref=useRef(null);
  const[idx,setIdx]=useState(0);
  const hold=useRef(false);
  const scrollSlide=(el,next,smooth)=>{
    const slide=el.children[next];
    if(!slide)return;
    const page=document.getElementById('app-scroll');
    const y=page?page.scrollTop:0;
    const delta=slide.getBoundingClientRect().left-el.getBoundingClientRect().left;
    el.scrollBy({left:delta,behavior:smooth?'smooth':'auto'});
    if(page)page.scrollTop=y;
  };
  const goTo=(n,smooth=true)=>{
    const el=ref.current;if(!el||!apps||!apps.length)return;
    const max=apps.length;
    const next=((n%max)+max)%max;
    scrollSlide(el,next,smooth);
    setIdx(next);
  };
  useEffect(()=>{
    if(!auto||!apps||apps.length<2)return;
    const t=setInterval(()=>{
      if(hold.current)return;
      setIdx(cur=>{
        const next=(cur+1)%apps.length;
        const el=ref.current;
        if(el){
          const slide=el.children[next];
          if(slide){
            const page=document.getElementById('app-scroll');
            const y=page?page.scrollTop:0;
            const delta=slide.getBoundingClientRect().left-el.getBoundingClientRect().left;
            el.scrollBy({left:delta,behavior:'smooth'});
            if(page)requestAnimationFrame(()=>{page.scrollTop=y});
          }
        }
        return next;
      });
    },4800);
    return()=>clearInterval(t);
  },[auto,apps]);
  const onScroll=()=>{
    const el=ref.current;if(!el)return;
    const slides=Array.from(el.children);
    let best=0,bestD=1e9;
    slides.forEach((sl,i)=>{const d=Math.abs(sl.getBoundingClientRect().left-el.getBoundingClientRect().left);if(d<bestD){bestD=d;best=i}});
    setIdx(best);
  };
  if(!apps||!apps.length)return null;
  return(
    React.createElement('div', { className: "mb-4 pt-3" ,}
      , React.createElement('div', { className: "promo-wrap",}
        , React.createElement('div', {
          className: "promo-scroller",
          ref: ref,
          onScroll: onScroll,
          onPointerDown: ()=>{hold.current=true},
          onPointerUp: ()=>{hold.current=false},
          onPointerCancel: ()=>{hold.current=false},}

          , apps.map((app,i)=>{
            const shot=promoShot(app);
            const icon=app.artworkUrl100||app.artworkUrl60||shot;
            return(
              React.createElement('div', { className: "promo-slide", key: 'promo-'+app.trackId+'-'+i,}
                , React.createElement('div', { className: "promo-ghost",}
                  , React.createElement('button', { type: "button", className: "promo-banner-wrap", onClick: ()=>open(app),}
                    , React.createElement('span', { className: "promo-banner-clip",}
                      , React.createElement(PhImg, { src: shot, kind: "ad", eager: i===0, className: "promo-shot-ph", imgClass: "promo-shot",})
                      , React.createElement('span', { className: "promo-caption",}, (app.description||app.artistName||'').replace(/\s+/g,' ').slice(0,72))
                    )
                  )
                  , React.createElement('div', { className: "promo-foot", dir: _lang==='ar'?'rtl':'ltr',}
                    , React.createElement(PhImg, { src: icon, kind: "icon", className: "promo-icon", imgClass: "promo-icon-img", onClick: ()=>open(app),})
                    , React.createElement('button', { type: "button", className: "promo-meta", onClick: ()=>open(app), style: {border:0,background:'transparent',color:'inherit',fontFamily:'inherit',cursor:'pointer'},}
                      , React.createElement('div', { className: "promo-name",}, app.trackName)
                      , React.createElement('div', { className: "promo-sub",}, app.artistName||'')
                      , React.createElement('div', { className: "promo-rate",}, "★ " , fmtRating(app.averageUserRating))
                    )
                    , React.createElement('button', { type: "button", className: "promo-install", onClick: e=>{e.stopPropagation();openInstall?openInstall(app):open(app)},}, t('install'))
                  )
                )
              )
            );
          })
        )
      )
      , apps.length>1&&(
        React.createElement('div', { className: "promo-dots",}
          , apps.map((_,i)=>React.createElement('span', { key: i, className: `promo-dot ${i===idx?'on':''}`, onClick: ()=>goTo(i),}))
        )
      )
    )
  );
};

const StackedAppsPager=({frames,open,title})=>{
  if(!frames||!frames.length)return null;
  return(
    React.createElement('section', { className: "mb-5",}
      , React.createElement('div', { className: "stack-head",}
        , React.createElement('span', { className: "stack-head-title",}, title||t('ads_suggested'))
      )
      , React.createElement('div', { className: "stack-scroller",}
        , frames.map((group,fi)=>(
          React.createElement('div', { className: "stack-slide", key: 'frame-'+fi+'-'+(group[0]&&group[0].trackId),}
            , React.createElement('div', { className: "stack-card",}
              , group.map(app=>(
                React.createElement('button', { type: "button", className: "stack-row", key: app.trackId, onClick: ()=>open(app), dir: _lang==='ar'?'rtl':'ltr',}
                  , React.createElement(PhImg, { src: app.artworkUrl100||app.artworkUrl60, kind: "icon", className: "stack-row-icon", imgClass: "stack-row-icon-img",})
                  , React.createElement('div', { className: "stack-row-body",}
                    , React.createElement('div', { className: "stack-row-name",}, app.trackName)
                    , React.createElement('div', { className: "stack-row-sub",}, [app.primaryGenreName,app.artistName].filter(Boolean).slice(0,2).join(' • '))
                    , React.createElement('div', { className: "stack-row-stats",}
                      , app.averageUserRating?React.createElement('span', null, "★ " , Number(app.averageUserRating).toFixed(1)):null
                      , app.fileSizeBytes?React.createElement('span', null, homeSize(app.fileSizeBytes)):null
                    )
                  )
                )
              ))
            )
          )
        ))
      )
    )
  );
};

const isGameApp=a=>{
  if(!a)return true;
  const gid=Number(a.primaryGenreId);
  if(gid===6014)return true;
  const ids=a.genreIds;
  if(Array.isArray(ids)&&ids.some(x=>Number(x)===6014||String(x)==='6014'))return true;
  const names=[a.primaryGenreName,...(Array.isArray(a.genres)?a.genres:[])].map(x=>String(x||'').toLowerCase());
  return names.some(g=>g==='games'||g==='game'||g==='ألعاب'||g.indexOf('games')>=0||g.indexOf('game')===0);
};
const onlyApps=list=>(list||[]).filter(a=>a&&!isGameApp(a));
const SVG_NET_SPIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="loadingGradient" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4285F4"/><stop offset="0.34" stop-color="#34A853"/><stop offset="0.67" stop-color="#FBBC05"/><stop offset="1" stop-color="#EA4335"/></linearGradient></defs><circle cx="60" cy="60" r="46" fill="none" stroke="url(#loadingGradient)" stroke-width="14" stroke-linecap="round" stroke-dasharray="1 289"><animateTransform attributeName="transform" type="rotate" values="0 60 60;90 60 60;300 60 60;360 60 60" keyTimes="0;0.45;0.75;1" keySplines="0.65 0 0.85 0.25;0.12 0.85 0.35 1;0.25 0.05 0.55 1" calcMode="spline" dur="2.4s" repeatCount="indefinite"/><animate attributeName="stroke-dasharray" values="1 289;25 265;90 200;160 130;220 70;250 40;250 40;1 289" keyTimes="0;0.12;0.25;0.38;0.50;0.56;0.60;1" keySplines="0.4 0 0.6 1;0.35 0 0.55 1;0.3 0 0.5 1;0.25 0 0.45 1;0.15 0 0.3 1;0.7 0 1 0.15;0.05 0.8 0.2 1" calcMode="spline" dur="2.4s" repeatCount="indefinite"/></circle></svg>`;
const SVG_ANDROID_PH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="48" height="48"><path fill="#e3e3e3" d="M40-239q8-106 65-196.5T256-579l-75-129q-3-9-.5-18t10.5-14q9-5 19.5-2t15.5 12l74 127q86-37 180-37t180 37l75-127q5-9 15.5-12t19.5 2q8 5 11.5 14.5T780-708l-76 129q94 53 151 143.5T920-239H40Zm275-125q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Zm400 0q15-15 15-35t-15-35q-15-15-35-15t-35 15q-15 15-15 35t15 35q15 15 35 15t35-15Z"/></svg>`;
const SVG_SHOT_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="175" height="175"><g><path d="M512,843.9a62.6,62.6 0,1 0,0 -125.1,62.6 62.6,0 0,0 0,125.1zM366.5,671.8a44.4,44.4 0,0 1,-34.4 -15.7,46.8 46.8,0 0,1 3.2,-65.7A262.2,262.2 0,0 1,512 523.2c9.4,0 18.8,0 28.2,1.5 25,3.2 43.8,26.6 42.2,51.6 -3.1,25 -26.6,43.8 -51.6,42.2a175.9,175.9 0,0 0,-131.4 42.2,55.1 55.1,0 0,1 -32.9,11zM235.1,540.4c-12.5,0 -25,-4.7 -34.4,-14.1a48.7,48.7 0,0 1,1.6 -67.3c45.4,-42.2 97,-75.1 154.9,-95.4 25,-9.4 51.6,3.1 59.4,28.2 9.4,25 -3.1,51.6 -28.2,59.4 -45.4,17.2 -87.6,42.2 -123.6,76.7 -6.3,9.4 -18.8,12.5 -29.7,12.5zM788.9,540.4c-11,0 -23.5,-4.7 -32.9,-12.5a351.2,351.2 0,0 0,-209.6 -95.4c-25,-3.1 -45.4,-25 -42.2,-51.6 3.1,-26.6 25,-43.8 51.6,-42.2 98.6,9.4 192.4,53.2 264.4,120.4 18.8,17.2 20.4,46.9 1.6,65.7 -7.8,11 -20.4,15.7 -32.9,15.7zM89.6,394.9c-12.5,0 -25,-4.7 -34.4,-14.1 -17.2,-18.8 -17.2,-48.5 1.6,-65.7 46.9,-45.4 98.6,-82.9 156.5,-111.1a45,45 0,0 1,62.5 20.3c12.5,23.5 3.2,51.6 -20.3,62.6a618.3,618.3 0,0 0,-134.6 95.4c-7.8,9.4 -20.3,12.5 -31.3,12.5zM934.4,394.9c-11,0 -23.5,-4.7 -32.9,-12.5 -104.8,-101.7 -244.1,-156.5 -389.5,-156.5 -45.4,0 -90.8,4.7 -134.5,15.7a46.6,46.6 0,1 1,-21.9 -90.8c51.6,-12.5 103.3,-18.8 156.5,-18.8 170.5,0 331.6,65.7 455.3,183 18.8,17.2 18.8,46.9 1.6,65.7 -9.4,9.4 -21.9,14.1 -34.4,14.1z" fill="#BEC2C6"/><path d="M932.8,978.4c-12.5,0 -23.5,-4.7 -32.9,-14.1L56.7,121.1c-18.8,-18.8 -18.8,-48.5 0,-65.7 18.8,-18.8 48.5,-18.8 65.7,0l843.2,843.3c18.8,18.8 18.8,48.5 0,65.7 -9.4,9.4 -20.3,14.1 -32.9,14.1z" fill="#BEC2C6"/></g></svg>`;
const SVG_WIFI_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="72" height="72"><path fill="#e3e3e3" d="M73-536 2-607q97-94 220.5-143.5T480-800q134 0 257.5 49.5T958-607l-71 71q-82-79-187-121.5T480-700q-115 0-220 42.5T73-536Zm350.5 352.5Q400-207 400-240t23.5-56.5Q447-320 480-320t56.5 23.5Q560-273 560-240t-23.5 56.5Q513-160 480-160t-56.5-23.5ZM298-309l-70-71q51-48 116-74t136-26q41 0 80.5 8.5T636-446q-17 17-33 38.5T574-363q-23-8-46.5-12.5T480-380q-51 0-97.5 18T298-309ZM186-422l-70-71q74-71 168-109t197-38q103 0 196.5 37.5T845-494l-15 16q-20-3-36.5-7.5T760-490q-14 0-28.5 3.5T701-478q-50-30-106-46t-115-16q-83 0-158.5 30.5T186-422Zm545.5 250.5Q720-183 720-200t11.5-28.5Q743-240 760-240t28.5 11.5Q800-217 800-200t-11.5 28.5Q777-160 760-160t-28.5-11.5ZM720-280v-140h80v140h-80Z"/></svg>`;
const svgDataUri = svg => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
const NetSpin = ({full,center}) => (
  React.createElement('div', { className: center ? 'net-spin net-center' : full ? 'net-spin net-full' : 'net-spin net-in', role: "status", 'aria-label': "loading",}
    , React.createElement('div', { className: "net-spin-mark", dangerouslySetInnerHTML: {__html:SVG_NET_SPIN},})
  )
);
const sendNetNotice = () => {
  const body = 'تم قطع الإتصال بالإنترنت تحقق من الخادم';
  const done = () => { try { if (window.__apkToast) window.__apkToast('تم إرسال الإشعار'); } catch (e17) {} };
  try {
    if (typeof Notification !== 'undefined') {
      const fire = () => { try { new Notification('APKDroid', { body }); done(); } catch (e18) { done(); } };
      if (Notification.permission === 'granted') { fire(); return; }
      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') fire(); else done(); }).catch(done);
        return;
      }
    }
  } catch (e19) {}
  done();
};
const NetOffline = ({onRetry}) => (
  React.createElement('div', { className: "net-off net-in" , role: "alert",}
    , React.createElement('div', { className: "net-off-block",}
      , React.createElement('div', { className: "net-off-ico", dangerouslySetInnerHTML: {__html:SVG_WIFI_OFF},})
      , React.createElement('p', null, "تم قطع الإتصال بالإنترنت تحقق من الخادم"      )
      , React.createElement('div', { className: "net-off-actions",}
        , React.createElement('button', { type: "button", className: "net-off-btn", onClick: onRetry,}, "إعادة المحاولة" )
        , React.createElement('button', { type: "button", className: "net-off-btn net-off-btn-alt" , onClick: sendNetNotice,}, "إرسال إشعار" )
      )
    )
  )
);
const BLANK_PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const installImgFallback = () => {
  if (window.__apkImgFb) return;
  window.__apkImgFb = true;
  const iconUri = svgDataUri(SVG_ANDROID_PH);
  const shotUri = svgDataUri(SVG_SHOT_OFF);
  document.addEventListener('error', ev => {
    const el = ev.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.fb) return;
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/(acc-avatar|acc-edit-avatar|store-logo|nav-avatar)/.test(cls)) return;
    if (el.closest && el.closest('.acc-overlay')) return;
    const shot = /(bg-screenshot|bg-lightbox-img)/.test(cls) || !!(el.closest && el.closest('.dt-thumbs,.bg-screenshots,.bg-lightbox'));
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w) { el.style.width = w + 'px'; el.style.minWidth = w + 'px'; el.style.maxWidth = w + 'px'; }
    if (h) { el.style.height = h + 'px'; el.style.minHeight = h + 'px'; el.style.maxHeight = h + 'px'; }
    el.dataset.fb = shot ? 'shot' : 'icon';
    el.style.objectFit = 'none';
    el.style.padding = '0';
    el.style.backgroundColor = 'hsl(var(--muted))';
    el.style.backgroundImage = 'url("' + (shot ? shotUri : iconUri) + '")';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.style.backgroundSize = '58%';
    el.src = BLANK_PX;
  }, true);
};
installImgFallback();

const PageIntro=()=>(
  React.createElement('div', { className: "page-intro",}
    , React.createElement('div', { className: "page-intro-name",}, "APKDroid")
  )
);
const SVG_TIMEOUT='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225"><g><path d="M183.755 92.384l23.355-9.985 3.734 8.735-23.355 9.985z" fill="#78909C"></path><path d="M300.016 105.501l-75.215 32.156-41.472-97.007 75.215-32.156z" fill="#B0BEC5"></path><path d="M237.06 70.417l-28.504 12.186L192.36 44.72l28.504-12.186zm34.422-14.723L242.978 67.88l-16.196-37.883 28.504-12.186zm-15.38 59.184l-28.504 12.186-16.196-37.883 28.504-12.186zm34.37-14.591l-28.504 12.186-16.196-37.883 28.504-12.186z" fill="#00616E"></path><path d="M81.281 63.336l81.192-34.711 52.754 123.397-81.192 34.711z" fill="#B0BEC5"></path><path d="M157.1 187.2l-3.7-8.7 43.8-18.8 3.7 8.7" fill="#90A4AE"></path><path d="M103.432 20.379l2.53-2.271 15.364 17.114-2.53 2.271z" fill="#78909C"></path><path d="M91.9 41.4c9.3 5.6 21.6 4.7 30.1-2.9s10.7-19.7 6.1-29.6L91.9 41.4z" fill="#B0BEC5"></path><path d="M84.237 134.88l23.355-9.985 3.734 8.735-23.355 9.985zm3.333-56.887l81.192-34.711 1.612 3.77-81.192 34.711zm39.776 93.116l81.192-34.711 1.612 3.77-81.192 34.711z" fill="#78909C"></path><path d="M131 105.5c-1.2 0-2.5-0.2-3.6-0.7-2.4-1-4.3-2.8-5.3-5.2l3.5-1.5c0.6 1.5 1.8 2.6 3.2 3.2 1.5 0.6 3.1 0.6 4.5-0.1 1.5-0.6 2.6-1.8 3.2-3.2 0.6-1.5 0.6-3.1-0.1-4.5l3.5-1.5c1 2.4 1.1 5 0.1 7.5-1 2.4-2.8 4.3-5.2 5.3-1.2 0.4-2.5 0.7-3.8 0.7zm22.8-8.9c-1.2 0-2.5-0.2-3.6-0.7-2.4-1-4.3-2.8-5.3-5.2l3.5-1.5c0.6 1.5 1.8 2.6 3.2 3.2s3.1 0.6 4.5-0.1c1.5-0.6 2.6-1.8 3.2-3.2 0.6-1.5 0.6-3.1-0.1-4.5l3.5-1.5c1 2.4 1.1 5 0.1 7.5-1 2.4-2.8 4.3-5.2 5.3-1.2 0.4-2.5 0.7-3.8 0.7zM139.5 119c-1.9-4.4 2.2-10.3 9.1-13.3 6.9-2.9 14-1.8 15.9 2.6l-25 10.7z" fill="#455A64"></path><path d="M146.8 130c-1.2 0.5-2.6 0-3.1-1.2l-4.2-9.8 4.3-1.9 4.2 9.8c0.5 1.2 0 2.6-1.2 3.1z" fill="#ECEFF1"></path><path d="M148.5 122c-1.2 0.5-2.6 0-3.1-1.2l-1.6-3.6 4.3-1.9 1.6 3.6c0.5 1.2 0 2.6-1.2 3.1z" fill="#ECEFF1"></path><path d="M116.665 184.37L41.45 216.526l-41.472-97.007 75.215-32.156z" fill="#B0BEC5"></path><path d="M53.709 149.286l-28.504 12.186-16.196-37.883 28.504-12.186zm34.422-14.723l-28.504 12.186-16.196-37.883L71.935 96.68zm-15.432 59.316l-28.504 12.186-16.196-37.883 28.504-12.186zm34.422-14.723l-28.504 12.186-16.196-37.883 28.504-12.186z" fill="#00616E"></path></g></svg>';
const LoadTimeout=({show,onRetry})=>{
  if(!show)return null;
  return(
    React.createElement('div', { className: "load-timeout",}
      , React.createElement('div', { className: "load-timeout-logo", dangerouslySetInnerHTML: {__html:SVG_TIMEOUT},})
      , React.createElement('p', null, t('load_timeout'))
      , React.createElement('button', { type: "button", className: "load-timeout-btn", onClick: onRetry,}, t('retry_load'))
    )
  );
};

const homeSources=seed=>[
  ()=>api.search(freshTerm('best apps',seed,0),24).catch(()=>api.top()),
  ()=>api.cat(freshTerm('for you apps',seed,1),GENRES.entertainment.id,24).catch(()=>[]),
  ()=>api.cat(freshTerm('messaging social chat',seed,2),6005,24).catch(()=>api.search(freshTerm('whatsapp messenger social',seed,3),20)),
  ()=>api.cat(freshTerm('productivity tools',seed,4),GENRES.productivity.id,24).catch(()=>api.search(freshTerm('productivity',seed,5),20)),
  ()=>api.cat(freshTerm('education learn',seed,6),GENRES.education.id,24).catch(()=>api.search(freshTerm('education',seed,7),20)),
  ()=>api.search(freshTerm('photo video editor',seed,8),20).catch(()=>[]),
];

let homePoolCache=[];
const Home=({nav,open,openInstall})=>{
  const[pool,setPool]=useState(()=>homePoolCache.slice());
  const[shown,setShown]=useState(()=>homePoolCache.length?10:0);
  const[done,setDone]=useState(()=>homePoolCache.length>0);
  const[reload,setReload]=useState(0);
  const[timedOut,setTimedOut]=useState(false);
  const[intro,setIntro]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setIntro(false),500);return()=>clearTimeout(t)},[]);
  useEffect(()=>{
    let cancel=false;
    if(reload>0)homePoolCache=[];
    let got=homePoolCache.length>0;
    if(!got){setPool([]);setShown(0);setDone(false);setTimedOut(false)}
    else{setPool(homePoolCache.slice());setShown(10);setDone(true);setTimedOut(false)}
    const timer=setTimeout(()=>{if(!cancel&&!got)setTimedOut(true)},10000);
    (async()=>{
      const seed=getContentSeed()+reload*17;
      const sources=homeSources(seed);
      let acc=[];
      for(let i=0;i<sources.length;i+=2){
        const lists=await Promise.all(sources.slice(i,i+2).map(fn=>fn().catch(()=>[])));
        if(cancel)return;
        acc=dropSeen('apk_seen_apps',uniqApps(onlyApps(acc.concat(lists.flat()))));
        const rotated=pickSlice(acc,acc.length,seed);
        const next=rotated.length?rotated:acc;
        setPool(next);
        if(next.length){got=true;homePoolCache=next.slice();setTimedOut(false);clearTimeout(timer);rememberIds('apk_seen_apps',next)}
        setShown(s=>Math.min(10,s+2));
      }
      if(!cancel){
        setShown(10);setDone(true);
        if(!got&&!acc.length)setTimedOut(true);
      }
    })();
    return()=>{cancel=true;clearTimeout(timer)};
  },[reload]);
  const adsPool=pool.filter(a=>a&&((a.screenshotUrls&&a.screenshotUrls[0])||a.artworkUrl512||a.artworkUrl100));
  const adsSrc=adsPool.length?adsPool:pool;
  const topAds=takeLoop(adsSrc,6,0);
  const midAds=takeLoop(adsSrc,6,7);
  const endAds=takeLoop(adsSrc,6,13);
  const stackTitles=[t('ads_suggested'),t('suggested_for_you'),t('sec_best'),t('sec_for_you'),t('sec_social')];
  const rowTitles=[t('suggested_for_you'),t('sec_best'),t('sec_for_you'),t('sec_social'),t('sec_most_dl')];
  const units=[];
  for(let i=0;i<5;i++){
    units.push({kind:'stack',title:stackTitles[i],frames:framesOf3(takeLoop(pool,9,6+i*17))});
    units.push({kind:'row',title:rowTitles[i],apps:takeLoop(pool,10,12+i*11)});
  }
  const visible=units.slice(0,shown);
  const showMid=shown>=4;
  const showEnd=done||shown>=10;
  const renderUnit=(u,i)=>u.kind==='stack'?(
    React.createElement(StackedAppsPager, { key: 'u-'+i, frames: u.frames, open: open, title: u.title,})
  ):(
    React.createElement(HScroll, { key: 'u-'+i, title: u.title, onSeeAll: ()=>nav('/search'), rtl: true,}
      , u.apps.map(a=>React.createElement(AppCard, { key: 'row-'+i+'-'+a.trackId, app: a, small: true, onClick: open,}))
    )
  );
  const booting=!pool.length&&!timedOut;
  const showIntro=intro||booting;
  return(
    React.createElement('div', { className: "page-stage pb-24 sm:pb-8"  ,}
      , intro&&React.createElement(NetSpin, { center: true,})
      , !intro&&booting&&React.createElement(NetSpin, { full: true,})
      , React.createElement(LoadTimeout, { show: timedOut&&!pool.length&&!intro, onRetry: ()=>setReload(n=>n+1),})
      , !showIntro&&pool.length>0&&React.createElement(PromoCarousel, { apps: topAds, open: open, openInstall: openInstall, auto: true,})
      , !showIntro&&visible.slice(0,4).map((u,i)=>renderUnit(u,i))
      , !showIntro&&showMid&&React.createElement(PromoCarousel, { apps: midAds, open: open, openInstall: openInstall, auto: true,})
      , !showIntro&&visible.slice(4).map((u,i)=>renderUnit(u,i+4))
      , !showIntro&&showEnd&&React.createElement(PromoCarousel, { apps: endAds, open: open, openInstall: openInstall, auto: true,})
      , !done&&(
        React.createElement('div', { className: "px-4 py-3 space-y-3"  ,}
          , React.createElement(Skel, { c: "h-16 w-full" ,})
          , React.createElement(Skel, { c: "h-16 w-full" ,})
        )
      )
    )
  );
};

const GAME_SECTIONS=[
  {k:'g_most_dl',term:'top free games popular',gid:6014},
  {k:'g_br',term:'battle royale games',gid:6014},
  {k:'g_sandbox',term:'sandbox games minecraft',gid:6014},
  {k:'g_tanks',term:'tank games war',gid:6014},
  {k:'g_adventure',term:'adventure games',gid:6014},
  {k:'g_popular',term:'popular mobile games',gid:6014},
  {k:'g_horror',term:'horror games',gid:6014},
  {k:'g_kids',term:'kids games children',gid:6014},
  {k:'g_rpg',term:'RPG role playing games',gid:6014},
  {k:'g_strategy',term:'strategy games',gid:6014},
  {k:'g_sim',term:'simulation truck games',gid:6014},
  {k:'g_puzzle',term:'puzzle brain games',gid:6014},
];

let gamesRowsCache=null;
const Games=({open})=>{
  const[rows,setRows]=useState(()=>gamesRowsCache?gamesRowsCache.map(r=>(r||[]).slice()):GAME_SECTIONS.map(()=>[]));
  const[ready,setReady]=useState(()=>gamesRowsCache&&gamesRowsCache.some(r=>r&&r.length)?GAME_SECTIONS.length:0);
  const[reload,setReload]=useState(0);
  const[timedOut,setTimedOut]=useState(false);
  const[intro,setIntro]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setIntro(false),500);return()=>clearTimeout(t)},[]);
  useEffect(()=>{
    let cancel=false;
    if(reload>0)gamesRowsCache=null;
    const cached=gamesRowsCache&&gamesRowsCache.some(r=>r&&r.length);
    let got=!!cached;
    if(!cached){setRows(GAME_SECTIONS.map(()=>[]));setReady(0);setTimedOut(false)}
    else{setRows(gamesRowsCache.map(r=>(r||[]).slice()));setReady(GAME_SECTIONS.length);setTimedOut(false)}
    const timer=setTimeout(()=>{if(!cancel&&!got)setTimedOut(true)},10000);
    (async()=>{
      const seed=getContentSeed()+reload*17;
      for(let i=0;i<GAME_SECTIONS.length;i+=2){
        const batch=[i,i+1].filter(x=>x<GAME_SECTIONS.length);
        const results=await Promise.all(batch.map(idx=>{
          const sec=GAME_SECTIONS[idx];
          const term=freshTerm(sec.term,seed,idx);
          return api.cat(term,sec.gid,25).catch(()=>api.search(term,25).catch(()=>[]));
        }));
        if(cancel)return;
        const has=results.some(r=>r&&r.length);
        if(has){got=true;setTimedOut(false);clearTimeout(timer)}
        setRows(prev=>{
          const n=prev.slice();
          batch.forEach((idx,j)=>{n[idx]=dropSeen('apk_seen_games',pickSlice((results[j]||[]).filter(a=>a&&isGameApp(a)),12,seed+idx))});
          rememberIds('apk_seen_games',n.flat());
          if(n.some(r=>r&&r.length))gamesRowsCache=n.map(r=>(r||[]).slice());
          return n;
        });
        setReady(x=>x+batch.length);
      }
      if(!cancel&&!got)setTimedOut(true);
    })();
    return()=>{cancel=true;clearTimeout(timer)};
  },[reload]);
  const hasGames=rows.some(r=>r&&r.length);
  const booting=!hasGames&&!timedOut;
  const showIntro=intro||booting;
  return(
    React.createElement('div', { className: "page-stage pb-20 sm:pb-8 pt-2"   ,}
      , intro&&React.createElement(NetSpin, { center: true,})
      , !intro&&booting&&React.createElement(NetSpin, { full: true,})
      , React.createElement(LoadTimeout, { show: timedOut&&!hasGames&&!intro, onRetry: ()=>setReload(n=>n+1),})
      , !showIntro&&GAME_SECTIONS.map((sec,i)=>{
        if(i>=ready && i>=ready+2)return null;
        const list=rows[i]||[];
        const waiting=i>=ready;
        return(
          React.createElement(HScroll, { key: sec.k, title: t(sec.k), rtl: true, pad: "px-5 g-shot-row" ,}
            , waiting||!list.length
              ?Array(3).fill(0).map((_,j)=>React.createElement('div', { key: j, className: "shrink-0 g-shot-ph ph-wait"  , style: {width:'min(88vw,420px)',aspectRatio:'16/9',borderRadius:16},}, React.createElement(M3Spin, { size: 28,})))
              :list.map(a=>React.createElement(GameShotCard, { key: a.trackId+'-'+sec.k, app: a, onClick: open,}))
            
          )
        );
      })
    )
  );
};

const PLAY_GAME_CATS=[
  {ar:'الحركة',en:'Action',term:'action games',icon:'heli',color:'#E53935'},
  {ar:'المحاكاة',en:'Simulation',term:'simulation games',icon:'sim',color:'#26A69A'},
  {ar:'ألغاز',en:'Puzzle',term:'puzzle games',icon:'puzzle',color:'#1E88E5'},
  {ar:'المغامرات',en:'Adventure',term:'adventure games',icon:'compass',color:'#F6BF26'},
  {ar:'سباق',en:'Racing',term:'racing games',icon:'flag',color:'#7E57C2'},
  {ar:'تقمص الأدوار',en:'Role playing',term:'role playing games',icon:'swords',color:'#5C6BC0'},
  {ar:'استراتيجية',en:'Strategy',term:'strategy games',icon:'sflag',color:'#43A047'},
  {ar:'رياضة',en:'Sports',term:'sports games',icon:'tennis',color:'#EC407A'},
  {ar:'الورق',en:'Cards',term:'card games',icon:'cards',color:'#F06292'},
  {ar:'لوحية',en:'Board',term:'board games',icon:'rook',color:'#43A047'},
];
const PLAY_APP_CATS=[
  {ar:'ترفيه',en:'Entertainment',term:'entertainment',icon:'clapper',color:'#7E57C2'},
  {ar:'اجتماعي',en:'Social',term:'social',icon:'people',color:'#EF5350'},
  {ar:'أدوات',en:'Tools',term:'tools utilities',icon:'tools',color:'#26A69A'},
  {ar:'تصوير',en:'Photography',term:'photo video',icon:'camera',color:'#42A5F5'},
  {ar:'موسيقى',en:'Music',term:'music',icon:'note',color:'#FF7043'},
  {ar:'تسوق',en:'Shopping',term:'shopping',icon:'bag',color:'#26C6DA'},
];

const MAT_PATH={
  heli:'M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
  sim:'M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z',
  puzzle:'M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z',
  compass:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
  flag:'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  swords:'M6.92 5L8 6.07l-2.12 2.12-1.06-1.06L6.92 5zM14 11.17l1.41 1.42L20.83 7.17 19.41 5.76 14 11.17zM3.27 20.73l6.36-6.36 1.41 1.41-6.36 6.36-1.41-1.41zM16.24 4.59l1.41 1.41-5.66 5.66-1.41-1.41 5.66-5.66zM19.07 2.93l2 2-1.41 1.41-2-2 1.41-1.41zM4.93 19.07l2 2-1.41 1.41-2-2 1.41-1.41zM11.17 14l1.42 1.41-5.66 5.66-1.41-1.41L11.17 14z',
  sflag:'M21 9V7l-2-2V3h-2v2l-2 2v2h-2V3h-2v6H9V3H7v2L5 7v2H3v12h8v-4h2v4h8V9h-2zm-10 8H9v-2h2v2zm6 0h-2v-2h2v2z',
  tennis:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.3l1.35-.95c1.82.56 3.37 1.76 4.38 3.34l-.39 1.34-1.35.46L13 6.7V5.3zM7.08 17.11l-1.14.1C4.73 15.81 4 13.99 4 12c0-.12.01-.23.02-.35l1-.73 1.38.48 1.46 4.34-.78 1.37zm7.42 2.48c-.79.26-1.63.41-2.5.41s-1.71-.15-2.5-.41l-.69-1.49.64-1.1h5.11l.64 1.1-.7 1.49zM14.27 15H9.73l-1.35-4.02L12 8.44l3.63 2.54L14.27 15z',
  cards:'M2.53 19.65l1.34.56v-9.03l-2.43 5.86c-.41 1.02.08 2.19 1.09 2.61zm19.5-3.7L17.07 3.98c-.31-.75-1.04-1.21-1.81-1.23-.26 0-.53.04-.79.15L7.1 5.95c-.75.31-1.21 1.03-1.23 1.8-.01.27.04.54.15.8l4.96 11.97c.31.76 1.05 1.22 1.83 1.23.26 0 .52-.05.77-.15l7.36-3.05c1.02-.42 1.51-1.59 1.09-2.6zM7.88 8.75c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
  rook:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z',
  clapper:'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  people:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  tools:'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  camera:'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  note:'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  bag:'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z'
};
const MatIco=({name})=> (
  React.createElement('svg', { viewBox: "0 0 24 24"   , width: "26", height: "26", 'aria-hidden': "true",}
    , React.createElement('path', { fill: "currentColor", d: MAT_PATH[name]||MAT_PATH.puzzle,})
  )
);
const playCatLabel=c=>_lang==='ar'?c.ar:c.en;
const PlayGlyph=({icon,color})=>{
  const f=color||'currentColor';
  if(icon==='heli')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M3 10h9.2l1.4-2.2H20v2.1h-3.2L15.4 12H20a2 2 0 010 4h-5.2l-1.6 2.4H8.2L6.6 16H3v-2h2.4L6.6 12H3v-2zm8.2 0L9.6 12h3.6l1.6-2h-3.6z"           ,}), React.createElement('circle', { cx: "18.2", cy: "7.2", r: "1.1", fill: f,}));
  if(icon==='sim')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M4 14h16v3H4z" ,}), React.createElement('path', { fill: f, d: "M6 11h12l-1.2-4H7.2z" ,}), React.createElement('path', { fill: f, d: "M8 8h2.2L9 5H7zM14 8h2.2L17 5h-2z"    ,}));
  if(icon==='puzzle')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M8 3h5a2 2 0 012 2v1.2a2.2 2.2 0 010 4.1V13H8.7a2.2 2.2 0 01-4.2 0H3V5a2 2 0 012-2h3z"                ,}));
  if(icon==='compass')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('circle', { cx: "12", cy: "12", r: "8", fill: "none", stroke: f, strokeWidth: "2",}), React.createElement('path', { fill: f, d: "M14.8 9.2l-1.2 4.4-4.4 1.2 1.2-4.4z"    ,}));
  if(icon==='flag')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M6 3h2v18H6z" ,}), React.createElement('path', { fill: f, d: "M8 4h10l-1.4 3L18 10H8z"   ,}), React.createElement('path', { fill: "#fff", d: "M9.2 5.2h1.2v1.2H9.2zm2.4 0h1.2v1.2h-1.2zm2.4 0h1.2v1.2h-1.2zM10.4 6.6h1.2v1.2h-1.2zm2.4 0h1.2v1.2h-1.2z"     ,}));
  if(icon==='swords')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M14.5 3l2 2-6.2 6.2-2-2zM7.2 12.3l2 2L4 19.5 3 21l1.5-1 5.2-5.2zM9.5 3L7.5 5l6.2 6.2 2-2zM16.8 12.3l-2 2L20 19.5 21 21l-1.5-1-5.2-5.2z"                  ,}));
  if(icon==='sflag')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M6 3h2v18H6z" ,}), React.createElement('path', { fill: f, d: "M8 4h11l-2.2 3.2L19 11H8z"   ,}));
  if(icon==='tennis')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('ellipse', { cx: "12", cy: "13", rx: "6", ry: "7", fill: "none", stroke: f, strokeWidth: "2",}), React.createElement('path', { d: "M8 7c2 2 2 8 0 12M16 7c-2 2-2 8 0 12"           , fill: "none", stroke: f, strokeWidth: "1.6",}), React.createElement('path', { d: "M12 4v3" , stroke: f, strokeWidth: "2",}));
  if(icon==='cards')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('rect', { x: "7", y: "4", width: "11", height: "15", rx: "2", fill: f,}), React.createElement('rect', { x: "4", y: "7", width: "11", height: "14", rx: "2", fill: "#F8BBD0", stroke: f, strokeWidth: "1.2",}));
  if(icon==='rook')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M7 20h10v-2H7zm1-3h8l1-8H7zm1-9h6V5h-1.4V3h-1.2v2h-1.2V3H9.6v2H8z" ,}));
  if(icon==='clapper')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M4 8h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2z"        ,}), React.createElement('path', { fill: f, d: "M4 8l2.2-4h3L7 8zm4.2 0l2.2-4h3L11.2 8zm4.4 0l2.2-4H18l-2.2 4z"      ,}));
  if(icon==='people')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('circle', { cx: "9", cy: "8", r: "2.4", fill: f,}), React.createElement('circle', { cx: "16", cy: "9", r: "2", fill: f,}), React.createElement('path', { fill: f, d: "M4 18c.4-2.6 2.4-4 5-4s4.6 1.4 5 4zm8.2-3.2c1.6.2 3 .9 3.6 3.2H20c-.3-2.2-1.8-3.6-4-4-.9 0-1.7.1-2.4.4z"           ,}));
  if(icon==='tools')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M14 4a4 4 0 00-3.6 5.6L4 16.1 7.9 20l6.5-6.4A4 4 0 0014 4zm0 2.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6z"                     ,}));
  if(icon==='camera')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M8 6l1.4-2h5.2L16 6h3a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"                ,}), React.createElement('circle', { cx: "12", cy: "13", r: "3.2", fill: "#E3F2FD",}));
  if(icon==='note')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M9 4h2v9.2a3 3 0 11-2-2.8V4zm6 2h2v7.2a3 3 0 11-2-2.8V6z"        ,}));
  if(icon==='bag')return React.createElement('svg', { viewBox: "0 0 24 24"   , width: "28", height: "28",}, React.createElement('path', { fill: f, d: "M6 8h12l-1 12H7z"  ,}), React.createElement('path', { d: "M9 8V7a3 3 0 016 0v1"     , fill: "none", stroke: "#fff", strokeWidth: "1.6",}));
  return null;
};
const fmtCount=n=>{
  n=Number(n)||0;
  const ar=_lang==='ar';
  if(n>=1e9)return (n/1e9).toFixed(1)+(ar?' مليار+':'B+');
  if(n>=1e6)return Math.max(1,Math.round(n/1e6))+(ar?' مليون+':'M+');
  if(n>=1e3)return Math.max(1,Math.round(n/1e3))+(ar?' ألف+':'K+');
  return n?String(n):'';
};
const SearchAdRow=({app,onOpen})=>{
  if(!app)return null;
  const rating=fmtRating(app.averageUserRating);
  const count=fmtCount(app.userRatingCount);
  return (
    React.createElement('button', { type: "button", className: "ps-ad-row", onClick: ()=>onOpen(app),}
      , React.createElement(PhImg, { src: app.artworkUrl100||app.artworkUrl60||'', kind: "ad", className: "ps-ad-icon", imgClass: "ps-ad-icon-img",})
      , React.createElement('span', { className: "ps-ad-mid",}
        , React.createElement('span', { className: "ps-ad-name",}, app.trackName)
        , React.createElement('span', { className: "ps-ad-dev",}, app.artistName||'')
        , React.createElement('span', { className: "ps-ad-pills",}
          , rating!=='—'&&React.createElement('span', { className: "ps-pill",}, "★ " , rating)
          , count&&React.createElement('span', { className: "ps-pill",}, "↓ " , count)
        )
      )
    )
  );
};
const Search=({nav,open,initQ,photo,onOpenAccount})=>{
  const[q,setQ]=useState(initQ||'');
  const recRef=useRef(null);
  const [listening,setListening]=useState(false);
  const[res,setRes]=useState([]);
  const[ld,setLd]=useState(false);
  const[hist,setHist]=useState(()=>getS('apk_search_history',[]));
  const[panel,setPanel]=useState(!!(initQ&&String(initQ).trim()));
  const[submitted,setSubmitted]=useState(!!(initQ&&String(initQ).trim()));
  const[suggest,setSuggest]=useState([]);
  const[ads,setAds]=useState([]);
  const ref=useRef(null);
  const startMic=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    setPanel(true);
    if(!SR){
      setTimeout(()=>{try{ref.current&&ref.current.focus()}catch(e){}}, 40);
      return;
    }
    try{if(recRef.current)recRef.current.stop()}catch(e){}
    const rec=new SR();
    rec.lang=_lang==='ar'?'ar-SA':'en-US';
    rec.interimResults=true;
    rec.continuous=false;
    rec.onresult=(ev)=>{
      let text='';
      for(let i=0;i<ev.results.length;i++) text+=ev.results[i][0].transcript;
      setQ(text);
      const last=ev.results[ev.results.length-1];
      if(last&&last.isFinal){
        const v=text.trim();
        if(v){
          pushSearchHist(v,'apps');
          setHist(getS('apk_search_history',[]));
          setSubmitted(true);
          setSuggest([]);
        }
      }
    };
    rec.onerror=()=>setListening(false);
    rec.onend=()=>setListening(false);
    recRef.current=rec;
    setListening(true);
    try{rec.start()}catch(e){setListening(false)}
  };
  useEffect(()=>{
    let cancel=false;
    api.search('best apps',12).then(list=>{if(!cancel)setAds((list||[]).slice(0,8))}).catch(()=>{});
    return()=>{cancel=true};
  },[]);
  useEffect(()=>{
    if(!panel||submitted){setSuggest([]);return}
    const term=q.trim();
    if(!term){setSuggest([]);return}
    let cancel=false;
    const timer=setTimeout(async()=>{
      try{
        const list=await api.search(term,8);
        if(!cancel)setSuggest((list||[]).slice(0,6));
      }catch (e20){if(!cancel)setSuggest([])}
    },220);
    return()=>{cancel=true;clearTimeout(timer)};
  },[q,panel,submitted]);
  useEffect(()=>{
    if(!submitted)return;
    const term=q.trim();
    if(!term){setRes([]);setLd(false);return}
    let cancel=false;
    setLd(true);
    api.search(term,30).then(list=>{if(!cancel)setRes(list||[])}).catch(()=>{if(!cancel)setRes([])}).finally(()=>{if(!cancel)setLd(false)});
    return()=>{cancel=true};
  },[submitted,q]);
  const openPanel=()=>{
    setPanel(true);
    setSubmitted(false);
    setRes([]);
    setTimeout(()=>{try{ref.current&&ref.current.focus()}catch(e){}},40);
  };
  const closePanel=()=>{
    setPanel(false);
    setSubmitted(false);
    setQ('');
    setSuggest([]);
    setRes([]);
    try{ref.current&&ref.current.blur()}catch(e){}
  };
  const doS=term=>{
    const v=String(term==null?q:term).trim();
    if(!v)return;
    pushSearchHist(v,'apps');
    setHist(getS('apk_search_history',[]));
    setQ(v);
    setPanel(true);
    setSubmitted(true);
    setSuggest([]);
    try{ref.current&&ref.current.blur()}catch(e){}
  };
  const openCat=c=>nav(`/category/${encodeURIComponent(c.term)}`);
  const ar=_lang==='ar';
  const catGrid=(list,title)=>(
    React.createElement('section', { className: "ps-sec",}
      , React.createElement('h2', { className: "ps-sec-title",}, title)
      , React.createElement('div', { className: "ps-cat-grid",}
        , list.map(c=>(
          React.createElement('button', { key: c.term, type: "button", className: "ps-cat", onClick: ()=>openCat(c),}
            , React.createElement('span', { className: "ps-cat-ico", style: {color:c.color},}, React.createElement(MatIco, { name: c.icon,}))
            , React.createElement('span', { className: "ps-cat-name",}, playCatLabel(c))
          )
        ))
      )
    )
  );
  return(
    React.createElement('div', { className: "ps-search", dir: ar?'rtl':'ltr',}
      , React.createElement('div', { className: "ps-top",}
        , React.createElement('button', { type: "button", className: "ps-avatar", onClick: onOpenAccount, 'aria-label': t('account'),}
          , photo?React.createElement('img', { src: photo, alt: "",}):React.createElement('span', null, "GO")
        )
        , React.createElement('button', { type: "button", className: "ps-bar", onClick: openPanel,}
          , React.createElement('span', { className: `ps-mic-hit ${listening?'on':''}`, role: "button", 'aria-label': "mic", onClick: e=>{e.stopPropagation();startMic()},}
            , React.createElement(Icon, { name: "mic", className: "w-5 h-5" ,})
          )
          , React.createElement('span', null, t('search_placeholder'))
          , React.createElement(Icon, { name: "search", className: "w-5 h-5" ,})
        )
      )
      , catGrid(PLAY_GAME_CATS, ar?'استكشاف الألعاب':'Explore games')
      , React.createElement('section', { className: "ps-sec",}
        , React.createElement('div', { className: "ps-ad-head",}
          , React.createElement('span', null, ar?'إعلان • إعلانات مقترحة لك':'Ad • Suggested for you')
          , React.createElement('span', { className: "ps-dots",}, "⋮")
        )
        , React.createElement('div', { className: "ps-ad-scroller",}
          , (ads.length?ads:[]).slice(0,6).map(a=>(
            React.createElement('button', { key: a.trackId, type: "button", className: "ps-ad-card", onClick: ()=>open(a),}
              , React.createElement(PhImg, { src: a.artworkUrl100||a.artworkUrl60||'', kind: "ad", className: "ps-ad-card-ph", imgClass: "ps-ad-card-img",})
              , React.createElement('span', null, a.trackName)
              , React.createElement('em', null, "★ " , fmtRating(a.averageUserRating))
            )
          ))
        )
      )
      , catGrid(PLAY_APP_CATS, ar?'استكشاف التطبيقات':'Explore apps')
      , panel&&(
        React.createElement('div', { className: "search-page ps-panel" , dir: ar?'rtl':'ltr',}
          , React.createElement('div', { className: "ps-panel-bar",}
            , React.createElement('button', { type: "button", className: "ps-back", onClick: closePanel, 'aria-label': t('back'),}
              , React.createElement(Icon, { name: "left", className: "w-5 h-5" ,})
            )
            , React.createElement('input', { ref: ref, value: q, onChange: e=>{setQ(e.target.value);setSubmitted(false)}, onKeyDown: e=>{if(e.key==='Enter')doS(q)}, placeholder: ar?'البحث عن التطبيقات والألعاب':t('search_placeholder'), className: "ps-panel-input",})
            , React.createElement('button', { type: "button", className: `ps-mic ${listening?'on':''}`, 'aria-label': "mic", onClick: startMic,}
              , React.createElement(Icon, { name: "mic", className: "w-5 h-5" ,})
            )
          )
          , React.createElement('div', { className: "search-page-body",}
            , submitted?(
              React.createElement(React.Fragment, null
                , ld&&React.createElement('div', { className: "px-4 mt-4 space-y-3"  ,}, Array(5).fill(0).map((_,i)=>React.createElement(Skel, { key: i, c: "h-16 w-full" ,})))
                , !ld&&res.length>0&&React.createElement('div', { className: "ps-result-list",}, res.map(a=>React.createElement(SearchAdRow, { key: a.trackId, app: a, onOpen: open,})))
                , !ld&&res.length===0&&React.createElement('div', { className: "px-4 mt-8 text-center text-muted-foreground text-sm"    ,}, t('app_not_found'))
              )
            ):(
              React.createElement(React.Fragment, null
                , React.createElement('div', { className: "ps-ad-head px" ,}
                  , React.createElement('span', null, ar?'إعلان • إعلانات مقترحة لك':'Ad • Suggested for you')
                  , React.createElement('span', { className: "ps-dots",}, "⋮")
                )
                , React.createElement('div', { className: "ps-result-list",}
                  , (q.trim()&&suggest.length?suggest:ads).slice(0,4).map(a=>React.createElement(SearchAdRow, { key: a.trackId, app: a, onOpen: open,}))
                )
                , React.createElement('h3', { className: "ps-block-title",}, ar?'الأحداث الجارية الآن':'Happening now')
                , React.createElement('h3', { className: "ps-block-title",}, ar?'عمليات البحث التي تمت مؤخرًا':'Recent searches')
                , hist.length===0?React.createElement('div', { className: "px-4 text-sm text-muted-foreground"  ,}, _lang==='ar'?'لا توجد عمليات بحث حديثة':'No recent searches'):hist.slice(0,8).map(h=>(
                  React.createElement('button', { key: h, type: "button", className: "ps-hist", onClick: ()=>doS(h),}
                    , React.createElement('span', { className: "ps-hist-go",}, "↗")
                    , React.createElement('span', { className: "ps-hist-txt",}, h)
                    , React.createElement('span', { className: "ps-hist-ico",}, "↻")
                  )
                ))
              )
            )
          )
        )
      )
    )
  );
};

/* ===== Helpers ported from Blogma Store for the install/detail page ===== */
const fmtSize=(bytes)=>{if(!bytes)return '—';const mb=bytes/(1024*1024);if(mb<1)return (bytes/1024).toFixed(0)+' KB';return mb.toFixed(1)+' MB'};
const fmtDate=(iso)=>{if(!iso)return '—';try{const d=new Date(iso);return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}catch (e21){return iso.slice(0,10)}};
const fmtRating=(r)=>{if(r==null||isNaN(r))return '—';return Number(r).toFixed(1)};
const ratingDistribution=(avgRating)=>{
  const avg=Math.min(5,Math.max(1,Number(avgRating)||4.3));
  const stars=[5,4,3,2,1];
  const raw=stars.map(s=>{const diff=s-avg;let w=Math.exp(-(diff*diff)/2.4);if(s===5)w*=1.45;if(s===1)w*=1.15;return w});
  const sum=raw.reduce((a,b)=>a+b,0);
  const percents=raw.map(w=>Math.round((w/sum)*100));
  const diffSum=100-percents.reduce((a,b)=>a+b,0);
  percents[0]+=diffSum;
  const result={};stars.forEach((s,i)=>result[s]=Math.max(0,percents[i]));
  return result;
};
const fetchReviews=(id,page=1)=>fetchC(`https://itunes.apple.com/${country()}/rss/customerreviews/id=${encodeURIComponent(id)}/sortBy=mostRecent/page=${page}/json`).then(d=>{
  const entries=Array.isArray(_optionalChain([d, 'optionalAccess', _5 => _5.feed, 'optionalAccess', _6 => _6.entry]))?d.feed.entry:[];
  return entries.filter(e=>e&&e['im:rating']).map(e=>({
    id:_optionalChain([e, 'access', _7 => _7.id, 'optionalAccess', _8 => _8.label])||'',
    author:_optionalChain([e, 'access', _9 => _9.author, 'optionalAccess', _10 => _10.name, 'optionalAccess', _11 => _11.label])||'App Store User',
    rating:Number(_optionalChain([e, 'access', _12 => _12['im:rating'], 'optionalAccess', _13 => _13.label])||0),
    title:_optionalChain([e, 'access', _14 => _14.title, 'optionalAccess', _15 => _15.label])||'',
    content:_optionalChain([e, 'access', _16 => _16.content, 'optionalAccess', _17 => _17.label])||'',
    updated:_optionalChain([e, 'access', _18 => _18.updated, 'optionalAccess', _19 => _19.label])||''
  }));
});

const STORE_CONFIGS={
  direct:{id:'direct',labelKey:'store_direct',label:'مباشر',icon:'direct',platform:'android',kind:'direct',buildUrl:(name)=>''},
  google:{id:'google',labelKey:'store_play',label:'Google Play Store',icon:'playstore',platform:'android',buildUrl:(name)=>`https://play.google.com/store/search?q=${encodeURIComponent(name)}&c=apps`},
  apkcombo:{id:'apkcombo',label:'APKCombo',icon:'apkcombo',platform:'android',buildUrl:(name)=>`https://apkcombo.com/search/${encodeURIComponent(name)}`},
  apkpure:{id:'apkpure',label:'APKPure',icon:'apkpure',platform:'android',buildUrl:(name)=>`https://apkpure.com/search?q=${encodeURIComponent(name)}`},
  apkmirror:{id:'apkmirror',label:'APKMirror',icon:'apkpure',platform:'android',buildUrl:(name)=>`https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(name)}`},
  happymod:{id:'happymod',labelKey:'store_happymod',label:'HappyMod',icon:'happymod',platform:'android',buildUrl:(name)=>`https://happymod.com/search.html?q=${encodeURIComponent(name)}`},
  uptodown:{id:'uptodown',labelKey:'store_uptodown',label:'Uptodown',icon:'uptodown',platform:'android',buildUrl:(name)=>`https://en.uptodown.com/android/search/${encodeURIComponent(name)}`},
  apple:{id:'apple',label:'App Store',icon:'applestore',platform:'ios',buildUrl:(name,app)=>(app&&app.trackViewUrl)?app.trackViewUrl:`https://apps.apple.com/search?term=${encodeURIComponent(name)}`},
  microsoft:{id:'microsoft',label:'Microsoft Store',icon:'microsoft',platform:'windows',buildUrl:(name)=>`https://apps.microsoft.com/search?query=${encodeURIComponent(name)}`}
};
const PLATFORM_STORES={
  android:['direct','google','apkpure','apkcombo','apkmirror','happymod','uptodown'],
  ios:['apple'],
  windows:['microsoft']
};
const INSTALL_SOURCE_IDS=['direct','google','apkpure','apkcombo','apkmirror','happymod','uptodown'];
const storeLabel=cfg=>cfg?(cfg.labelKey?t(cfg.labelKey):(cfg.label||cfg.id)):'';
const normalizeStore=id=>INSTALL_SOURCE_IDS.includes(id)?id:'direct';
const corsWraps=u=>[
  u,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];
const parseMaybeJson=async(res)=>{
  const txt=await res.text();
  if(!txt)return null;
  try{
    const j=JSON.parse(txt);
    if(j&&typeof j.contents==='string'){
      try{return JSON.parse(j.contents)}catch (e22){return j}
    }
    return j;
  }catch (e23){return null}
};
const normName=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,' ').trim();
const pickAptoideApp=(list,name,bundle)=>{
  if(!Array.isArray(list)||!list.length)return null;
  const n=normName(name);
  const b=String(bundle||'').toLowerCase();
  let best=null,bestScore=-1;
  for(const it of list){
    if(!it)continue;
    const path=(it.file&&(it.file.path||it.file.path_alt))||it.path||it.path_alt||'';
    if(!path)continue;
    let score=0;
    const pkg=String(it.package||'').toLowerCase();
    const nm=normName(it.name);
    if(b&&pkg===b)score+=120;
    else if(b&&pkg.indexOf(b)>=0)score+=70;
    if(n&&nm===n)score+=100;
    else if(n&&(nm.indexOf(n)>=0||n.indexOf(nm)>=0))score+=60;
    if(/\.apk(\?|$)/i.test(path))score+=15;
    if(Number(it.stats&&it.stats.pdownloads||it.stats&&it.stats.downloads||0)>0)score+=Math.min(20,Math.log10(Number(it.stats.pdownloads||it.stats.downloads)+1));
    if(score>bestScore){bestScore=score;best=it}
  }
  return best||list.find(x=>x&&((x.file&&x.file.path)||x.path))||null;
};
const extractApkPath=it=>{
  if(!it)return '';
  return (it.file&&(it.file.path||it.file.path_alt))||it.path||it.path_alt||'';
};
async function resolveDirectApk(app){
  const name=String(app&&app.trackName||'').trim();
  const bundle=String(app&&app.bundleId||'').trim();
  const queries=[name,name.replace(/[:\-–].*$/,'').trim(),bundle].filter((v,i,a)=>v&&a.indexOf(v)===i);
  for(const q of queries){
    const apiUrl=`https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=10`;
    for(const u of corsWraps(apiUrl)){
      try{
        const r=await fetch(u,{headers:{'Accept':'application/json'}});
        if(!r.ok)continue;
        const d=await parseMaybeJson(r);
        const list=(d&&d.datalist&&d.datalist.list)||(d&&d.list)||[];
        const pick=pickAptoideApp(list,name,bundle);
        const path=extractApkPath(pick);
        if(path)return{url:path,pkg:pick.package||bundle,title:pick.name||name};
      }catch (e24){}
    }
  }
  if(bundle){
    return{
      url:`https://d.apkpure.com/b/APK/${encodeURIComponent(bundle)}?version=latest`,
      pkg:bundle,
      title:name,
      guessed:true
    };
  }
  return null;
}
const triggerApkDownload=(url,filename)=>{
  if(!url)return false;
  try{
    const a=document.createElement('a');
    a.href=url;
    a.setAttribute('download',filename||'app.apk');
    a.rel='noopener';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{try{a.remove()}catch (e25){}},1500);
    return true;
  }catch (e26){
    try{window.location.href=url;return true}catch (e27){return false}
  }
};
const WEB_SEARCH_CONFIGS={
  google:{label:'Google',icon:'google',buildUrl:(name)=>`https://www.google.com/search?q=${encodeURIComponent(name+' app')}`},
  youtube:{label:'YouTube',icon:'youtube',buildUrl:(name)=>`https://www.youtube.com/results?search_query=${encodeURIComponent(name+' app')}`},
  facebook:{label:'Facebook',icon:'facebook',buildUrl:(name)=>`https://www.facebook.com/search/top/?q=${encodeURIComponent(name)}`},
  instagram:{label:'Instagram',icon:'instagram',buildUrl:(name)=>`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(name)}`}
};

const BrandIcon=({name})=>{
  const svgs={
    globe:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "22", height: "22",}, React.createElement('path', { fill: "currentColor", d: "M12 2a10 10 0 100 20 10 10 0 000-20zm7 6h-3c-.3-1.3-.8-2.5-1.4-3.6A8 8 0 0118.9 8zm-7-4a14 14 0 012 4h-4a14 14 0 012-4zM4.3 14a8.2 8.2 0 010-4h3.3a16.5 16.5 0 000 4H4.3zm.8 2h3a14 14 0 001.3 3.6A8 8 0 015.1 16zm3-8H5a8 8 0 014.3-3.6L8 8zM12 20a14 14 0 01-2-4h4a14 14 0 01-2 4zm2.3-6H9.7a14.7 14.7 0 010-4h4.6a14.6 14.6 0 010 4zm.3 5.6c.6-1.2 1-2.4 1.4-3.6h3a8 8 0 01-4.4 3.6zm1.8-5.6a16.5 16.5 0 000-4h3.3a8.2 8.2 0 010 4h-3.3z"                                                                       ,})),
    google:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "22", height: "22",}, React.createElement('path', { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"      ,}), React.createElement('path', { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"            ,}), React.createElement('path', { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"         ,}), React.createElement('path', { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"                   ,})),
    youtube:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "22", height: "22",}, React.createElement('path', { fill: "currentColor", d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"                                                           ,})),
    facebook:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"                            ,})),
    instagram:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"                                                                                      ,})),
    playstore:React.createElement('svg', { viewBox: "0 0 960 960"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M313,902q-40,23-84.5,18T155,881L473,564q12-12 28-12t28,12L666,700L313,902ZM419,510L121,808q-1-3-1-7.5t0-7.5V168q0-3 0.5-6.5T121,155L419,454q11,11 11,28t-11,28ZM735,660L584,510q-12-12-12-28.5T584,453L736,301l118,67q30,17 48,47t18,65t-18.5,65T852,593L735,660ZM530,399q-12,12-28.5,12T473,399L153,80q28-37 74-41.5T315,58L667,260L530,399Z"     ,})),
    applestore:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"                                        ,})),
    microsoft:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('rect', { x: "2", y: "2", width: "9", height: "9", rx: "0.5", fill: "currentColor",}), React.createElement('rect', { x: "13", y: "2", width: "9", height: "9", rx: "0.5", fill: "currentColor",}), React.createElement('rect', { x: "2", y: "13", width: "9", height: "9", rx: "0.5", fill: "currentColor",}), React.createElement('rect', { x: "13", y: "13", width: "9", height: "9", rx: "0.5", fill: "currentColor",})),
    apkpure:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M12 3.2L3.8 20.5h3.4l1.7-4.2h6.2l1.7 4.2h3.4L12 3.2zm0 4.6l2.3 5.7H9.7L12 7.8z"       ,})),
    apkcombo:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.2.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"                                           ,})),
    whatsapp:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5C10 9.9 9.4 8.4 9.1 7.8c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4C6.7 8 6 8.7 6 10.1c0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.3z"                                ,}), React.createElement('path', { fill: "currentColor", d: "M20.5 3.5A11.8 11.8 0 0012 0 11.9 11.9 0 001 17.8L0 24l6.3-1.6A11.9 11.9 0 0012 24a11.9 11.9 0 008.4-20.5zM12 21.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1121.8 12 9.9 9.9 0 0112 21.8z"                               ,})),
    telegram:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M22 3.5L2.6 11c-1 .4-1 1 .1 1.3l4.8 1.5 1.9 5.8c.2.6.5.7.9.4l2.6-2.2 4.6 3.4c.7.5 1.2.3 1.4-.6l3-14C22.2 3.7 22.6 3.3 22 3.5zM7.9 13.5l9.2-5.8c.4-.3.8-.1.5.2l-7.5 6.8-.3 3.2-1.9-4.4z"                     ,})),
    github:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 011.2-3.2 4.3 4.3 0 010-3.2s1-.3 3.3 1.2a11.4 11.4 0 016 0c2.3-1.6 3.3-1.2 3.3-1.2a4.3 4.3 0 010 3.2 4.6 4.6 0 011.2 3.2c0 4.7-2.9 5.7-5.6 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3z"                                                    ,})),
    bluetooth:React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20",}, React.createElement('polygon', { points: "6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"           ,})),
    quickshare:React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20",}, React.createElement('circle', { cx: "18", cy: "5", r: "3",}), React.createElement('circle', { cx: "6", cy: "12", r: "3",}), React.createElement('circle', { cx: "18", cy: "19", r: "3",}), React.createElement('line', { x1: "8.6", y1: "10.5", x2: "15.4", y2: "6.5",}), React.createElement('line', { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5",})),
    copy:React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20",}, React.createElement('rect', { x: "9", y: "9", width: "13", height: "13", rx: "2",}), React.createElement('path', { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"           ,})),
    share:React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20",}, React.createElement('circle', { cx: "18", cy: "5", r: "3",}), React.createElement('circle', { cx: "6", cy: "12", r: "3",}), React.createElement('circle', { cx: "18", cy: "19", r: "3",}), React.createElement('line', { x1: "8.6", y1: "10.5", x2: "15.4", y2: "6.5",}), React.createElement('line', { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5",})),
    direct:React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", width: "20", height: "20",}, React.createElement('path', { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"        ,}), React.createElement('polyline', { points: "7 10 12 15 17 10"     ,}), React.createElement('line', { x1: "12", y1: "15", x2: "12", y2: "3",}), React.createElement('path', { d: "M8 21h8" ,})),
    happymod:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('circle', { cx: "12", cy: "12", r: "10", fill: "currentColor", opacity: ".18",}), React.createElement('path', { fill: "currentColor", d: "M7.2 15.2V8.8h2.1l2.7 4.3 2.7-4.3h2.1v6.4h-1.7V11.4l-2.4 3.8h-1.4L8.9 11.4v3.8H7.2z"     ,})),
    uptodown:React.createElement('svg', { viewBox: "0 0 24 24"   , width: "20", height: "20",}, React.createElement('path', { fill: "currentColor", d: "M6 4h12v3.2H6V4zm2.2 5.2h7.6L12 20 8.2 9.2z"     ,})),
  };
  return svgs[name]||null;
};

/* ===== شريط صفحة التثبيت + معلومات iTunes ===== */
const DetailTopBar=({app,isFav,onToggleFav,onShare,onOpenIn,onToggleTheme,isDark,onInfo,onBack})=>{
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    if(!open)return;
    const k=e=>{if(e.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',k);
    return()=>window.removeEventListener('keydown',k);
  },[open]);
  const run=fn=>()=>{setOpen(false);if(fn)fn()};
  const ar=_lang==='ar';
  return(
    React.createElement('div', { className: "hdr-top-row dt-bar flex items-center px-4 max-w-screen-2xl mx-auto w-full sticky top-0 z-40 bg-[hsl(var(--bg))]"           , style: {direction:'ltr'},}
      , React.createElement('div', { className: "dt-left",}
        , app&&(
          React.createElement(React.Fragment, null
            , React.createElement('div', { className: "dt-menu-wrap",}
              , React.createElement('button', { type: "button", className: "nav-chip shrink-0" , onClick: ()=>setOpen(o=>!o), 'aria-label': t('more_options'), 'aria-haspopup': "menu", 'aria-expanded': open,}
                , React.createElement(Icon, { name: "dots", className: "w-5 h-5" ,})
              )
              , open&&(
                React.createElement(React.Fragment, null
                  , React.createElement('div', { className: "dt-scrim", onClick: ()=>setOpen(false),})
                  , React.createElement('div', { className: "dt-menu", role: "menu", dir: ar?'rtl':'ltr',}
                    , React.createElement('button', { type: "button", role: "menuitem", className: "dt-item", onClick: run(onShare),}
                      , React.createElement(BrandIcon, { name: "share",})
                      , React.createElement('span', null, t('dt_share'))
                    )
                    , React.createElement('button', { type: "button", role: "menuitem", className: "dt-item", onClick: run(onOpenIn),}
                      , React.createElement(Icon, { name: "external", className: "w-5 h-5" ,})
                      , React.createElement('span', null, t('dt_open_in'))
                    )
                    , React.createElement('button', { type: "button", role: "menuitem", className: "dt-item", onClick: run(onToggleTheme),}
                      , React.createElement(Icon, { name: isDark?'sun':'moon', className: "w-5 h-5" ,})
                      , React.createElement('span', null, t('dt_theme'))
                    )
                    , React.createElement('button', { type: "button", role: "menuitem", className: "dt-item", onClick: run(onInfo),}
                      , React.createElement(Icon, { name: "info", className: "w-5 h-5" ,})
                      , React.createElement('span', null, t('dt_info'))
                    )
                  )
                )
              )
            )
            , React.createElement('button', { type: "button", className: `nav-chip dt-fav shrink-0 ${isFav?'on':''}`, onClick: onToggleFav, 'aria-label': isFav?t('dt_unsave'):t('dt_save'), 'aria-pressed': !!isFav,}
              , React.createElement(Icon, { name: isFav?'bookmarkFill':'bookmark', className: "w-5 h-5" ,})
            )
          )
        )
      )
      , React.createElement('div', { className: "flex-1",})
      , React.createElement('button', { type: "button", className: "nav-chip shrink-0" , onClick: onBack, 'aria-label': t('back'),}
        , React.createElement(Icon, { name: "arrowRight", className: "w-5 h-5" ,})
      )
    )
  );
};

const IT_LABELS={
  trackName:['اسم التطبيق','App name'],
  trackCensoredName:['الاسم المعروض','Censored name'],
  artistName:['المطوّر','Developer'],
  sellerName:['البائع','Seller'],
  bundleId:['معرّف الحزمة','Bundle ID'],
  trackId:['معرّف التطبيق','Track ID'],
  artistId:['معرّف المطوّر','Artist ID'],
  sellerUrl:['موقع المطوّر','Developer website'],
  artistViewUrl:['صفحة المطوّر','Developer page'],
  trackViewUrl:['صفحة التطبيق','App page'],
  version:['الإصدار','Version'],
  releaseDate:['تاريخ أول إصدار','First release'],
  currentVersionReleaseDate:['تاريخ آخر تحديث','Last update'],
  releaseNotes:['ما الجديد','Release notes'],
  description:['الوصف','Description'],
  price:['السعر','Price'],
  formattedPrice:['السعر المعروض','Formatted price'],
  currency:['العملة','Currency'],
  fileSizeBytes:['الحجم','File size'],
  minimumOsVersion:['أدنى إصدار للنظام','Minimum OS version'],
  supportedDevices:['الأجهزة المدعومة','Supported devices'],
  features:['الميزات','Features'],
  advisories:['التنبيهات','Advisories'],
  languageCodesISO2A:['اللغات','Languages'],
  primaryGenreName:['التصنيف الرئيسي','Primary genre'],
  primaryGenreId:['معرّف التصنيف الرئيسي','Primary genre ID'],
  genres:['التصنيفات','Genres'],
  genreIds:['معرّفات التصنيفات','Genre IDs'],
  contentAdvisoryRating:['التصنيف العمري','Age rating'],
  trackContentRating:['تصنيف المحتوى','Content rating'],
  averageUserRating:['متوسط التقييم','Average rating'],
  userRatingCount:['عدد التقييمات','Rating count'],
  averageUserRatingForCurrentVersion:['متوسط تقييم الإصدار الحالي','Average rating (current version)'],
  userRatingCountForCurrentVersion:['عدد تقييمات الإصدار الحالي','Rating count (current version)'],
  isGameCenterEnabled:['مركز الألعاب','Game Center'],
  isVppDeviceBasedLicensingEnabled:['ترخيص VPP للأجهزة','VPP device licensing'],
  kind:['النوع','Kind'],
  wrapperType:['نوع العنصر','Wrapper type'],
  artworkUrl60:['الأيقونة 60','Icon 60'],
  artworkUrl100:['الأيقونة 100','Icon 100'],
  artworkUrl512:['الأيقونة 512','Icon 512'],
  screenshotUrls:['لقطات الشاشة (iPhone)','Screenshots (iPhone)'],
  ipadScreenshotUrls:['لقطات الشاشة (iPad)','Screenshots (iPad)'],
  appletvScreenshotUrls:['لقطات الشاشة (Apple TV)','Screenshots (Apple TV)'],
};
const IT_ORDER=Object.keys(IT_LABELS);
const IT_DATE_KEYS=['releaseDate','currentVersionReleaseDate'];
const IT_COUNT_KEYS=['userRatingCount','userRatingCountForCurrentVersion'];
const IT_LONG_KEYS=['description','releaseNotes'];
const isHttpUrl=s=>typeof s==='string'&&/^https?:\/\//i.test(s);

const InfoVal=({k,v})=>{
  const dash=React.createElement('span', { className: "dt-muted",}, "—");
  if(v===null||v===undefined||v==='')return dash;
  if(typeof v==='boolean')return React.createElement('span', null, v?t('dt_yes'):t('dt_no'));
  if(Array.isArray(v)){
    if(!v.length)return dash;
    if(v.every(isHttpUrl))return(
      React.createElement('div', { className: "dt-thumbs",}
        , v.map((u,i)=>(
          React.createElement('a', { key: i, href: u, target: "_blank", rel: "noopener noreferrer" ,}, React.createElement('img', { className: "shot", src: u, alt: "", loading: "lazy",}))
        ))
      )
    );
    return React.createElement('div', { className: "dt-chips",}, v.map((x,i)=>React.createElement('span', { key: i, className: "dt-chip",}, typeof x==='object'?JSON.stringify(x):String(x))));
  }
  if(typeof v==='object')return React.createElement('div', { className: "dt-long", dir: "ltr", style: {fontFamily:'ui-monospace,Menlo,Consolas,monospace',fontSize:'.8rem'},}, JSON.stringify(v,null,2));
  if(k==='fileSizeBytes'&&!isNaN(Number(v)))return React.createElement('span', null, fmtSize(Number(v)), " " , React.createElement('span', { className: "dt-muted",}, "(", Number(v).toLocaleString(), " B)" ));
  if(IT_DATE_KEYS.includes(k))return React.createElement('span', null, fmtDate(v), " " , React.createElement('span', { className: "dt-muted", dir: "ltr",}, "(", String(v), ")"));
  if(IT_COUNT_KEYS.includes(k)&&!isNaN(Number(v)))return React.createElement('span', null, Number(v).toLocaleString());
  if(isHttpUrl(v)){
    const link=React.createElement('a', { href: v, target: "_blank", rel: "noopener noreferrer" , dir: "ltr",}, v);
    if(/^artworkUrl/.test(k))return React.createElement('div', { className: "dt-art",}, React.createElement('img', { className: "app-icon-img", src: v, alt: "", loading: "lazy",}), link);
    return link;
  }
  if(IT_LONG_KEYS.includes(k))return React.createElement('div', { className: "dt-long", dir: "auto",}, String(v));
  return React.createElement('span', null, String(v));
};

const AppInfoSheet=({app,onClose})=>{
  useEffect(()=>{
    const k=e=>{if(e.key==='Escape')onClose&&onClose()};
    window.addEventListener('keydown',k);
    return()=>window.removeEventListener('keydown',k);
  },[onClose]);
  const ar=_lang==='ar';
  const keys=Object.keys(app||{});
  const ordered=IT_ORDER.filter(k=>keys.includes(k)).concat(keys.filter(k=>!IT_ORDER.includes(k)).sort());
  const label=k=>{const l=IT_LABELS[k];return l?(ar?l[0]:l[1]):k};
  return(
    React.createElement('div', { className: "dt-info-overlay", onClick: e=>{if(e.target===e.currentTarget)onClose&&onClose()},}
      , React.createElement('div', { className: "dt-info-sheet", dir: ar?'rtl':'ltr', role: "dialog", 'aria-modal': "true", 'aria-label': t('dt_info'),}
        , React.createElement('div', { className: "dt-info-head",}
          , React.createElement('div', { className: "dt-info-title",}, t('dt_info'))
          , React.createElement('button', { type: "button", className: "dt-x", onClick: onClose, 'aria-label': t('dt_close'),}
            , React.createElement(Icon, { name: "x", className: "w-5 h-5" ,})
          )
        )
        , React.createElement('div', { className: "dt-info-body",}
          , React.createElement('div', { className: "dt-info-app",}
            , React.createElement('img', { src: app.artworkUrl512||app.artworkUrl100||'', alt: "",})
            , React.createElement('div', { style: {minWidth:0},}
              , React.createElement('div', { className: "dt-info-name",}, app.trackName)
              , React.createElement('div', { className: "dt-muted", style: {fontSize:'.85rem'},}, app.artistName)
            )
          )
          , ordered.map(k=>(
            React.createElement('div', { className: "dt-row", key: k,}
              , React.createElement('div', { className: "dt-row-k",}
                , React.createElement('span', null, label(k))
                , IT_LABELS[k]&&React.createElement('span', { className: "dt-key",}, k)
              )
              , React.createElement('div', { className: "dt-row-v",}, React.createElement(InfoVal, { k: k, v: app[k],}))
            )
          ))
        )
      )
    )
  );
};

const Detail=({id,nav,favs,toggle,selStore,expMode,setDetailApp,autoInstall,onToggleTheme,isDark})=>{
  const[app,setApp]=useState(null);const[sim,setSim]=useState([]);const[ld,setLd]=useState(true);const[exp,setExp]=useState(false);
  const[shareOpen,setShareOpen]=useState(false);
  const[infoOpen,setInfoOpen]=useState(false);
  const[reviews,setReviews]=useState([]);const[revLd,setRevLd]=useState(true);const[revAll,setRevAll]=useState(false);const[revAllLd,setRevAllLd]=useState(false);
  const[toastMsg,setToastMsg]=useState('');
  const[lbIdx,setLbIdx]=useState(null);
  const[peek,setPeek]=useState(null);
  const[peekHide,setPeekHide]=useState(false);
  const openPeek=(src)=>{if(!src)return; setPeekHide(false); setPeek(src)};
  const[dlView,setDlView]=useState(()=>computeDlProgress(getDlRec(id)));
  const[reqOpen,setReqOpen]=useState(false);
  const toastT=useRef(null);
  const touchX=useRef(null);
  const fileInputRef=useRef(null);
  const dlCancelRef=useRef(false);
  const dlTimerRef=useRef(null);
  const shouldLaunchRef=useRef(false);
  const linkFiredRef=useRef(false);

  const cancelInstall=()=>{
    dlCancelRef.current=true;
    shouldLaunchRef.current=false;
    linkFiredRef.current=false;
    if(dlTimerRef.current){clearTimeout(dlTimerRef.current);dlTimerRef.current=null}
    clearDlRec(id);
    setDlView({active:false,phase:'idle',pct:0});
  };

  const openFilesPicker=()=>{
    const name=String((app&&app.trackName)||'').trim();
    try{
      if(fileInputRef.current){
        fileInputRef.current.value='';
        fileInputRef.current.click();
        return;
      }
    }catch (e28){}
    const q=encodeURIComponent(name);
    const tries=[
      `intent:#Intent;action=android.intent.action.GET_CONTENT;type=*/*;S.android.intent.extra.TITLE=${q};end`,
      `intent:#Intent;action=android.intent.action.OPEN_DOCUMENT;type=*/*;end`,
      `intent:#Intent;action=android.intent.action.SEARCH;S.query=${q};end`,
    ];
    const go=i=>{
      if(i>=tries.length)return;
      try{window.location.href=tries[i]}catch (e29){go(i+1)}
    };
    go(0);
  };

  const[netTry,setNetTry]=useState(0);
  const[waited,setWaited]=useState(false);
  const[failKind,setFailKind]=useState('');
  useEffect(()=>{window.__apkToast=showToast},[toastMsg]);
  useEffect(()=>{
    let cancel=false;
    setLd(true);setFailKind('');setWaited(false);setApp(null);
    const timer=setTimeout(()=>{if(!cancel)setWaited(true)},10000);
    (async()=>{
      try{
        const a=await api.lookup(id);
        if(cancel)return;
        if(!a){
          setApp(null);
          const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
          setFailKind(offline?'net':'missing');
          if(setDetailApp)setDetailApp(null);
        }else{
          setApp(a);setFailKind('');
          if(setDetailApp)setDetailApp(a);
          if(a.primaryGenreName){
            const similar=await api.cat(a.primaryGenreName,a.primaryGenreId||6000,10);
            if(!cancel)setSim(similar.filter(x=>x.trackId!==a.trackId).slice(0,8));
          }
        }
      }catch (e30){
        if(!cancel){setApp(null);setFailKind('net');if(setDetailApp)setDetailApp(null)}
      }finally{if(!cancel)setLd(false)}
    })();
    return()=>{cancel=true;clearTimeout(timer);if(setDetailApp)setDetailApp(null)};
  },[id,netTry]);
  useEffect(()=>{if(autoInstall&&!ld&&app)setReqOpen(true)},[autoInstall,ld,app,id]);
  useEffect(()=>{
    if(!dlView.active||dlView.phase==='done')return;
    if(!shouldLaunchRef.current||linkFiredRef.current||dlCancelRef.current)return;
    if(!app)return;
    linkFiredRef.current=true;
    shouldLaunchRef.current=false;
    const cfg=STORE_CONFIGS[selStore]||STORE_CONFIGS.google;
    const useDirect=cfg.kind==='direct'||selStore==='direct';
    let href='#';
    try{href=cfg.buildUrl(app.trackName||'',app)}catch (e31){href=app.trackViewUrl||'#'}
    if(useDirect){
      showToast(t('dl_resolving'));
      resolveDirectApk(app).then(found=>{
        if(dlCancelRef.current)return;
        if(found&&found.url){
          const fn=((found.title||app.trackName||'app').replace(/[\\/:*?"<>|]+/g,' ').trim()||'app')+'.apk';
          triggerApkDownload(found.url,fn);
          try{
            const cur=getDlRec(app.trackId);
            if(cur){cur.installHref=found.url;setS(dlKey(app.trackId),cur)}
          }catch (e32){}
          try{
            const cur=getDlRec(app.trackId);
            if(cur&&!cur.runMs){cur.runMs=Date.now();setS(dlKey(app.trackId),cur)}
          }catch (e33){}
          showToast(t('dl_direct_ok'));
        }else{
          showToast(t('dl_direct_fail'));
        }
      }).catch(()=>{if(!dlCancelRef.current)showToast(t('dl_direct_fail'))});
      return;
    }
    if(isPaidApp(app)){
      openNativePlayStore(app.trackName||'');
    }else{
      try{window.open(href,'_blank','noopener')}catch (e34){window.location.href=href}
    }
    try{
      const cur=getDlRec(app.trackId);
      if(cur&&!cur.runMs){cur.runMs=Date.now();setS(dlKey(app.trackId),cur)}
    }catch (e35){}
    showToast(t('dl_direct_ok'));
  },[dlView.active,dlView.phase,app,selStore]);

  useEffect(()=>{
    setReviews([]);setRevAll(false);setRevLd(true);setLbIdx(null);
    (async()=>{try{const r=await fetchReviews(id,1);setReviews(r)}catch (e36){setReviews([])}finally{setRevLd(false)}})();
  },[id]);

  useEffect(()=>{
    const tick=()=>{
      const rec=getDlRec(id);
      setDlView(computeDlProgress(rec));
    };
    tick();
    const t=setInterval(tick,250);
    return()=>clearInterval(t);
  },[id]);

  const shots=_optionalChain([app, 'optionalAccess', _20 => _20.screenshotUrls])||[];
  const promoShot=(expMode&&shots[0])?shots[0]:null;
  useEffect(()=>{
    document.documentElement.classList.toggle('exp-banner',!!promoShot);
    return()=>document.documentElement.classList.remove('exp-banner');
  },[promoShot]);

  const showToast=msg=>{setToastMsg(msg);if(toastT.current)clearTimeout(toastT.current);toastT.current=setTimeout(()=>setToastMsg(''),2500)};

  const openLb=i=>setLbIdx(i);
  const closeLb=()=>setLbIdx(null);
  const lbPrev=()=>setLbIdx(i=>i==null?null:(i<=0?shots.length-1:i-1));
  const lbNext=()=>setLbIdx(i=>i==null?null:(i>=shots.length-1?0:i+1));
  const onLbTouchStart=e=>{touchX.current=e.touches[0].clientX};
  const onLbTouchEnd=e=>{
    if(touchX.current==null)return;
    const dx=e.changedTouches[0].clientX-touchX.current;
    touchX.current=null;
    if(Math.abs(dx)<40)return;
    if(dx<0)lbNext();else lbPrev();
  };

  const loadAllReviews=async()=>{
    setRevAllLd(true);
    try{
      let all=[];
      for(let p=1;p<=10;p++){
        const pr=await fetchReviews(id,p).catch(()=>[]);
        if(!pr.length)break;
        all=all.concat(pr);
        if(pr.length<10)break;
      }
      const seen=new Set();const uniq=[];
      for(const r of all){const k=r.id||`${r.author}|${r.updated}|${r.title}`;if(!seen.has(k)){seen.add(k);uniq.push(r)}}
      setReviews(uniq);setRevAll(true);
    }catch (e37){}finally{setRevAllLd(false)}
  };

  const isF=!!app&&(favs||[]).some(f=>f&&String(f.trackId)===String(app.trackId));
  const goBack=()=>{if(_navMoved)window.history.back();else nav('/')};
  const openInOtherStore=()=>{
    if(!app)return;
    const q=encodeURIComponent(app.trackName||'');
    try{window.location.href=`market://search?q=${q}&c=apps`}catch(e){}
  };
  const topBar=(
    React.createElement(DetailTopBar, {
      app: app,
      isFav: isF,
      onToggleFav: ()=>{if(app)toggle(app)},
      onShare: ()=>setShareOpen(true),
      onOpenIn: openInOtherStore,
      onToggleTheme: onToggleTheme,
      isDark: !!isDark,
      onInfo: ()=>setInfoOpen(true),
      onBack: goBack,}
    )
  );
  if(!app){
    if(failKind==='missing'&&!ld)return React.createElement(React.Fragment, null, topBar, React.createElement('div', { className: "p-8 text-center text-muted-foreground"  ,}, t('app_not_found')));
    if(waited)return React.createElement(React.Fragment, null, topBar, React.createElement('div', { className: "page-stage page-stage-detail" ,}, React.createElement(NetOffline, { onRetry: ()=>setNetTry(n=>n+1),})));
    return React.createElement(React.Fragment, null, topBar, React.createElement('div', { className: "page-stage page-stage-detail" ,}, React.createElement(NetSpin, null)));
  }

  const rating=fmtRating(app.averageUserRating);
  const ratingCount=app.userRatingCount?`(${Number(app.userRatingCount).toLocaleString()})`:'';
  const dist=ratingDistribution(app.averageUserRating);
  const filledStars=Math.round(Number(app.averageUserRating)||4.3);
  const starsStr=Array.from({length:5},(_,i)=>i<filledStars?'★':'☆').join('');
  const storeCfg=STORE_CONFIGS[selStore]||STORE_CONFIGS.google;
  let installHref='#';
  try{installHref=storeCfg.buildUrl(app.trackName||'',app)}catch(e){installHref=app.trackViewUrl||'#'}
  const shareUrl=app.trackViewUrl||(typeof location!=='undefined'?location.href:'');
  const beginInstall=(force)=>{
    if(!app)return;
    dlCancelRef.current=false;
    if(dlTimerRef.current){clearTimeout(dlTimerRef.current);dlTimerRef.current=null}
    const useDirect=storeCfg.kind==='direct'||selStore==='direct';
    const {rec,fresh}=startDlRec(app.trackId,app.fileSizeBytes,{
      trackName:app.trackName||'',
      artworkUrl100:app.artworkUrl512||app.artworkUrl100||'',
      installHref:useDirect?'':installHref,
    },!!force);
    setDlView(computeDlProgress(rec));
    if(!fresh)return;
    linkFiredRef.current=false;
    shouldLaunchRef.current=true;
  };

  const doShareAction=type=>{
    if(type==='copy'){
      (navigator.clipboard?navigator.clipboard.writeText(shareUrl):Promise.reject()).then(()=>showToast(t('toast_copied'))).catch(()=>showToast(t('toast_copied')));
    }else if(type==='whatsapp'){
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((app.trackName||'')+'\n'+shareUrl)}`,'_blank');
    }else if(type==='telegram'){
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(app.trackName||'')}`,'_blank');
    }else if(type==='facebook'){
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,'_blank');
    }else if(type==='instagram'){
      if(navigator.clipboard)navigator.clipboard.writeText(shareUrl).catch(()=>{});
      window.open('https://www.instagram.com/','_blank');
      showToast(t('toast_ig'));
    }else if(type==='github'){
      window.open('https://github.com/','_blank');
    }else if(type==='bluetooth'){
      showToast(t('toast_bt'));
    }else if(type==='quickshare'){
      showToast(t('toast_qs'));
    }
    setShareOpen(false);
  };

  const peekInfo=(
    React.createElement('div', { className: `peek-meta ${peekHide?'gone':''}`,}
      , React.createElement('div', { className: "peek-name",}, app.trackName)
      , React.createElement('button', { type: "button", className: "peek-dev", onClick: ()=>nav(`/search?q=${encodeURIComponent(app.artistName||'')}`),}, app.artistName)
      , React.createElement('div', { className: "peek-line",}, "★ " , rating, " " , ratingCount, " · "  , fmtSize(app.fileSizeBytes), " · "  , app.primaryGenreName||'')
      , React.createElement('button', { type: "button", className: "bg-btn-install peek-install" , onClick: ()=>{setPeek(null); setReqOpen(true)},}, t('install'))
    )
  );
  return(
    React.createElement('div', { className: "pb-24 sm:pb-8" ,}
      , peek&&(
        React.createElement('div', { className: "peek-layer", onClick: ()=>setPeek(null),}
          , React.createElement('button', { type: "button", className: "peek-eye", 'aria-label': "hide", onClick: e=>{e.stopPropagation(); setPeekHide(v=>!v)},}
            , React.createElement('svg', { viewBox: "0 0 24 24"   , width: "22", height: "22", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('path', { d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"           ,}), React.createElement('circle', { cx: "12", cy: "12", r: "3",}), peekHide&&React.createElement('line', { x1: "3", y1: "3", x2: "21", y2: "21",}))
          )
          , React.createElement('button', { type: "button", className: "peek-x", 'aria-label': "close", onClick: e=>{e.stopPropagation(); setPeek(null)},}, "×")
          , React.createElement('div', { className: "peek-stage", onClick: e=>e.stopPropagation(),}
            , React.createElement('img', { className: "peek-img", src: peek, alt: "",})
            , peekInfo
          )
        )
      )
      , topBar
      , React.createElement('div', { className: "bg-detail",}
        , promoShot&&(
          React.createElement('div', { className: "bg-exp-hero", onClick: ()=>openPeek(promoShot), role: "button", tabIndex: 0,}
            , React.createElement('img', { className: "bg-exp-img", src: promoShot, alt: "", loading: "eager",})
            , React.createElement('div', { className: "bg-exp-grad",})
          )
        )
        , React.createElement('div', { className: promoShot?'bg-exp-content':'',}
          , React.createElement('div', { className: "bg-detail-header",}
            , React.createElement('div', { className: "bg-detail-info",}
              , React.createElement('div', { className: "bg-detail-title-row",}
                , React.createElement('h1', { className: "bg-detail-name",}, app.trackName)
              )
              , dlView.ring&&React.createElement('div', { className: `dl-status-badge ${dlView.phase==='spin'?'wait':''}`,}, dlView.phase==='spin'?t('dl_fetch_badge'):t('dl_run_badge'))
              , (dlView.phase==='download'||dlView.phase==='postspin')&&React.createElement('div', { className: "dl-name-pct", 'aria-live': "polite",}, Math.round((dlView.pct||0)*100), "%")
              , React.createElement('button', { className: "bg-detail-dev", onClick: ()=>nav(`/search?q=${encodeURIComponent(app.artistName||'')}`),}, app.artistName)
              , React.createElement('div', { className: "bg-detail-meta",}
                , React.createElement('span', null, "★ " , rating, " " , ratingCount)
                , React.createElement('span', null, app.contentAdvisoryRating||'—')
                , React.createElement('span', null, fmtSize(app.fileSizeBytes))
                , React.createElement('span', null, app.primaryGenreName||'')
              )
            )
            , React.createElement('div', { className: `dl-icon-wrap ${dlView.ring?'active':''}`,}
              , dlView.ring&&(
                React.createElement('svg', { className: "dl-ring", viewBox: "0 0 100 100"   , 'aria-hidden': "true",}
                  , React.createElement('circle', { className: "dl-ring-track", cx: "50", cy: "50", r: "45",})
                  , dlView.phase==='spin'?(
                    React.createElement('g', { className: "dl-spin-g",}
                      , React.createElement('circle', { className: "dl-ring-spin", cx: "50", cy: "50", r: "45",})
                    )
                  ):(
                    React.createElement('circle', {
                      className: "dl-ring-prog",
                      cx: "50", cy: "50", r: "45",
                      transform: "rotate(-90 50 50)"  ,
                      style: {strokeDasharray:String(DL_CIRC),strokeDashoffset:String(DL_CIRC*(1-(dlView.pct||0)))},}
)
                  )
                )
              )
              , React.createElement('img', {
                src: app.artworkUrl512||app.artworkUrl100,
                alt: "",
                className: `bg-detail-icon ${dlView.ring?'dl-shrunk':''}`,
                onClick: ()=>openPeek(app.artworkUrl512||app.artworkUrl100),
                style: {cursor:'pointer'},}
              )
            )
          )

          , React.createElement('div', { className: "bg-detail-actions",}
            , dlView.active?(
              React.createElement('div', { className: "flex gap-2 w-full"  ,}
                , React.createElement('input', { type: "file", ref: fileInputRef, style: {display:'none'}, accept: "*/*", onChange: ()=>{},} )
                , dlView.phase==='done'?(
                  React.createElement('button', { type: "button", className: "bg-btn-cancel", onClick: openFilesPicker,}, t('req_open_files'))
                ):(
                  React.createElement('button', { type: "button", className: "bg-btn-cancel", onClick: cancelInstall,}, t('req_cancel'))
                )
                , React.createElement('button', { type: "button", className: "bg-btn-store", onClick: ()=>beginInstall(true),}, t('reinstall'))
              )
            ):(
              React.createElement('button', { type: "button", className: "bg-btn-install", onClick: ()=>setReqOpen(true),}, t('install'))
            )
          )
        )

        , React.createElement('div', { className: `bg-req-overlay ${reqOpen?'show':''}`, onClick: e=>{if(e.target===e.currentTarget)setReqOpen(false)},}
          , React.createElement('div', { className: "bg-req-sheet", onClick: e=>e.stopPropagation(),}
            , React.createElement('div', { className: "bg-plat-handle",})
            , React.createElement('div', { className: "bg-plat-title",}, t('req_title'))
            , React.createElement('div', { className: "bg-req-body",}
              , [
                {k:'req_money',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('circle', { cx: "12", cy: "12", r: "10",}), React.createElement('path', { d: "M12 6v12M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2"              ,}))
                )},
                {k:'req_wifi',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('path', { d: "M5 12.55a11 11 0 0114.08 0"     ,}), React.createElement('path', { d: "M1.42 9a16 16 0 0121.16 0"     ,}), React.createElement('path', { d: "M8.53 16.11a6 6 0 016.95 0"     ,}), React.createElement('circle', { cx: "12", cy: "20", r: "1.2", fill: "currentColor", stroke: "none",}))
                )},
                {k:'req_storage',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('ellipse', { cx: "12", cy: "5", rx: "9", ry: "3",}), React.createElement('path', { d: "M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"       ,}), React.createElement('path', { d: "M3 12c0 1.7 4 3 9 3s9-1.3 9-3"       ,}))
                )},
                {k:'req_notify',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('path', { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"        ,}), React.createElement('path', { d: "M13.73 21a2 2 0 01-3.46 0"     ,}))
                )},
                {k:'req_vibrate',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('rect', { x: "7", y: "2", width: "10", height: "20", rx: "2",}), React.createElement('path', { d: "M1 9l2 2-2 2M23 9l-2 2 2 2"       ,}))
                )},
                {k:'req_system',icon:(
                  React.createElement('svg', { viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",}, React.createElement('circle', { cx: "12", cy: "12", r: "3",}), React.createElement('path', { d: "M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"          ,}))
                )},
              ].map(it=>(
                React.createElement('div', { className: "bg-req-item", key: it.k,}
                  , React.createElement('div', { className: "bg-req-icon",}, it.icon)
                  , React.createElement('div', { className: "bg-req-text",}, t(it.k))
                )
              ))
              , React.createElement('p', { className: "bg-req-note",}, t('req_note'))
            )
            , React.createElement('div', { className: "bg-req-footer",}
              , React.createElement('button', {
                type: "button",
                className: "bg-btn-confirm",
                onClick: ()=>{
                  setReqOpen(false);
                  beginInstall(false);
                },}
, t('req_confirm'))
            )
          )
        )

        /* ===== Original APKDroid specs bar — left exactly as-is, per request ===== */
        , React.createElement('div', { className: "flex items-center overflow-x-auto px-4 py-3 border-y border-[hsl(var(--border))] gap-8 mt-4"        ,}
          , React.createElement('div', { className: "flex flex-col items-center shrink-0"   ,}
            , React.createElement('span', { className: "text-xs text-muted-foreground uppercase font-semibold mb-1"    ,}, app.userRatingCount>0?`${(app.userRatingCount/1000).toFixed(1)}K RATINGS`:'RATINGS')
            , React.createElement('span', { className: "text-[22px] font-bold text-muted-foreground"  ,}, _optionalChain([app, 'access', _21 => _21.averageUserRating, 'optionalAccess', _22 => _22.toFixed, 'call', _23 => _23(1)])||'N/A')
            , React.createElement(Stars, { r: app.averageUserRating||0, s: "w-3 h-3" ,})
          )
          , React.createElement('div', { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0"   ,})
          , React.createElement('div', { className: "flex flex-col items-center shrink-0"   ,}
            , React.createElement('span', { className: "text-xs text-muted-foreground uppercase font-semibold mb-1"    ,}, "AGE")
            , React.createElement('span', { className: "text-[22px] font-bold text-muted-foreground"  ,}, app.contentAdvisoryRating||'—')
            , React.createElement('span', { className: "text-xs text-muted-foreground mt-1"  ,}, t('years_old'))
          )
          , React.createElement('div', { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0"   ,})
          , React.createElement('div', { className: "flex flex-col items-center shrink-0"   ,}
            , React.createElement('span', { className: "text-xs text-muted-foreground uppercase font-semibold mb-1"    ,}, "CHART")
            , React.createElement('span', { className: "text-[22px] font-bold text-muted-foreground"  ,}, "#1")
            , React.createElement('span', { className: "text-xs text-muted-foreground mt-1"  ,}, app.primaryGenreName)
          )
          , React.createElement('div', { className: "w-px h-10 bg-[hsl(var(--border))] shrink-0"   ,})
          , React.createElement('div', { className: "flex flex-col items-center shrink-0"   ,}
            , React.createElement('span', { className: "text-xs text-muted-foreground uppercase font-semibold mb-1"    ,}, "DEVELOPER")
            , React.createElement('span', { className: "text-[22px] font-bold text-muted-foreground w-12 h-7 bg-[hsl(var(--muted))] rounded flex items-center justify-center"         ,}, (app.artistName||'?').charAt(0))
            , React.createElement('span', { className: "text-[10px] text-muted-foreground mt-1 truncate max-w-[80px]"    ,}, app.artistName)
          )
        )
        /* ===== end unchanged specs bar ===== */

        , shots.length>0&&(
          React.createElement('div', { className: "bg-screenshots",}
            , shots.slice(0,12).map((s,i)=>React.createElement('img', { key: i, src: s, className: "bg-screenshot", alt: "", loading: "lazy", onClick: ()=>openLb(i),}))
          )
        )

        , React.createElement('div', { className: "bg-detail-section",}
          , React.createElement('h3', null, t('description'))
          , React.createElement('p', { className: `bg-description ${exp?'':'collapsed'}`,}, app.description)
          , app.description&&app.description.length>180&&(
            React.createElement('button', { className: "bg-read-more", onClick: ()=>setExp(!exp),}, exp?t('less'):t('more'))
          )
        )

        , React.createElement('div', { className: "bg-detail-section",}
          , React.createElement('h3', null, t('ratings_reviews'))
          , React.createElement('div', { className: "bg-rating-overview",}
            , React.createElement('div', { className: "bg-rating-bars",}
              , [5,4,3,2,1].map(s=>(
                React.createElement('div', { key: s, className: "bg-rating-bar-row",}
                  , React.createElement('span', { className: "bg-rating-bar-star",}, s)
                  , React.createElement('div', { className: "bg-rating-bar-track",}, React.createElement('div', { className: "bg-rating-bar-fill", style: {width:`${dist[s]}%`},}))
                  , React.createElement('span', { className: "bg-rating-bar-percent",}, dist[s], "%")
                )
              ))
            )
            , React.createElement('div', { className: "bg-rating-score-big",}
              , React.createElement('div', { className: "bg-rating-score-num",}, rating)
              , React.createElement('div', { className: "bg-rating-score-stars",}, starsStr)
              , app.userRatingCount?React.createElement('div', { className: "bg-rating-score-count",}, app.userRatingCount.toLocaleString(), " " , t('ratings_count')):null
            )
          )
        )

        , React.createElement('div', { className: "bg-detail-section",}
          , React.createElement('h3', null, t('comments'))
          , revLd?React.createElement('div', { className: "bg-reviews-loading",}, t('loading_reviews')):
            (!reviews||reviews.length===0)?React.createElement('div', { className: "bg-reviews-empty",}, t('no_reviews')):
            React.createElement('div', null
              , reviews.slice(0,revAll?reviews.length:5).map((r,i)=>{
                const rr=Math.max(0,Math.min(5,Number(r.rating)||0));
                const st=Array.from({length:5},(_,i2)=>i2<rr?'★':'☆').join('');
                const initial=(r.author||'A').trim().charAt(0).toUpperCase();
                return(
                  React.createElement('div', { className: "bg-review-card", key: r.id||i,}
                    , React.createElement('div', { className: "bg-review-head",}
                      , React.createElement('div', { className: "bg-review-avatar",}, initial)
                      , React.createElement('div', null
                        , React.createElement('div', { className: "bg-review-user-name",}, r.author)
                        , r.updated&&React.createElement('div', { className: "bg-review-date",}, fmtDate(r.updated))
                      )
                      , React.createElement('div', { className: "bg-review-stars",}, st)
                    )
                    , r.title&&React.createElement('div', { className: "bg-review-title",}, r.title)
                    , React.createElement('div', { className: "bg-review-content",}, r.content)
                  )
                );
              })
            )
          
          , reviews&&reviews.length>0&&(
            React.createElement('div', { className: "bg-reviews-more-wrap",}
              , React.createElement('button', { className: "rounded-full px-6 py-2 text-sm font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"       , disabled: revAllLd, onClick: ()=>revAll?setRevAll(false):loadAllReviews(),}
                , revAllLd?t('loading'):(revAll?t('hide_reviews'):t('show_more'))
              )
            )
          )
        )

        , React.createElement('div', { className: "bg-detail-section",}
          , React.createElement('h3', null, t('info'))
          , React.createElement('div', { className: "bg-info-list",}
            , React.createElement('span', null, React.createElement('b', null, t('version'), ":"), " " , app.version||'—')
            , React.createElement('span', null, React.createElement('b', null, t('last_update'), ":"), " " , fmtDate(app.currentVersionReleaseDate))
            , React.createElement('span', null, React.createElement('b', null, t('size'), ":"), " " , fmtSize(app.fileSizeBytes))
            , React.createElement('span', null, React.createElement('b', null, t('age_rating'), ":"), " " , app.contentAdvisoryRating||'—')
            , React.createElement('span', null, React.createElement('b', null, t('developer'), ":"), " " , app.sellerName||app.artistName)
            , React.createElement('span', null, React.createElement('b', null, t('category'), ":"), " " , app.primaryGenreName||(app.genres||[]).join(', '))
          )
        )
      )

      , sim.length>0&&React.createElement(HScroll, { title: t('you_might_like'),}, sim.map(a=>React.createElement(AppCard, { key: a.trackId, app: a, small: true, onClick: x=>nav(`/app/${x.trackId}`),})))

      , React.createElement('div', { className: `bg-share-overlay ${shareOpen?'show':''}`, onClick: e=>{if(e.target===e.currentTarget)setShareOpen(false)},}
        , React.createElement('div', { className: "bg-share-sheet",}
          , React.createElement('div', { className: "bg-share-handle",})
          , React.createElement('div', { className: "bg-share-title",}, t('share_via'))
          , [
            {id:'copy',k:'share_copy',cls:'copy',icon:'copy'},
            {id:'whatsapp',k:'share_wa',cls:'whatsapp',icon:'whatsapp'},
            {id:'telegram',k:'share_tg',cls:'telegram',icon:'telegram'},
            {id:'instagram',k:'share_ig',cls:'instagram',icon:'instagram'},
            {id:'facebook',k:'share_fb',cls:'facebook',icon:'facebook'},
            {id:'github',k:'share_gh',cls:'github',icon:'github'},
          ].map(opt=>(
            React.createElement('div', { className: "bg-share-option", key: opt.id, onClick: ()=>doShareAction(opt.id),}
              , React.createElement('div', { className: `bg-share-option-icon ${opt.cls}`,}, React.createElement(BrandIcon, { name: opt.icon,}))
              , React.createElement('div', { className: "bg-share-option-label",}, t(opt.k))
            )
          ))
        )
      )

      , infoOpen&&React.createElement(AppInfoSheet, { app: app, onClose: ()=>setInfoOpen(false),})

      , lbIdx!=null&&shots[lbIdx]&&(
        React.createElement('div', { className: "bg-lightbox", onClick: closeLb, onTouchStart: onLbTouchStart, onTouchEnd: onLbTouchEnd,}
          , React.createElement('button', { className: "bg-lightbox-close", onClick: e=>{e.stopPropagation();closeLb()}, 'aria-label': "Close",}, "×")
          , shots.length>1&&React.createElement(React.Fragment, null
            , React.createElement('button', { className: "bg-lightbox-nav prev" , onClick: e=>{e.stopPropagation();lbPrev()}, 'aria-label': "Previous",}, "‹")
            , React.createElement('button', { className: "bg-lightbox-nav next" , onClick: e=>{e.stopPropagation();lbNext()}, 'aria-label': "Next",}, "›")
          )
          , React.createElement('img', { className: "bg-lightbox-img", src: shots[lbIdx], alt: "", onClick: e=>e.stopPropagation(), draggable: false,})
          , React.createElement('div', { className: "bg-lightbox-counter",}, lbIdx+1, " / "  , shots.length)
        )
      )

      , toastMsg&&React.createElement('div', { className: "bg-toast show" ,}, toastMsg)
    )
  );
};

const DownloadsManager=({open})=>{
  const[tab,setTab]=useState('active'); // active | done
  const[tick,setTick]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setTick(x=>x+1),500);
    return()=>clearInterval(t);
  },[]);
  const all=listAllDownloads();
  const rows=all.map(rec=>{
    const p=computeDlProgress(rec);
    return{rec,p};
  });
  const active=rows.filter(x=>x.p.active&&x.p.phase!=='done');
  const done=rows.filter(x=>x.p.phase==='done');
  const list=tab==='active'?active:done;
  return(
    React.createElement('div', { className: "page-cover play-wrap flex flex-col"   ,}
      , React.createElement('div', { className: "sticky top-0 z-30"  , style: {background:'transparent'},}
        , React.createElement('div', { className: "flex items-center gap-2 px-3 pt-3 pb-2"     ,}
          , React.createElement('button', { type: "button", className: "nav-chip", onClick: ()=>window.history.back(), 'aria-label': t('back'),}
            , React.createElement(Icon, { name: "left", className: "w-5 h-5" ,})
          )
          , React.createElement('h1', { className: "font-bold text-base flex-1 truncate"   ,}, t('dl_manager'))
        )
        , React.createElement('div', { className: "play-seg-row",}
          , React.createElement('button', { type: "button", onClick: ()=>setTab('active'), className: `play-seg ${tab==='active'?'on':''}`,}, t('dl_active'), " (" , active.length, ")")
          , React.createElement('button', { type: "button", onClick: ()=>setTab('done'), className: `play-seg ${tab==='done'?'on':''}`,}, t('dl_done'), " (" , done.length, ")")
        )
      )
      , React.createElement('div', { className: "flex-1 py-2 pb-24"  ,}
        , list.length===0?(
          React.createElement('div', { className: "play-list",}, React.createElement('div', { className: "text-center py-16 text-muted-foreground text-sm"   ,}, tab==='active'?t('dl_empty_active'):t('dl_empty_done')))
        ):React.createElement('div', { className: "play-list",}, list.map(({rec,p})=>{
          const pct=Math.round((p.pct||0)*100);
          return(
            React.createElement('div', { key: String(rec.trackId)+'-'+rec.startMs, className: "flex items-center gap-3 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"       ,}
              , React.createElement('img', { src: rec.artworkUrl100||'', alt: "", className: "w-14 h-14 rounded-xl object-cover bg-muted shrink-0"     , onError: e=>{e.target.style.opacity='0.3'},})
              , React.createElement('div', { className: "flex-1 min-w-0" ,}
                , React.createElement('p', { className: "font-semibold text-sm truncate"  ,}, rec.trackName||rec.trackId)
                , React.createElement('p', { className: "text-xs text-muted-foreground mt-0.5"  ,}
                  , (p.phase==='spin'||p.phase==='postspin')?t('dl_spinning'):p.phase==='done'?t('dl_complete'):`${t('dl_progress')}: ${pct}%`
                )
                , p.phase==='download'&&(
                  React.createElement('div', { className: "mt-2 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden"    ,}
                    , React.createElement('div', { className: "h-full rounded-full bg-primary"  , style: {width:pct+'%'},})
                  )
                )
                , (p.phase==='spin'||p.phase==='postspin')&&(
                  React.createElement('div', { className: "mt-2 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden"    ,}
                    , React.createElement('div', { className: "h-full w-1/3 rounded-full bg-[#3b82f6] animate-pulse"    ,})
                  )
                )
              )
              , React.createElement('div', { className: "flex flex-col gap-1 shrink-0"   ,}
                , p.phase==='done'&&rec.installHref&&(
                  React.createElement('a', { href: rec.installHref, target: "_blank", rel: "noopener", className: "text-xs font-semibold text-primary px-2 py-1"    ,}, t('install'))
                )
                , React.createElement('button', { type: "button", className: "text-xs text-muted-foreground px-2 py-1"   , onClick: ()=>{clearDlRec(rec.trackId);setTick(x=>x+1)},}, t('req_cancel'))
              )
            )
          );
        }))
      )
    )
  );
};

const Favs=({favs,songFavs,open,toggle,toggleSongFav,play})=>{
  const[sel,setSel]=useState({});
  const[mode,setMode]=useState(false);
  const[archives,setArchives]=useState(()=>getS('apk_archives',[])||[]);
  const[openArch,setOpenArch]=useState(null);
  const holdRef=useRef(null);
  const heldRef=useRef(false);
  const apps=Array.isArray(favs)?favs:[];
  const songs=Array.isArray(songFavs)?songFavs:[];
  const saveArch=list=>{setArchives(list);setS('apk_archives',list)};
  const allKeys=[...archives.map(ar=>'r:'+String(ar.id)),...apps.map(a=>'a:'+String(a.trackId)),...songs.map(s=>'s:'+String(s.trackId))];
  const selectedKeys=allKeys.filter(k=>sel[k]);
  const allSelected=allKeys.length>0&&selectedKeys.length===allKeys.length;
  const toggleSel=k=>setSel(p=>({...p,[k]:!p[k]}));
  const enterSel=k=>{heldRef.current=true;setMode(true);setSel(p=>({...p,[k]:true}))};
  const startHold=k=>e=>{
    if(mode)return;
    const ev=e.touches?e.touches[0]:e;
    holdRef.current=setTimeout(()=>enterSel(k),420);
  };
  const endHold=()=>{if(holdRef.current){clearTimeout(holdRef.current);holdRef.current=null}};
  const selectAll=()=>{
    if(allSelected){setSel({});setMode(false);return}
    const n={};allKeys.forEach(k=>n[k]=true);setSel(n);setMode(true);
  };
  const removeSelected=()=>{
    if(!selectedKeys.length)return;
    if(!window.confirm(t('delete_confirm')))return;
    const dropArch=new Set(selectedKeys.filter(k=>k[0]==='r').map(k=>k.slice(2)));
    if(dropArch.size)saveArch(archives.filter(a=>!dropArch.has(String(a.id))));
    selectedKeys.forEach(k=>{
      const id=k.slice(2);
      if(k[0]==='a'){const app=apps.find(x=>String(x.trackId)===id);if(app)toggle(app)}
      else if(k[0]==='s'){const song=songs.find(x=>String(x.trackId)===id);if(song)toggleSongFav(song)}
    });
    setSel({});setMode(false);
  };
  const archiveSelected=()=>{
    if(!selectedKeys.length)return;
    const items=[];
    selectedKeys.forEach(k=>{
      const id=k.slice(2);
      if(k[0]==='a'){const app=apps.find(x=>String(x.trackId)===id);if(app)items.push({kind:'app',data:app})}
      else if(k[0]==='s'){const song=songs.find(x=>String(x.trackId)===id);if(song)items.push({kind:'song',data:song})}
    });
    if(!items.length)return;
    const rec={id:'ar'+Date.now(),name:t('archive_one')+' '+(archives.length+1),pinned:false,created:Date.now(),items};
    saveArch([rec].concat(archives));
    selectedKeys.forEach(k=>{
      const id=k.slice(2);
      if(k[0]==='a'){const app=apps.find(x=>String(x.trackId)===id);if(app)toggle(app)}
      else if(k[0]==='s'){const song=songs.find(x=>String(x.trackId)===id);if(song)toggleSongFav(song)}
    });
    setSel({});setMode(false);
  };
  const pinArch=id=>{
    saveArch(archives.map(a=>a.id===id?{...a,pinned:!a.pinned}:a).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)));
  };
  const delArch=id=>{
    if(!window.confirm(t('delete_confirm')))return;
    saveArch(archives.filter(a=>a.id!==id));
    if(openArch&&openArch.id===id)setOpenArch(null);
  };
  const empty=apps.length===0&&songs.length===0&&archives.length===0;
  const Box=({selected,onOpen,onHoldKey,children})=>{
    const tap=()=>{if(heldRef.current){heldRef.current=false;return}if(mode)toggleSel(onHoldKey);else onOpen&&onOpen()};
    return(
      React.createElement('div', { className: "settings-box", style: {marginBottom:10,display:'flex',alignItems:'center',gap:12,position:'relative',outline:selected?'2px solid hsl(var(--primary))':'none'},
        onMouseDown: startHold(onHoldKey), onMouseUp: endHold, onMouseLeave: endHold,
        onTouchStart: startHold(onHoldKey), onTouchEnd: endHold, onTouchMove: endHold,
        onClick: tap,}
        , children
        , selected&&React.createElement('span', { style: {width:22,height:22,borderRadius:'50%',background:'hsl(var(--primary))',color:'hsl(var(--primary-fg))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0},}, "✓")
      )
    );
  };
  if(openArch){
    const rec=archives.find(a=>a.id===openArch.id)||openArch;
    return(
      React.createElement('div', { className: "lib-wrap",}
        , React.createElement('div', { className: "flex items-center gap-2 px-3 pt-3 pb-2"     ,}
          , React.createElement('button', { type: "button", className: "nav-chip", onClick: ()=>setOpenArch(null), 'aria-label': t('back'),}, React.createElement(Icon, { name: "left", className: "w-5 h-5" ,}))
          , React.createElement('h1', { className: "text-xl font-bold flex-1 truncate"   ,}, rec.name||t('archives'))
          , React.createElement('button', { type: "button", className: "text-xs font-semibold px-3 py-1.5 rounded-full"    , style: {background:'hsl(var(--card))',color:'hsl(var(--fg))',border:'1px solid hsl(var(--border))'}, onClick: ()=>pinArch(rec.id),}, rec.pinned?t('archive_unpin'):t('archive_pin'))
        )
        , (rec.items||[]).length===0?(
          React.createElement('div', { className: "text-center py-16 text-muted-foreground text-sm"   ,}, t('archive_empty'))
        ):(rec.items||[]).map((it,idx)=>{
          if(it.kind==='song'){
            const s=it.data||{};
            return(
              React.createElement('div', { key: 's'+idx, className: "settings-box", style: {display:'flex',alignItems:'center',gap:12,cursor:'pointer'}, onClick: ()=>play&&play(s,[s]),}
                , React.createElement('img', { src: s.artworkUrl100||s.artworkUrl60||'', alt: "", style: {width:48,height:48,borderRadius:12,objectFit:'cover'},})
                , React.createElement('div', { style: {flex:1,minWidth:0},}
                  , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, s.trackName)
                  , React.createElement('p', { className: "text-xs truncate" , style: {opacity:.7},}, s.artistName)
                )
              )
            );
          }
          const a=it.data||{};
          return(
            React.createElement('div', { key: 'a'+idx, className: "settings-box", style: {display:'flex',alignItems:'center',gap:12,cursor:'pointer'}, onClick: ()=>open&&open(a),}
              , React.createElement('img', { src: a.artworkUrl100||a.artworkUrl60||'', alt: "", style: {width:48,height:48,borderRadius:12,objectFit:'cover'},})
              , React.createElement('div', { style: {flex:1,minWidth:0},}
                , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, a.trackName||a.trackCensoredName)
                , React.createElement('p', { className: "text-xs truncate" , style: {opacity:.7},}, a.artistName)
              )
            )
          );
        })
      )
    );
  }
  const orderedArch=[...archives].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.created||0)-(a.created||0));
  return(
    React.createElement('div', { className: "lib-wrap pb-20" ,}
      , React.createElement('div', { className: "px-4 pt-4 pb-2 flex items-center gap-2"     ,}
        , React.createElement('h1', { className: "text-xl font-bold flex-1"  ,}, t('library'))
      )
      , mode&&(
        React.createElement('div', { className: "play-seg-row",}
          , React.createElement('button', { type: "button", onClick: selectAll, className: `play-seg ${allSelected?'on':''}`,}, allSelected?t('req_cancel'):t('select_all'))
          , React.createElement('button', { type: "button", onClick: removeSelected, disabled: !selectedKeys.length, className: `play-seg ${selectedKeys.length?'on':''}`,}, t('delete_sel'))
          , React.createElement('button', { type: "button", onClick: archiveSelected, disabled: !selectedKeys.length, className: `play-seg ${selectedKeys.length?'on':''}`,}, t('archive'))
        )
      )
      , empty?(
        React.createElement('div', { className: "text-center py-16 text-muted-foreground"  ,}, React.createElement(Icon, { name: "heart", className: "w-12 h-12 mx-auto mb-3 opacity-30"    ,}), React.createElement('p', null, t('no_favs')), React.createElement('p', { className: "text-sm mt-1" ,}, t('no_favs_hint')))
      ):(
        React.createElement(React.Fragment, null
          , orderedArch.map(ar=>{
            const k='r:'+String(ar.id);
            return(
              React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: ()=>setOpenArch(ar),}
                , React.createElement(Icon, { name: "folder", className: "w-6 h-6" ,})
                , React.createElement('div', { style: {flex:1,minWidth:0},}
                  , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, ar.name, ar.pinned?' •':'')
                  , React.createElement('p', { className: "text-xs", style: {opacity:.7},}, (ar.items||[]).length, " • "  , t('archives'))
                )
                , React.createElement('button', { type: "button", onClick: e=>{e.stopPropagation();pinArch(ar.id)}, style: {background:'transparent',border:'none',color:'inherit',cursor:'pointer',fontSize:18}, 'aria-label': t('archive_pin'),}, ar.pinned?'📌':'📍')
              )
            );
          })
          , apps.map(a=>{
            const k='a:'+String(a.trackId);
            return(
              React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: ()=>open&&open(a),}
                , React.createElement('img', { src: a.artworkUrl100||a.artworkUrl60||'', alt: "", style: {width:48,height:48,borderRadius:12,objectFit:'cover',flexShrink:0},})
                , React.createElement('div', { style: {flex:1,minWidth:0},}
                  , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, a.trackName||a.trackCensoredName)
                  , React.createElement('p', { className: "text-xs truncate" , style: {opacity:.7},}, a.artistName)
                )
              )
            );
          })
          , songs.map(s=>{
            const k='s:'+String(s.trackId);
            return(
              React.createElement(Box, { key: k, selected: !!sel[k], onHoldKey: k, onOpen: ()=>play&&play(s,songs),}
                , React.createElement('img', { src: s.artworkUrl100||s.artworkUrl60||'', alt: "", style: {width:48,height:48,borderRadius:12,objectFit:'cover',flexShrink:0},})
                , React.createElement('div', { style: {flex:1,minWidth:0},}
                  , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, s.trackName)
                  , React.createElement('p', { className: "text-xs truncate" , style: {opacity:.7},}, s.artistName)
                )
              )
            );
          })
        )
      )
    )
  );
};

const SearchLogPage=({nav})=>{
  const[items,setItems]=useState(()=>getSearchLog());
  const[sel,setSel]=useState({});
  useEffect(()=>{setItems(getSearchLog())},[]);
  const keys=items.map(x=>x.id);
  const selected=keys.filter(k=>sel[k]);
  const allSelected=keys.length>0&&selected.length===keys.length;
  const selectAll=()=>{if(allSelected){setSel({});return}const n={};keys.forEach(k=>n[k]=true);setSel(n)};
  const delSelected=()=>{
    if(!selected.length)return;
    if(!window.confirm(t('delete_confirm')))return;
    const next=items.filter(x=>!sel[x.id]);
    setItems(next);setS('apk_search_log',next);setS('apk_search_history',next.map(x=>x.term).filter((v,i,a)=>a.indexOf(v)===i).slice(0,20));setSel({});
  };
  const delOne=id=>{
    if(!window.confirm(t('delete_one_confirm')))return;
    const next=items.filter(x=>x.id!==id);
    setItems(next);setS('apk_search_log',next);setS('apk_search_history',next.map(x=>x.term).filter((v,i,a)=>a.indexOf(v)===i).slice(0,20));
    setSel(p=>{const n={...p};delete n[id];return n});
  };
  const openItem=it=>{
    if(it.type==='music')nav('/music?q='+encodeURIComponent(it.term));
    else if(it.type==='games')nav('/search?q='+encodeURIComponent(it.term));
    else nav('/search?q='+encodeURIComponent(it.term));
  };
  const typeLabel=ty=>ty==='music'?t('type_music'):ty==='games'?t('type_games'):t('type_apps');
  const typeColor=ty=>ty==='music'?'#a855f7':ty==='games'?'#ea4335':'#4285f4';
  return(
    React.createElement('div', { className: "page-cover play-wrap" ,}
      , React.createElement('div', { className: "sticky top-0 z-30 px-0 pt-3 pb-1"     ,}
        , React.createElement('div', { className: "flex items-center gap-2 mb-3 px-3"    ,}
          , React.createElement('button', { type: "button", className: "nav-chip", onClick: ()=>window.history.back(), 'aria-label': t('back'),}, React.createElement(Icon, { name: "left", className: "w-5 h-5" ,}))
          , React.createElement('h1', { className: "font-bold text-base flex-1"  ,}, t('search_log'))
          , React.createElement('span', { className: "text-xs text-muted-foreground" ,}, items.length)
        )
        , React.createElement('div', { className: "play-seg-row",}
          , React.createElement('button', { type: "button", onClick: selectAll, className: `play-seg ${allSelected?'on':''}`,}, allSelected?t('req_cancel'):t('select_all'))
          , React.createElement('button', { type: "button", onClick: delSelected, disabled: !selected.length, className: `play-seg ${selected.length?'on':''}`,}, t('delete_sel'), selected.length?` (${selected.length})`:'')
        )
      )
      , React.createElement('div', { className: "py-2",}
        , items.length===0?(
          React.createElement('div', { className: "play-list",}, React.createElement('div', { className: "text-center py-16 text-muted-foreground text-sm"   ,}
            , React.createElement(Icon, { name: "hist", className: "w-12 h-12 mx-auto mb-3 opacity-30"    ,})
            , React.createElement('p', null, t('search_log_empty'))
          ))
        ):React.createElement('div', { className: "play-list",}, items.map(it=>(
          React.createElement('div', { key: it.id, className: "play-item",}
            , React.createElement('button', { type: "button", onClick: ()=>setSel(p=>({...p,[it.id]:!p[it.id]})), className: `w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${sel[it.id]?'bg-primary border-primary text-white':'border-[hsl(var(--border))]'}`,}, sel[it.id]?'✓':'')
            , React.createElement('button', { type: "button", className: "flex-1 min-w-0 text-left flex items-center gap-2"     , onClick: ()=>openItem(it),}
              , React.createElement(Icon, { name: "hist", className: "w-4 h-4 text-muted-foreground shrink-0"   ,})
              , React.createElement('span', { className: "text-sm font-medium truncate flex-1"   ,}, it.term)
              , React.createElement('span', { className: "text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full text-white"      , style: {background:typeColor(it.type)},}, typeLabel(it.type))
            )
            , React.createElement('button', { type: "button", onClick: ()=>delOne(it.id), className: "p-2 text-muted-foreground hover:text-red-500"  , 'aria-label': "delete",}, React.createElement(Icon, { name: "x", className: "w-4 h-4" ,}))
          )
        )))
      )
    )
  );
};

const Music=({play})=>{
  const initQ=(()=>{try{return new URLSearchParams((location.hash.split('?')[1]||'')).get('q')||''}catch (e38){return ''}})();
  const[songs,setSongs]=useState([]);const[q,setQ]=useState(initQ);const[ld,setLd]=useState(true);
  useEffect(()=>{if(initQ){setLd(true);api.songs(initQ).then(setSongs).catch(()=>{}).finally(()=>setLd(false))}else{api.songs().then(setSongs).catch(()=>{}).finally(()=>setLd(false))}},[]);
  useEffect(()=>{
    if(!q.trim())return;
    const timer=setTimeout(()=>{
      setLd(true);
      pushSearchHist(q,'music');
      api.songs(q).then(setSongs).catch(()=>{}).finally(()=>setLd(false));
    },350);
    return()=>clearTimeout(timer);
  },[q]);
  return(
    React.createElement('div', { className: "pb-20 sm:pb-8" ,}
      , React.createElement('div', { className: "px-4 pt-3" ,}, React.createElement('div', { className: "flex items-center gap-2 bg-[hsl(var(--muted))]/60 rounded-full px-4 py-2.5"      ,}, React.createElement(Icon, { name: "search", className: "w-4 h-4 text-muted-foreground"  ,}), React.createElement('input', { value: q, onChange: e=>setQ(e.target.value), placeholder: t('search_songs'), className: "flex-1 bg-transparent outline-none text-sm"   ,})))
      , React.createElement('h2', { className: "font-semibold px-4 mt-5 mb-3"   ,}, q?t('results'):t('top_songs'))
      , ld?React.createElement('div', { className: "px-4 space-y-3" ,}, Array(6).fill(0).map((_,i)=>React.createElement(Skel, { key: i, c: "h-14",}))):
        songs.map(s=>React.createElement('button', { key: s.trackId, onClick: ()=>play(s,songs), className: "flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[hsl(var(--muted))]/50 text-left"       ,}, React.createElement('img', { src: s.artworkUrl100||s.artworkUrl60, className: "w-12 h-12 rounded-lg object-cover"   , alt: "",}), React.createElement('div', { className: "flex-1 min-w-0" ,}, React.createElement('p', { className: "text-sm font-medium truncate"  ,}, s.trackName), React.createElement('p', { className: "text-xs text-muted-foreground truncate"  ,}, s.artistName)), s.previewUrl&&React.createElement(Icon, { name: "play", className: "w-5 h-5 text-primary shrink-0"   ,})))
    )
  );
};


const SettingsSpinner=()=>(
  React.createElement('div', { className: "set-spin-screen", role: "status", 'aria-label': "loading",}
    , React.createElement('svg', { className: "set-spin", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 50 50"   , width: "36", height: "36", 'aria-hidden': "true",}
      , React.createElement('g', { className: "set-spin-rotor",}
        , React.createElement('circle', { className: "set-spin-arc", cx: "25", cy: "25", r: "20", fill: "none", stroke: "#0B57D0", strokeWidth: "4", strokeMiterlimit: "10", strokeLinecap: "round",})
      )
    )
  )
);
const Settings=({selStore,setSelStore,style2,setStyle2,setExpMode,lang,setLang,night,setNight,nav})=>{
  const[apiOpen,setApiOpen]=useState(false);
  const[boot,setBoot]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setBoot(false),1500);return()=>clearTimeout(t)},[]);
  const pickSrc=id=>{const n=normalizeStore(id);setSelStore(n);setS('apk_store',n);setApiOpen(false)};
  if(boot)return React.createElement(SettingsSpinner, null);
  return(
    React.createElement('div', { className: "page-cover play-wrap" ,}
      , React.createElement('div', { className: "flex items-center gap-2 px-3 pt-3 pb-2"     ,}
        , React.createElement('button', { type: "button", className: "nav-chip", onClick: ()=>window.history.back(), 'aria-label': t('back'),}
          , React.createElement(Icon, { name: "left", className: "w-5 h-5" ,})
        )
        , React.createElement('h1', { className: "text-xl font-bold flex-1"  ,}, t('settings_title'))
      )
      , React.createElement('div', { className: "play-seg-row", style: {paddingTop:8},}
        , React.createElement('button', { type: "button", onClick: ()=>setLang('ar'), className: `play-seg ${lang==='ar'?'on':''}`,}, t('lang_ar'))
        , React.createElement('button', { type: "button", onClick: ()=>setLang('en'), className: `play-seg ${lang==='en'?'on':''}`,}, t('lang_en'))
      )
      , React.createElement('button', { type: "button", onClick: ()=>setApiOpen(true), className: "settings-box", style: {width:'calc(100% - 28px)',border:'none',display:'flex',alignItems:'center',gap:12,textAlign:'inherit',fontFamily:'inherit',cursor:'pointer'},}
        , React.createElement('span', { style: {flex:1,minWidth:0},}
          , React.createElement('span', { className: "block text-sm font-semibold"  ,}, "API Search Apps"  )
          , React.createElement('span', { className: "block text-xs mt-0.5"  , style: {opacity:.7},}, t('api_search_app_desc'))
        )
        , React.createElement('span', { className: "text-xs font-bold" ,}, storeLabel(STORE_CONFIGS[selStore]))
      )
      , React.createElement('div', { className: "settings-box", style: {display:'flex',alignItems:'center',gap:12},}
        , React.createElement('div', { className: "min-w-0", style: {flex:1},}
          , React.createElement('p', { className: "text-sm font-medium" ,}, t('style2'))
          , React.createElement('p', { className: "text-xs mt-0.5" , style: {opacity:.7},}, t('style2_desc'))
        )
        , React.createElement('button', { type: "button", className: `eq-switch ${style2?'on':''}`, onClick: ()=>{const n=!style2;setStyle2(n);setExpMode(!n)}, 'aria-label': t('style2'),})
      )
      , React.createElement('button', { type: "button", className: "settings-box", style: {width:'calc(100% - 28px)',border:'none',textAlign:'inherit',fontFamily:'inherit',cursor:'pointer',color:'#eee'}, onClick: ()=>{if(window.confirm(t('reset_confirm')))wipeStore()},}
        , React.createElement('span', { className: "block text-sm font-semibold"  ,}, t('reset_data'))
        , React.createElement('span', { className: "block text-xs mt-0.5"  , style: {opacity:.7},}, t('reset_data_desc'))
      )
      , React.createElement(AccPick, { open: apiOpen, title: "API Search Apps"  , onClose: ()=>setApiOpen(false),}
        , INSTALL_SOURCE_IDS.map(id=>{
          const cfg=STORE_CONFIGS[id];
          const on=selStore===id;
          return(
            React.createElement('button', { key: id, type: "button", className: `acc-pick-item ${on?'on':''}`, onClick: ()=>pickSrc(id),}
              , React.createElement('span', { className: "w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"       ,}, React.createElement(BrandIcon, { name: cfg.icon,}))
              , React.createElement('span', { style: {flex:1,textAlign:'inherit'},}
                , React.createElement('span', { style: {display:'block'},}, storeLabel(cfg))
                , cfg.kind==='direct'&&React.createElement('span', { style: {display:'block',fontSize:'.72rem',opacity:.65,fontWeight:400},}, t('store_direct_hint'))
              )
              , on&&React.createElement('span', null, "✓")
            )
          );
        })
      )
    )
  );
};

const Category=({genre,open})=>{
  const decoded=decodeURIComponent(genre||'');
  const fromSearch=SEARCH_CATEGORIES.find(c=>c.term===decoded||c.k===decoded);
  const fromGames=GAME_SECTIONS.find(c=>c.term===decoded||c.k===decoded);
  const fromGenres=GENRES[decoded];
  const g=fromSearch?{id:fromSearch.gid,term:fromSearch.term,title:t(fromSearch.k)}:fromGames?{id:fromGames.gid,term:fromGames.term,title:t(fromGames.k)}:fromGenres?{id:fromGenres.id,term:fromGenres.term,title:decoded}:{id:6000,term:decoded,title:decoded};
  const[apps,setApps]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{setLd(true);api.cat(g.term,g.id,40).then(setApps).catch(()=>setApps([])).finally(()=>setLd(false))},[genre]);
  return React.createElement('div', { className: "pb-20 sm:pb-8 px-2 pt-4"   ,}, React.createElement('h1', { className: "text-xl font-bold px-2 mb-4 capitalize"    ,}, g.title||decoded), ld?Array(8).fill(0).map((_,i)=>React.createElement(Skel, { key: i, c: "h-16 m-2" ,})):apps.map(a=>React.createElement(AppCard, { key: a.trackId, app: a, onClick: open,})));
};

const EQ_FREQS=[31,63,125,250,500,1000,2000,4000,8000,16000];
const EQ_LABELS=['31','63','125','250','500','1K','2K','4K','8K','16K'];
const fmtTime=s=>{if(!s||!isFinite(s))return '0:00';const m=Math.floor(s/60);const sec=Math.floor(s%60);return m+':'+String(sec).padStart(2,'0')};

const MiniPlayer=({track,playing,progress,duration,onToggle,onClose,onPrev,onNext,onSeek,onOpen,isFav,onFav})=>{
  if(!track)return null;
  const pct=duration>0?(progress/duration)*100:0;
  return(
    React.createElement('div', { className: "app-mini bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shadow-lg"    ,}
      , React.createElement('div', { className: "mp-progress", onClick: e=>{const r=e.currentTarget.getBoundingClientRect();const ratio=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));onSeek&&onSeek(ratio*duration)},}
        , React.createElement('div', { className: "mp-progress-fill", style: {width:pct+'%'},})
      )
      , React.createElement('div', { className: "px-3 py-2 flex items-center gap-2"    , onClick: onOpen, style: {cursor:'pointer'},}
        , React.createElement('img', { src: track.artworkUrl60||track.artworkUrl100, className: "w-10 h-10 rounded-full object-cover"   , alt: "",})
        , React.createElement('div', { className: "flex-1 min-w-0" ,}
          , React.createElement('p', { className: "text-sm font-medium truncate"  ,}, track.trackName)
          , React.createElement('p', { className: "text-xs text-muted-foreground truncate"  ,}, track.artistName)
        )
        , React.createElement('button', { onClick: e=>{e.stopPropagation();onFav&&onFav(track)}, className: `p-1.5 ${isFav?'text-red-500':'text-muted-foreground'}`,}, React.createElement(Icon, { name: "heart", className: `w-5 h-5 ${isFav?'fill-current':''}`,}))
        , React.createElement('button', { onClick: e=>{e.stopPropagation();onPrev&&onPrev()}, className: "p-1.5 text-muted-foreground" ,}, React.createElement(Icon, { name: "prev", className: "w-5 h-5" ,}))
        , React.createElement('button', { onClick: e=>{e.stopPropagation();onToggle()}, className: "p-1.5 text-primary" ,}, React.createElement(Icon, { name: playing?'pause':'play', className: "w-6 h-6" ,}))
        , React.createElement('button', { onClick: e=>{e.stopPropagation();onNext&&onNext()}, className: "p-1.5 text-muted-foreground" ,}, React.createElement(Icon, { name: "next", className: "w-5 h-5" ,}))
        , React.createElement('button', { onClick: e=>{e.stopPropagation();onClose()}, className: "p-1.5 text-muted-foreground" ,}, React.createElement(Icon, { name: "x", className: "w-5 h-5" ,}))
      )
    )
  );
};

const NowPlaying=({track,playing,progress,duration,onToggle,onPrev,onNext,onSeek,onFav,isFav,nav})=>{
  if(!track)return React.createElement('div', { className: "p-8 text-center text-muted-foreground"  ,}, t('app_not_found'));
  const pct=duration>0?(progress/duration)*100:0;
  const dl=()=>{if(!track.previewUrl)return;const a=document.createElement('a');a.href=track.previewUrl;a.download=(track.trackName||'song')+'.m4a';a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()};
  return(
    React.createElement('div', { className: "pb-28 sm:pb-12 px-4 pt-4 max-w-md mx-auto flex flex-col items-center"        ,}
      , React.createElement('button', { className: "bg-detail-back-btn self-start" , onClick: ()=>window.history.back(),}, React.createElement(Icon, { name: "left", className: "w-4 h-4" ,}), " " , t('back'))
      , React.createElement('p', { className: "text-xs text-muted-foreground uppercase tracking-wider mb-6"    ,}, t('now_playing'))
      , React.createElement('div', { className: "relative mb-8" ,}
        , React.createElement('img', { src: track.artworkUrl100||track.artworkUrl60, className: `mp-disc spin ${playing?'':'paused'}`, alt: "",})
        , React.createElement('div', { className: "mp-disc-center",})
      )
      , React.createElement('h1', { className: "text-xl font-bold text-center truncate w-full px-2"     ,}, track.trackName)
      , React.createElement('p', { className: "text-sm text-muted-foreground text-center mt-1 mb-6"    ,}, track.artistName)
      , React.createElement('div', { className: "w-full px-2" ,}
        , React.createElement('div', { className: "mp-progress", style: {height:4}, onClick: e=>{const r=e.currentTarget.getBoundingClientRect();const ratio=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));onSeek&&onSeek(ratio*duration)},}
          , React.createElement('div', { className: "mp-progress-fill", style: {width:pct+'%'},})
        )
        , React.createElement('div', { className: "flex justify-between text-xs text-muted-foreground mt-1.5"    ,}, React.createElement('span', null, fmtTime(progress)), React.createElement('span', null, fmtTime(duration)))
      )
      , React.createElement('div', { className: "flex items-center justify-center gap-5 mt-6"    ,}
        , React.createElement('button', { onClick: onPrev, className: "p-2 text-muted-foreground" ,}, React.createElement(Icon, { name: "prev", className: "w-7 h-7" ,}))
        , React.createElement('button', { onClick: onToggle, className: "w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"        ,}, React.createElement(Icon, { name: playing?'pause':'play', className: "w-7 h-7" ,}))
        , React.createElement('button', { onClick: onNext, className: "p-2 text-muted-foreground" ,}, React.createElement(Icon, { name: "next", className: "w-7 h-7" ,}))
      )
      , React.createElement('div', { className: "flex items-center justify-center gap-4 mt-8 w-full"     ,}
        , React.createElement('button', { onClick: dl, className: "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"         ,}
          , React.createElement(Icon, { name: "download", className: "w-5 h-5" ,}), React.createElement('span', { className: "text-xs font-medium" ,}, t('download_song'))
        )
        , React.createElement('button', { onClick: ()=>nav('/equalizer'), className: "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"         ,}
          , React.createElement(Icon, { name: "eq", className: "w-5 h-5" ,}), React.createElement('span', { className: "text-xs font-medium" ,}, t('equalizer'))
        )
        , React.createElement('button', { onClick: ()=>onFav&&onFav(track), className: `flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${isFav?'text-red-500':''}`,}
          , React.createElement(Icon, { name: "heart", className: `w-5 h-5 ${isFav?'fill-current':''}`,}), React.createElement('span', { className: "text-xs font-medium" ,}, t('favorites'))
        )
      )
    )
  );
};

const EqualizerPage=({eqOn,setEqOn,bands,setBand,volume,setVolume,nav})=>{
  return(
    React.createElement('div', { className: "pb-28 sm:pb-12 px-4 pt-4 max-w-lg mx-auto"     ,}
      , React.createElement('button', { className: "bg-detail-back-btn", onClick: ()=>window.history.back(),}, React.createElement(Icon, { name: "left", className: "w-4 h-4" ,}), " " , t('back'))
      , React.createElement('div', { className: "flex items-center justify-between mt-2 mb-6"    ,}
        , React.createElement('h1', { className: "text-xl font-bold" ,}, t('eq_title'))
        , React.createElement('div', { className: "flex items-center gap-2"  ,}
          , React.createElement('span', { className: "text-xs text-muted-foreground" ,}, eqOn?t('eq_on'):t('eq_off'))
          , React.createElement('button', { type: "button", className: `eq-switch ${eqOn?'on':''}`, onClick: ()=>setEqOn(!eqOn), 'aria-label': "Toggle EQ" ,})
        )
      )
      , React.createElement('div', { className: `eq-bands ${eqOn?'':'opacity-40 pointer-events-none'}`,}
        , EQ_LABELS.map((lab,i)=>(
          React.createElement('div', { className: "eq-band", key: lab,}
            , React.createElement('input', { type: "range", min: "-12", max: "12", step: "1", value: bands[i], disabled: !eqOn,
              onChange: e=>setBand(i,Number(e.target.value)),})
            , React.createElement('span', null, lab)
          )
        ))
      )
      , React.createElement('div', { className: "mt-8 px-2" ,}
        , React.createElement('label', { className: "text-sm font-medium text-muted-foreground"  ,}, t('master_volume'))
        , React.createElement('input', { className: "eq-vol mt-3 w-full"  , type: "range", min: "0", max: "1", step: "0.01", value: volume, onChange: e=>setVolume(Number(e.target.value)),})
        , React.createElement('div', { className: "text-xs text-muted-foreground text-right mt-1"   ,}, Math.round(volume*100), "%")
      )
    )
  );
};

const PlatformSheet=({open,onClose,selStore,setSelStore})=>{
  const[step,setStep]=useState('platform'); // platform | stores
  const[plat,setPlat]=useState('android');
  useEffect(()=>{if(open){setStep('platform');const cfg=STORE_CONFIGS[selStore];if(cfg)setPlat(cfg.platform||'android')}},[open]);
  const pickPlatform=p=>{
    setPlat(p);
    const stores=PLATFORM_STORES[p]||[];
    if(stores.length===1){
      setSelStore(stores[0]);setS('apk_store',stores[0]);onClose();
    }else{
      setStep('stores');
    }
  };
  const pickStore=id=>{setSelStore(id);setS('apk_store',id);onClose()};
  if(!open)return null;
  return(
    React.createElement('div', { className: `bg-plat-overlay ${open?'show':''}`, onClick: e=>{if(e.target===e.currentTarget)onClose()},}
      , React.createElement('div', { className: "bg-plat-sheet", onClick: e=>e.stopPropagation(),}
        , React.createElement('div', { className: "bg-plat-handle",})
        , step==='platform'?(
          React.createElement(React.Fragment, null
            , React.createElement('div', { className: "bg-plat-title",}, t('choose_platform'))
            , [
              {id:'android',label:t('platform_android'),icon:'phone'},
              {id:'ios',label:t('platform_ios'),icon:'phone'},
              {id:'windows',label:t('platform_windows'),icon:'phone'},
            ].map(p=>(
              React.createElement('button', { key: p.id, type: "button", className: `bg-plat-item ${plat===p.id?'active':''}`, onClick: ()=>pickPlatform(p.id),}
                , React.createElement(Icon, { name: p.icon, className: "w-6 h-6" ,}), React.createElement('span', null, p.label)
              )
            ))
          )
        ):(
          React.createElement(React.Fragment, null
            , React.createElement('button', { type: "button", className: "bg-plat-back", onClick: ()=>setStep('platform'),}, React.createElement(Icon, { name: "left", className: "w-4 h-4" ,}), " " , t('back_platforms'))
            , React.createElement('div', { className: "bg-plat-title",}, t('choose_store'))
            , (PLATFORM_STORES[plat]||[]).map(id=>{
              const cfg=STORE_CONFIGS[id];
              return(
                React.createElement('button', { key: id, type: "button", className: `bg-plat-item ${selStore===id?'active':''}`, onClick: ()=>pickStore(id),}
                  , React.createElement(BrandIcon, { name: cfg.icon,})
                  , React.createElement('span', { style: {display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2},}
                    , React.createElement('span', null, storeLabel(cfg))
                    , cfg.kind==='direct'&&React.createElement('span', { style: {fontSize:'.72rem',opacity:.65,fontWeight:400},}, t('store_direct_hint'))
                  )
                )
              );
            })
          )
        )
      )
    )
  );
};

const StoreLogo=({size=32})=>(
  React.createElement('img', { className: "store-logo", src: STORE_LOGO_SRC, alt: "", style: {height:size,width:'auto',aspectRatio:'915/1039',objectFit:'contain',flexShrink:0,display:'block'},})
);

const SplashScreen=({onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,1800);return()=>clearTimeout(t)},[onDone]);
  return(
    React.createElement('div', { className: "ob-screen", style: {alignItems:'center',justifyContent:'center'}, onClick: onDone,}
      , React.createElement('div', { style: {display:'flex',alignItems:'center',gap:14},}
        , React.createElement(StoreLogo, { size: 56,})
        , React.createElement('span', { style: {fontSize:28,fontWeight:800,letterSpacing:'-0.03em'},}, "APKDroid Store" )
      )
    )
  );
};

const InstallMock=({promo,blue})=>{
  const accent=blue?'#0B57D0':'#02C57A';
  return(
    React.createElement('div', { style: {background:promo?'#0b0b0c':'#f3f4f6',height:'100%',minHeight:'100%',display:'flex',flexDirection:'column'},}
      , promo?(
        React.createElement('div', { style: {height:92,background:blue?'linear-gradient(180deg,#1a4fa0, #111 90%)':'linear-gradient(180deg,#2a6, #111 90%)',position:'relative'},}
          , React.createElement('div', { style: {position:'absolute',inset:0,background:'linear-gradient(transparent,rgba(0,0,0,.75))'},})
          , React.createElement('div', { style: {position:'absolute',bottom:8,left:8,right:8,display:'flex',alignItems:'flex-end',gap:8},}
            , React.createElement('div', { style: {width:28,height:28,borderRadius:8,background:accent},})
            , React.createElement('div', { style: {flex:1,height:8,borderRadius:4,background:'rgba(255,255,255,.7)'},})
          )
        )
      ):(
        React.createElement('div', { style: {padding:'14px 12px 6px',display:'flex',alignItems:'center',gap:8,background:'#fff'},}
          , React.createElement('div', { style: {width:36,height:36,borderRadius:10,background:accent},})
          , React.createElement('div', { style: {flex:1},}
            , React.createElement('div', { style: {height:8,width:'70%',borderRadius:4,background:'#222',marginBottom:6},})
            , React.createElement('div', { style: {height:6,width:'40%',borderRadius:4,background:'#bbb'},})
          )
        )
      )
      , promo&&(
        React.createElement('div', { style: {padding:'8px 10px 4px',display:'flex',alignItems:'center',gap:8},}
          , React.createElement('div', { style: {width:28,height:28,borderRadius:8,background:accent},})
          , React.createElement('div', { style: {flex:1,height:7,borderRadius:4,background:'#ddd'},})
        )
      )
      , React.createElement('div', { style: {padding:'8px 10px 12px',background:promo?'#111':'#fff'},}
        , React.createElement('div', { style: {height:22,borderRadius:999,background:accent},})
        , React.createElement('div', { style: {marginTop:10,height:6,borderRadius:3,background:promo?'#333':'#e5e5e5'},})
        , React.createElement('div', { style: {marginTop:6,height:6,width:'80%',borderRadius:3,background:promo?'#2a2a2a':'#ececec'},})
      )
    )
  );
};

const ObSvg=({html,className})=> React.createElement('div', { className: className||'ob-logo', dangerouslySetInnerHTML: {__html:html},});

const SVG_SETUP='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" overflow="visible"><style>.obsetup-shadow{transform-box:fill-box;transform-origin:center;animation:obsetupShadow 3.6s ease-in-out infinite}.obsetup-star{transform-box:fill-box;transform-origin:center;animation:obsetupFloatA 3.4s ease-in-out infinite}.obsetup-sparkle{transform-box:fill-box;transform-origin:center;animation:obsetupTwinkle 2.9s ease-in-out infinite;animation-delay:.3s}.obsetup-gallery{transform-box:fill-box;transform-origin:center;animation:obsetupFloatB 3.9s ease-in-out infinite;animation-delay:.45s}.obsetup-ruler{transform-box:fill-box;transform-origin:center;animation:obsetupFloatC 4.3s ease-in-out infinite;animation-delay:.7s}.obsetup-pink{transform-box:fill-box;transform-origin:center;animation:obsetupFloatA 3.7s ease-in-out infinite;animation-delay:.2s}.obsetup-blue{transform-box:fill-box;transform-origin:center;animation:obsetupFloatB 3.1s ease-in-out infinite;animation-delay:.55s}.obsetup-search{transform-box:fill-box;transform-origin:center;animation:obsetupFloatC 3.6s ease-in-out infinite;animation-delay:.4s}@keyframes obsetupFloatA{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-32px) rotate(-14deg) scale(1.12)}}@keyframes obsetupFloatB{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-38px) rotate(14deg) scale(1.15)}}@keyframes obsetupFloatC{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-25px) rotate(-12deg) scale(1.1)}}@keyframes obsetupTwinkle{0%,100%{transform:scale(1) rotate(0deg);opacity:1}50%{transform:scale(1.8) rotate(35deg);opacity:.4}}@keyframes obsetupShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.55);opacity:.08}}</style><g><path class="obsetup-shadow" d="M295.707 295.01H4.293a2.869 2.869 0 1 1 0-5.738h291.414a2.869 2.869 0 1 1 0 5.738z" fill="#78909C" fill-opacity="0.3"></path><g class="obsetup-star"><path d="M145.45 120.59l29.525 50.281a5.975 5.975 0 0 0 10.326-0.036l28.781-49.805a5.975 5.975 0 0 0-5.124-8.964l-58.307-0.476a5.975 5.975 0 0 0-5.201 9z" fill="#FFC107"></path><path d="M180.52 148.844a15.343 15.343 0 0 1-14.717-11.184 14.708 14.708 0 0 1 1.432-11.374 15.194 15.194 0 0 1 27.657 3.78 14.762 14.762 0 0 1-10.572 18.294 15.206 15.206 0 0 1-3.8 0.484zm-0.352-25.07a10 10 0 0 0-8.704 4.955 9.861 9.861 0 0 0-0.954 7.626 10.426 10.426 0 0 0 12.592 7.275 9.878 9.878 0 0 0 7.085-12.26 10.308 10.308 0 0 0-4.817-6.195 10.37 10.37 0 0 0-5.203-1.402z" fill="#000"></path></g><g class="obsetup-gallery"><path d="M31.227 70.156h91.547a21.316 21.316 0 0 1 21.316 21.316v91.547a21.316 21.316 0 0 1-21.316 21.316H31.227a21.316 21.316 0 0 1-21.316-21.316V91.472a21.316 21.316 0 0 1 21.316-21.316z" fill="#CFD8DC"></path><path d="M77 177.94a40.694 40.694 0 1 1 40.694-40.694A40.74 40.74 0 0 1 77 177.94zm0-75.027a34.333 34.333 0 1 0 34.333 34.333A34.371 34.371 0 0 0 77 102.912z" fill="#000"></path></g><path class="obsetup-ruler" d="M265.634 289.273a17.731 17.731 0 0 1-17.31-14.019l-35.275-165.808a17.701 17.701 0 1 1 34.627-7.366l35.274 165.807a17.709 17.709 0 0 1-17.316 21.387zm-10.774-15.41a11.019 11.019 0 1 0 21.556-4.586l-35.275-165.806a11.019 11.019 0 0 0-21.557 4.585z" fill="#90A4AE" fill-opacity="0.75"></path><path class="obsetup-sparkle" d="M161.303 44.224l-11.42-4.327 11.187-4.159a28.349 28.349 0 0 0 16.747-16.837l4.037-11.041 4.268 11.259a28.35 28.35 0 0 0 16.603 16.514l11.449 4.27-11.25 4.24a28.35 28.35 0 0 0-16.566 16.627l-4.245 11.388-4.343-11.465a28.35 28.35 0 0 0-16.467-16.469z" fill="#78909C" fill-opacity="0.15"></path><g class="obsetup-pink"><path d="M228.656 282.708a35.214 35.214 0 0 0-22.056-63.275 35.217 35.217 0 0 0-65.864-24.588l-25.957 94.015 97.653 0.634a35.052 35.052 0 0 0 16.224-6.786z" fill="#FF80AB"></path><path d="M214.968 276.754a3.102 3.102 0 0 1-1.875-5.573 21.659 21.659 0 0 0 4.187-30.345 3.101 3.101 0 1 1 4.943-3.746 27.861 27.861 0 0 1-5.385 39.034 3.089 3.089 0 0 1-1.87 0.63z" fill="#000"></path></g><g class="obsetup-blue"><path d="M99.487 80.176a28.349 28.349 0 1 1 56.698 0 28.349 28.349 0 1 1-56.698 0" fill="#42A5F5"></path><path d="M120.641 96.956l-12.478-14.139 5.569-4.915 7.256 8.224 20.14-20.065 5.242 5.261-25.729 25.634z" fill="#000"></path></g><g class="obsetup-search"><path d="M77.368 288.862q-1.843 0-3.701-0.16a41.763 41.763 0 0 1-14.203-3.819l-25.813 3.948 7.829-20.075a41.534 41.534 0 0 1-6.002-25.501 42.028 42.028 0 0 1 45.447-38.188 41.977 41.977 0 0 1-3.557 83.796zm-17.234-8.419l0.602 0.296a37.688 37.688 0 1 0 19.818-71.401 37.733 37.733 0 0 0-40.805 34.288 37.308 37.308 0 0 0 5.919 23.735l0.598 0.921-5.924 15.189z" fill="#546E7A"></path><path d="M77.339 272.26q-1.113 0-2.237-0.097a25.322 25.322 0 1 1 2.237 0.097zm-0.08-46.463a21.087 21.087 0 1 0 21.044 22.91 21.084 21.084 0 0 0-19.185-22.829c-0.621-0.055-1.242-0.081-1.859-0.081z" fill="#546E7A"></path></g></g></svg>';

const SVG_LANG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960"><path d="M325,848.5q-73-31.5-127.5-86T111.5,635T80,479.5t31.5-155t86-127t127.5-86T480.5,80t155,31.5t127,86t86,127t31.5,155T848.5,635t-86,127.5t-127,86T480.5,880T325,848.5ZM480,798q26-36 45-75t31-83H404q12,44 31,83t45,75ZM376,782q-18-33-31.5-68.5T322,640H204q29,50 72.5,87T376,782Zm208,0q56-18 99.5-55T756,640H638q-9,38-22.5,73.5T584,782ZM170,560H306q-3-20-4.5-39.5T300,480t1.5-40.5T306,400H170q-5,20-7.5,39.5T160,480t2.5,40.5T170,560Zm216,0H574q3-20 4.5-39.5T580,480t-1.5-40.5T574,400H386q-3,20-4.5,39.5T380,480t1.5,40.5T386,560Zm268,0H790q5-20 7.5-39.5T800,480t-2.5-40.5T790,400H654q3,20 4.5,39.5T660,480t-1.5,40.5T654,560ZM638,320H756q-29-50-72.5-87T584,178q18,33 31.5,68.5T638,320Zm-234,0H556q-12-44-31-83t-45-75q-26,36-45,75t-31,83Zm-200,0H322q9-38 22.5-73.5T376,178q-56,18-99.5,55T204,320Z" fill="#FFFFFF"></path></svg>';

const SVG_THEME='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><style>.cls-2{fill:#a2887e}.cls-3{fill:#006165}.cls-6{fill:#8e6e62}.cls-8{fill:#55c7db}.cls-9{fill:#b5e2eb}</style></defs><path d="M452.7 491a11.7 11.7 0 00-20.4-10.7l19.4 14.1z" fill="#f36e44"></path><path class="cls-2" d="M429.8 484.9l-3 10.8c-1.8 6-1.6 11.2 7 14.3l-.6 4.8h15.6l.2-7.3a35.5 35.5 0 011.4-8.5l.6-2.3-20-14.5a12.2 12.2 0 00-1.2 2.7z"></path><path class="cls-3" d="M424.7 474.8a1.1 1.1 0 10-1.4 1.8l7.7 5.6a12.2 12.2 0 011.3-2z"></path><path class="cls-3" d="M432.3 480.3a12.2 12.2 0 00-1.3 1.9l20 14.5.6-2.3zm29.4 253h-4.3a1.5 1.5 0 010-3h4.6v1.1h-4.6a.3.3 0 100 .7h4.3z"></path><rect x="125.7" y="745.5" width="530.4" height="9" rx="4.5" ry="4.5" fill="#edeff0"></rect><path d="M666.3 136.7H487.6l-29-81.5-17-9.4-71.1 8.7-58.1 82.2H133.7a34 34 0 00-20 61.6l144.6 105-55.3 170a34 34 0 0052.4 38l144.6-105 144.5 105a34 34 0 0052.5-38l-55.3-170 144.6-105a34 34 0 00-20-61.6z" fill="#78909c"></path><path class="cls-6" d="M441.5 446l-3.9 4.3a1.8 1.8 0 000 2.4 1.8 1.8 0 002.5 0l2.8-2.6z"></path><path class="cls-2" d="M456.7 453.2l-17-12.3 5.8 17.3 6 1.8 5.2-6.8z"></path><path d="M458.2 497L352.3 175.4a.8.8 0 01.7-1.1l3.6-.5a.9.9 0 011 .6l105.6 320.8a2.6 2.6 0 01-.7 2.7 2.6 2.6 0 01-4.3-1z"></path><path class="cls-6" d="M439.7 457.4l4.5-2.6 7 5.6 2.6 2.3a2.4 2.4 0 01.4 3l-.5.8-.3-1a1.5 1.5 0 00-1.7-1l-9.5 1.6z"></path><path class="cls-2" d="M454.2 456.5l-12-8.6a2.1 2.1 0 00-3 .6 2.1 2.1 0 00.5 2.8l11.5 9z"></path><path d="M369.8 164l-33.1 4a4.7 4.7 0 01-5.2-3.5 4.7 4.7 0 014-5.7l33.2-4.1a4.7 4.7 0 015.1 3.6 4.7 4.7 0 01-4 5.7z" fill="#fff"></path><path d="M353.6 174.7l-1.2-3.4-22.6 2.7a1.1 1.1 0 01-1.3-1l-1.4-7.9a1.1 1.1 0 01.2-.8 1.1 1.1 0 01.8-.5l7-.8a1.1 1.1 0 011.2.9 1.1 1.1 0 01-1 1.3l-5.8.7 1 5.7 22.6-2.8a1.2 1.2 0 011.2.8l1.4 4.3z"></path><path class="cls-8" d="M459.6 730.4l1.8 8.6-.7 1a3.5 3.5 0 002.8 5.5H489a3.9 3.9 0 003.7-4.7 3.9 3.9 0 00-3-3l-4.5-1.6a64 64 0 01-7.6-3.3l-5-2.6z"></path><path class="cls-3" d="M469.6 595.4l2.8 127.4 1.3 2.1a6.4 6.4 0 011 4l-.2 2.5a9 9 0 00-4-1h-11l-28-134.9zM492 743.7h-8.5a8 8 0 01-3.7-1l-5.4-2.8a8 8 0 00-3.7-.9h-9.3l-.7 1a3.5 3.5 0 002.8 5.5H489a3.8 3.8 0 003.2-1.8z"></path><path class="cls-9" d="M489.6 737.9l-4.5-1.7a64 64 0 01-7.6-3.3l-4.4-2.2a2.9 2.9 0 00-1.3-.3h-12.2l.7 3.3a2.1 2.1 0 012-1.7h2.5a18 18 0 016.8 1.3l9.8 4a7.5 7.5 0 002.9.6h5.5z"></path><path class="cls-3" d="M455.8 595.5h-38.9l-23.5 119-3 5.2a10.6 10.6 0 00-.7 8.6l.6 2h13l1.5-.7a4.5 4.5 0 002.2-2.4 4.4 4.4 0 00.2-2.6l-.6-2.8zm-70.2 143.9a3.8 3.8 0 00-.6 1.5 3.8 3.8 0 003.7 4.6h9.4a3.9 3.9 0 002-7.2h-13.7z"></path><path class="cls-8" d="M403.3 730.4h-13l-.5 2.2a7.1 7.1 0 01-1.2 2.8l-2.2 3H400z"></path><path class="cls-9" d="M390 732.2h12.5l.8-1.9h-13l-.4 2z"></path><path class="cls-3" d="M398 730.4v2.5a1.5 1.5 0 01-3 0v-2.6h1.2v2.6a.3.3 0 10.7 0v-2.6z"></path><path d="M499.1 483.8l-42.4-30.6-5.5 7.2 29 26.8-32.5 24.7a14.2 14.2 0 01-8.6 2.9h-4.6a14.2 14.2 0 01-12-6.7l-17-27.4 36.6-14.6-2.4-8.7-50.7 13.3a6.8 6.8 0 00-4.7 8.7l26 79 3.7 20.8-1.3 2.5a10.3 10.3 0 003 12.8l1.2 1 52.7-.1-.2-59.7a11.4 11.4 0 012.6-7.3l28.4-34.8a6.8 6.8 0 00-1.3-9.8zM467 124.4a34 34 0 01-58.8 27l-43-45.6a21 21 0 00-32.4 2.2l-20.4 28.7 6.2-40.7a47.6 47.6 0 0141.3-40.1L443 45.7a14.5 14.5 0 0116.2 12.7z" fill="#b0bec5"></path><path d="M435.8 485.7l-1 5.2a8.3 8.3 0 001.5 6.3l1.8 2.6 1.6-5.4a2 2 0 013.2-1.2 2 2 0 01.8 2.1l-.8 3.4a4 4 0 01-2.6 3l4 7a3.3 3.3 0 002.2 1.7 3.4 3.4 0 003.7-1.6 14 14 0 001.2-11l-.4-1z"></path><circle cx="431" cy="489" r="1"></circle><path class="cls-2" d="M430 487.1l-5.2 3.6a.8.8 0 000 1.2l3.2 2.5z"></path><path d="M450.3 583.4a1.7 1.7 0 002.4.2l17-13.6v-4.4l-19 15.3a1.7 1.7 0 00-.4 2.5zm-39.6-22.8l.7 3.7c28.3 5.7 43-13 43-13.3a1.7 1.7 0 10-2.7-2c-.6.8-14 18-41 11.6z" fill="#90a4ae"></path><path d="M345.6 85c-8.3-8.8-23.3-5-26.2 6.8-.4 1.4-.6 2.7-.8 4.1l-6.2 40.8 20.4-28.7a21 21 0 0132.4-2.2z" fill="#546f7a"></path></svg>';

const SVG_STYLE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><g><path d="M85.936 101.36l-14.79-18.416c-1.088-1.967-1.416-4.266-0.921-6.46 0.494-2.193 1.776-4.129 3.603-5.44 1.827-1.31 4.071-1.905 6.308-1.671 2.236 0.234 4.309 1.282 5.824 2.942 1.516-1.659 3.588-2.705 5.824-2.939 2.236-0.234 4.479 0.361 6.306 1.671 1.826 1.311 3.109 3.246 3.603 5.438 0.495 2.193 0.168 4.491-0.918 6.459l-0.079 0.117-14.76 18.299zM72.543 82.093l13.394 16.663 13.442-16.664c0.911-1.686 1.146-3.655 0.658-5.509-0.488-1.853-1.662-3.451-3.286-4.47-1.623-1.019-3.573-1.382-5.454-1.016-1.881 0.366-3.553 1.435-4.675 2.988l-0.662 0.914-0.662-0.914c-1.122-1.553-2.793-2.621-4.674-2.988-1.882-0.366-3.832-0.003-5.455 1.016-1.623 1.019-2.798 2.617-3.285 4.471-0.488 1.853-0.252 3.823 0.659 5.509z" fill="#546E7A"></path><path d="M74.39 80.601h-1.633v-0.817c0.004-1.762 0.614-3.47 1.727-4.836 1.114-1.366 2.663-2.307 4.389-2.667l0.8-0.163 0.327 1.6-0.8 0.164c-1.357 0.283-2.576 1.024-3.452 2.098-0.875 1.075-1.355 2.418-1.358 3.804v0.817zm-36.092 54.486l2.319-7.907c-2.043-2.752-3.142-6.092-3.13-9.52 0-3.417 1.09-6.745 3.111-9.499 2.022-2.755 4.869-4.793 8.128-5.817 3.26-1.025 6.761-0.983 9.995 0.119 3.234 1.102 6.032 3.207 7.988 6.009 1.955 2.802 2.965 6.154 2.884 9.57-0.081 3.416-1.25 6.716-3.337 9.422-2.086 2.706-4.981 4.675-8.264 5.622-3.283 0.947-6.782 0.822-9.989-0.356l-9.705 2.357zm15.244-31.85c-3.824 0.004-7.489 1.525-10.193 4.229-2.704 2.704-4.225 6.37-4.229 10.194-0.01 3.209 1.061 6.327 3.041 8.853l0.257 0.33-1.756 5.989 7.448-1.81 0.239 0.093c1.976 0.762 4.095 1.08 6.208 0.931 2.112-0.149 4.166-0.761 6.015-1.794 1.849-1.032 3.448-2.459 4.684-4.179 1.235-1.72 2.077-3.691 2.465-5.773 0.387-2.082 0.312-4.223-0.221-6.273-0.534-2.049-1.512-3.956-2.865-5.585-1.353-1.629-3.049-2.94-4.966-3.839-1.917-0.9-4.009-1.366-6.127-1.366z" fill="#546E7A"></path><path d="M53.542 127.364c-1.919 0-3.795-0.569-5.391-1.635-1.596-1.067-2.84-2.582-3.574-4.355-0.735-1.774-0.927-3.725-0.553-5.607 0.375-1.883 1.299-3.612 2.656-4.969 1.357-1.357 3.087-2.282 4.969-2.656 1.883-0.374 3.834-0.182 5.607 0.552 1.773 0.735 3.289 1.979 4.355 3.574 1.066 1.596 1.636 3.473 1.636 5.392-0.003 2.573-1.027 5.039-2.846 6.859-1.819 1.819-4.286 2.842-6.859 2.845zm0-17.775c-1.596 0-3.156 0.473-4.484 1.36-1.327 0.887-2.362 2.147-2.972 3.622-0.611 1.475-0.771 3.098-0.46 4.663 0.312 1.566 1.08 3.004 2.209 4.133s2.567 1.897 4.133 2.209c1.565 0.311 3.188 0.151 4.663-0.459 1.475-0.611 2.735-1.646 3.622-2.973s1.36-2.888 1.36-4.484c-0.002-2.14-0.853-4.191-2.366-5.704-1.513-1.513-3.565-2.365-5.705-2.367z" fill="#546E7A"></path><path d="M119.544 67.946c8.904 0 16.122-7.218 16.122-16.123 0-8.904-7.218-16.123-16.122-16.123-8.905 0-16.123 7.219-16.123 16.123 0 8.905 7.218 16.123 16.123 16.123z" fill="#B0BEC5"></path><path d="M119.544 62.463c-2.105 0-4.162-0.624-5.912-1.793s-3.113-2.831-3.919-4.775c-0.805-1.944-1.016-4.084-0.605-6.148 0.41-2.064 1.424-3.96 2.912-5.448 1.488-1.488 3.384-2.501 5.448-2.912 2.064-0.41 4.203-0.2 6.148 0.606 1.944 0.805 3.606 2.169 4.775 3.918 1.169 1.75 1.793 3.807 1.793 5.912-0.003 2.821-1.125 5.526-3.12 7.52-1.995 1.995-4.699 3.117-7.52 3.12zm0-19.647c-1.782 0-3.523 0.528-5.004 1.518-1.482 0.99-2.636 2.396-3.318 4.042-0.682 1.646-0.86 3.457-0.512 5.204 0.347 1.747 1.205 3.352 2.465 4.612 1.259 1.26 2.864 2.117 4.611 2.465 1.748 0.348 3.559 0.169 5.204-0.513 1.646-0.681 3.053-1.836 4.043-3.317 0.989-1.481 1.518-3.223 1.518-5.004-0.003-2.388-0.953-4.677-2.641-6.366-1.689-1.688-3.978-2.638-6.366-2.641z" fill="#000"></path><path d="M86.059 134.746c8.904 0 16.123-7.219 16.123-16.123 0-8.905-7.219-16.123-16.123-16.123s-16.123 7.218-16.123 16.123c0 8.904 7.219 16.123 16.123 16.123z" fill="#B0BEC5"></path><path d="M86.059 129.263c-2.105 0-4.162-0.624-5.912-1.793-1.749-1.169-3.113-2.831-3.918-4.775-0.806-1.945-1.016-4.084-0.606-6.148 0.411-2.064 1.424-3.96 2.912-5.448 1.488-1.488 3.384-2.502 5.448-2.912 2.064-0.411 4.204-0.2 6.148 0.605 1.944 0.806 3.606 2.17 4.775 3.919 1.169 1.75 1.793 3.807 1.793 5.912-0.003 2.821-1.125 5.525-3.12 7.52-1.994 1.995-4.699 3.117-7.52 3.12zm0-19.647c-1.782 0-3.523 0.528-5.004 1.518-1.481 0.989-2.636 2.396-3.317 4.042-0.682 1.646-0.861 3.457-0.513 5.204 0.348 1.747 1.205 3.352 2.465 4.612 1.26 1.259 2.865 2.117 4.612 2.465 1.747 0.347 3.558 0.169 5.204-0.513 1.646-0.681 3.052-1.836 4.042-3.317 0.99-1.481 1.518-3.223 1.518-5.004-0.003-2.388-0.952-4.678-2.641-6.366-1.689-1.689-3.978-2.639-6.366-2.641z" fill="#000"></path><path d="M53.776 101.211c8.905 0 16.123-7.219 16.123-16.123 0-8.905-7.218-16.123-16.123-16.123-8.904 0-16.123 7.218-16.123 16.123 0 8.904 7.219 16.123 16.123 16.123z" fill="#B0BEC5"></path><path d="M53.777 95.728c-2.105 0-4.162-0.624-5.912-1.793-1.749-1.169-3.113-2.831-3.919-4.775-0.805-1.945-1.016-4.084-0.605-6.148 0.41-2.064 1.424-3.96 2.912-5.448 1.488-1.488 3.384-2.501 5.448-2.912 2.063-0.41 4.203-0.2 6.147 0.606 1.944 0.805 3.606 2.168 4.775 3.918 1.169 1.75 1.793 3.807 1.793 5.911-0.003 2.821-1.125 5.526-3.119 7.521-1.995 1.994-4.7 3.117-7.52 3.12zm0-19.647c-1.782 0-3.523 0.528-5.004 1.518-1.481 0.989-2.636 2.396-3.318 4.042-0.681 1.645-0.86 3.457-0.512 5.204 0.347 1.747 1.205 3.352 2.465 4.611 1.259 1.26 2.864 2.118 4.611 2.465 1.747 0.348 3.558 0.169 5.204-0.512 1.646-0.682 3.053-1.836 4.042-3.318 0.99-1.481 1.518-3.222 1.518-5.003-0.003-2.388-0.952-4.678-2.641-6.366-1.688-1.689-3.978-2.638-6.365-2.641z" fill="#000"></path><path d="M31.739 102H9.426c-2.869 0-5.195 2.326-5.195 5.195v22.313c0 2.87 2.326 5.196 5.195 5.196h22.313c2.87 0 5.196-2.326 5.196-5.196v-22.313c0-2.869-2.326-5.195-5.196-5.195z" fill="#FDD835"></path><path d="M20.42 129.139c-0.413 0-0.825-0.024-1.235-0.071-2.787-0.321-5.339-1.715-7.115-3.888-1.775-2.172-2.634-4.951-2.393-7.746 0.241-2.795 1.561-5.387 3.682-7.224 2.12-1.837 4.874-2.775 7.675-2.614 2.8 0.16 5.429 1.406 7.326 3.473 1.897 2.067 2.913 4.792 2.834 7.596-0.08 2.805-1.25 5.468-3.262 7.423-2.012 1.956-4.706 3.05-7.512 3.051zm-0.014-19.778c-1.734 0.001-3.431 0.504-4.886 1.448-1.455 0.943-2.606 2.288-3.314 3.871-0.709 1.583-0.944 3.337-0.678 5.051 0.266 1.713 1.022 3.314 2.177 4.607 1.155 1.294 2.659 2.226 4.332 2.684 1.673 0.459 3.442 0.423 5.095-0.101 1.653-0.525 3.119-1.517 4.221-2.856 1.102-1.338 1.794-2.968 1.991-4.691 0.144-1.259 0.02-2.534-0.364-3.742-0.383-1.208-1.018-2.321-1.862-3.267-0.844-0.945-1.878-1.701-3.035-2.219-1.157-0.518-2.41-0.785-3.677-0.785z" fill="#000"></path><path d="M130.378 68.297h-22.313c-2.869 0-5.195 2.326-5.195 5.195v22.313c0 2.87 2.326 5.196 5.195 5.196h22.313c2.869 0 5.195-2.326 5.195-5.196V73.492c0-2.869-2.326-5.195-5.195-5.195z" fill="#FDD835"></path><path d="M119.059 95.436c-2.186 0.001-4.321-0.662-6.122-1.901-1.801-1.239-3.183-2.996-3.963-5.038-0.78-2.042-0.921-4.273-0.404-6.397 0.517-2.125 1.667-4.042 3.297-5.498 1.631-1.456 3.666-2.382 5.835-2.655 2.169-0.273 4.37 0.119 6.311 1.124 1.941 1.006 3.531 2.577 4.558 4.507 1.028 1.929 1.445 4.126 1.197 6.298-0.305 2.628-1.563 5.053-3.537 6.815-1.974 1.762-4.526 2.739-7.172 2.745zm-0.015-19.778c-2.34 0.001-4.589 0.914-6.267 2.546-1.678 1.632-2.654 3.853-2.72 6.193-0.067 2.34 0.782 4.613 2.364 6.337 1.583 1.725 3.776 2.764 6.113 2.897 2.337 0.134 4.634-0.649 6.403-2.182 1.769-1.533 2.87-3.695 3.071-6.027 0.2-2.332-0.516-4.65-1.998-6.462-1.481-1.813-3.611-2.976-5.936-3.243-0.342-0.039-0.686-0.059-1.03-0.059z" fill="#000"></path><path d="M129.995 134.827c-0.351-0.001-0.697-0.087-1.008-0.251l-8.176-4.298c-0.075-0.04-0.16-0.061-0.246-0.062-0.086 0-0.17 0.021-0.246 0.061l-8.176 4.299c-0.357 0.188-0.76 0.272-1.163 0.243-0.402-0.029-0.789-0.171-1.115-0.408-0.327-0.237-0.581-0.561-0.733-0.935-0.152-0.374-0.196-0.783-0.128-1.181l1.561-9.104c0.015-0.084 0.009-0.171-0.018-0.253-0.027-0.082-0.073-0.156-0.134-0.216l-6.614-6.447c-0.289-0.282-0.494-0.639-0.59-1.03-0.097-0.392-0.082-0.804 0.042-1.187 0.125-0.384 0.355-0.726 0.663-0.986 0.309-0.26 0.684-0.429 1.084-0.487l9.14-1.328c0.085-0.012 0.166-0.045 0.236-0.096 0.069-0.05 0.125-0.117 0.163-0.194l4.088-8.282c0.179-0.362 0.455-0.667 0.798-0.88 0.343-0.213 0.738-0.326 1.142-0.326 0.404 0 0.799 0.113 1.142 0.326 0.343 0.213 0.619 0.518 0.798 0.88l4.087 8.282c0.039 0.077 0.095 0.144 0.164 0.194 0.07 0.051 0.151 0.084 0.236 0.096l9.14 1.328c0.4 0.058 0.775 0.227 1.084 0.487 0.308 0.26 0.538 0.602 0.663 0.986 0.124 0.384 0.139 0.795 0.042 1.187s-0.301 0.749-0.59 1.031l-6.614 6.446c-0.062 0.06-0.108 0.135-0.134 0.216-0.027 0.082-0.033 0.169-0.018 0.254l1.561 9.103c0.053 0.31 0.038 0.629-0.045 0.933-0.083 0.303-0.231 0.586-0.433 0.827-0.203 0.241-0.456 0.434-0.741 0.568-0.286 0.133-0.597 0.203-0.912 0.204zm-9.43-6.244c0.351 0 0.697 0.086 1.007 0.249l8.175 4.298c0.087 0.046 0.186 0.066 0.285 0.059 0.098-0.007 0.193-0.042 0.273-0.1 0.08-0.058 0.142-0.137 0.179-0.229 0.038-0.091 0.048-0.191 0.032-0.289l-1.562-9.104c-0.059-0.345-0.033-0.7 0.075-1.033 0.108-0.334 0.296-0.636 0.547-0.881l6.614-6.447c0.071-0.069 0.121-0.157 0.145-0.253 0.024-0.096 0.02-0.196-0.01-0.29-0.031-0.094-0.087-0.178-0.163-0.242-0.075-0.063-0.167-0.105-0.265-0.119l-9.141-1.328c-0.347-0.051-0.676-0.185-0.96-0.391-0.283-0.206-0.513-0.478-0.668-0.792l-4.088-8.283c-0.043-0.089-0.111-0.164-0.195-0.216-0.084-0.052-0.181-0.08-0.28-0.08-0.099 0-0.196 0.028-0.28 0.08-0.084 0.052-0.151 0.127-0.195 0.216l-4.088 8.282c-0.155 0.315-0.384 0.587-0.668 0.793-0.284 0.206-0.613 0.34-0.96 0.391l-9.141 1.328c-0.098 0.014-0.19 0.056-0.265 0.119-0.076 0.064-0.132 0.148-0.162 0.242-0.031 0.094-0.035 0.194-0.011 0.29 0.024 0.096 0.074 0.183 0.145 0.252l6.614 6.448c0.251 0.245 0.438 0.547 0.547 0.88 0.108 0.334 0.134 0.689 0.075 1.034l-1.561 9.104c-0.017 0.098-0.006 0.198 0.031 0.289 0.037 0.092 0.099 0.171 0.179 0.229 0.08 0.058 0.175 0.093 0.273 0.1 0.099 0.007 0.198-0.013 0.285-0.059l8.175-4.298c0.311-0.164 0.656-0.249 1.007-0.249z" fill="#546E7A"></path><path d="M110.469 116.181l-0.235-1.616 6.373-0.926 2.852-5.777 1.465 0.724-2.85 5.774c-0.117 0.238-0.291 0.444-0.505 0.6-0.215 0.156-0.465 0.258-0.728 0.296l-6.372 0.925z" fill="#546E7A"></path><path d="M138.884 137H1.116c-0.397 0.004-0.766-0.186-0.966-0.497-0.2-0.311-0.2-0.695 0-1.006 0.2-0.311 0.569-0.501 0.966-0.497h137.768c0.397-0.004 0.766 0.186 0.966 0.497 0.2 0.311 0.2 0.695 0 1.006-0.2 0.311-0.569 0.501-0.966 0.497z" fill="#78909C" fill-opacity="0.4"></path></g></svg>';

const SVG_TERMS='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141 120"><g><path d="M84.098,3.172C83.348,2.421 82.33,2 81.27,2L59.73,2C58.67,2 57.652,2.421 56.902,3.172L41.672,18.402C40.921,19.152 40.5,20.17 40.5,21.23V42.77C40.5,43.83 40.921,44.848 41.672,45.598L56.902,60.828C57.652,61.579 58.67,62 59.73,62H81.27C82.33,62 83.348,61.579 84.098,60.828L99.328,45.598C100.079,44.848 100.5,43.83 100.5,42.77V21.23C100.5,20.17 100.079,19.152 99.328,18.402L84.098,3.172Z" fill="#EE675C"></path><path d="M70.5,62V118" stroke="#9AA0A6" stroke-width="1"></path><path d="M67.5,15h6v24h-6z" fill="#3C4043"></path><path d="M67,46.5C67,48.409 68.591,50 70.5,50C72.409,50 74,48.409 74,46.5C74,44.591 72.409,43 70.5,43C68.485,43.106 67,44.591 67,46.5Z" fill="#3C4043"></path><path d="M40.5,118H100.5" stroke="#9AA0A6" stroke-width="1"></path></g></svg>';

const WORLD_COUNTRIES=[
  {c:'af',ar:'أفغانستان',en:'Afghanistan'},{c:'al',ar:'ألبانيا',en:'Albania'},{c:'dz',ar:'الجزائر',en:'Algeria'},{c:'ad',ar:'أندورا',en:'Andorra'},{c:'ao',ar:'أنغولا',en:'Angola'},
  {c:'ar',ar:'الأرجنتين',en:'Argentina'},{c:'am',ar:'أرمينيا',en:'Armenia'},{c:'au',ar:'أستراليا',en:'Australia'},{c:'at',ar:'النمسا',en:'Austria'},{c:'az',ar:'أذربيجان',en:'Azerbaijan'},
  {c:'bh',ar:'البحرين',en:'Bahrain'},{c:'bd',ar:'بنغلاديش',en:'Bangladesh'},{c:'by',ar:'بيلاروسيا',en:'Belarus'},{c:'be',ar:'بلجيكا',en:'Belgium'},{c:'bz',ar:'بليز',en:'Belize'},
  {c:'bj',ar:'بنين',en:'Benin'},{c:'bt',ar:'بوتان',en:'Bhutan'},{c:'bo',ar:'بوليفيا',en:'Bolivia'},{c:'ba',ar:'البوسنة والهرسك',en:'Bosnia and Herzegovina'},{c:'bw',ar:'بوتسوانا',en:'Botswana'},
  {c:'br',ar:'البرازيل',en:'Brazil'},{c:'bn',ar:'بروناي',en:'Brunei'},{c:'bg',ar:'بلغاريا',en:'Bulgaria'},{c:'bf',ar:'بوركينا فاسو',en:'Burkina Faso'},{c:'bi',ar:'بوروندي',en:'Burundi'},
  {c:'kh',ar:'كمبوديا',en:'Cambodia'},{c:'cm',ar:'الكاميرون',en:'Cameroon'},{c:'ca',ar:'كندا',en:'Canada'},{c:'cv',ar:'الرأس الأخضر',en:'Cape Verde'},{c:'td',ar:'تشاد',en:'Chad'},
  {c:'cl',ar:'تشيلي',en:'Chile'},{c:'cn',ar:'الصين',en:'China'},{c:'co',ar:'كولومبيا',en:'Colombia'},{c:'km',ar:'جزر القمر',en:'Comoros'},{c:'cg',ar:'الكونغو',en:'Congo'},
  {c:'cr',ar:'كوستاريكا',en:'Costa Rica'},{c:'hr',ar:'كرواتيا',en:'Croatia'},{c:'cu',ar:'كوبا',en:'Cuba'},{c:'cy',ar:'قبرص',en:'Cyprus'},{c:'cz',ar:'التشيك',en:'Czechia'},
  {c:'dk',ar:'الدنمارك',en:'Denmark'},{c:'dj',ar:'جيبوتي',en:'Djibouti'},{c:'do',ar:'جمهورية الدومينيكان',en:'Dominican Republic'},{c:'ec',ar:'الإكوادور',en:'Ecuador'},{c:'eg',ar:'مصر',en:'Egypt'},
  {c:'sv',ar:'السلفادور',en:'El Salvador'},{c:'ee',ar:'إستونيا',en:'Estonia'},{c:'et',ar:'إثيوبيا',en:'Ethiopia'},{c:'fj',ar:'فيجي',en:'Fiji'},{c:'fi',ar:'فنلندا',en:'Finland'},
  {c:'fr',ar:'فرنسا',en:'France'},{c:'ga',ar:'الغابون',en:'Gabon'},{c:'gm',ar:'غامبيا',en:'Gambia'},{c:'ge',ar:'جورجيا',en:'Georgia'},{c:'de',ar:'ألمانيا',en:'Germany'},
  {c:'gh',ar:'غانا',en:'Ghana'},{c:'gr',ar:'اليونان',en:'Greece'},{c:'gt',ar:'غواتيمالا',en:'Guatemala'},{c:'gn',ar:'غينيا',en:'Guinea'},{c:'gy',ar:'غيانا',en:'Guyana'},
  {c:'ht',ar:'هايتي',en:'Haiti'},{c:'hn',ar:'هندوراس',en:'Honduras'},{c:'hk',ar:'هونغ كونغ',en:'Hong Kong'},{c:'hu',ar:'المجر',en:'Hungary'},{c:'is',ar:'آيسلندا',en:'Iceland'},
  {c:'in',ar:'الهند',en:'India'},{c:'id',ar:'إندونيسيا',en:'Indonesia'},{c:'ir',ar:'إيران',en:'Iran'},{c:'iq',ar:'العراق',en:'Iraq'},{c:'ie',ar:'أيرلندا',en:'Ireland'},
  {c:'il',ar:'إسرائيل',en:'Israel'},{c:'it',ar:'إيطاليا',en:'Italy'},{c:'ci',ar:'ساحل العاج',en:'Ivory Coast'},{c:'jm',ar:'جامايكا',en:'Jamaica'},{c:'jp',ar:'اليابان',en:'Japan'},
  {c:'jo',ar:'الأردن',en:'Jordan'},{c:'kz',ar:'كازاخستان',en:'Kazakhstan'},{c:'ke',ar:'كينيا',en:'Kenya'},{c:'kw',ar:'الكويت',en:'Kuwait'},{c:'kg',ar:'قيرغيزستان',en:'Kyrgyzstan'},
  {c:'la',ar:'لاوس',en:'Laos'},{c:'lv',ar:'لاتفيا',en:'Latvia'},{c:'lb',ar:'لبنان',en:'Lebanon'},{c:'ly',ar:'ليبيا',en:'Libya'},{c:'lt',ar:'ليتوانيا',en:'Lithuania'},
  {c:'lu',ar:'لوكسمبورغ',en:'Luxembourg'},{c:'mo',ar:'ماكاو',en:'Macao'},{c:'mg',ar:'مدغشقر',en:'Madagascar'},{c:'my',ar:'ماليزيا',en:'Malaysia'},{c:'mv',ar:'المالديف',en:'Maldives'},
  {c:'ml',ar:'مالي',en:'Mali'},{c:'mt',ar:'مالطا',en:'Malta'},{c:'mr',ar:'موريتانيا',en:'Mauritania'},{c:'mu',ar:'موريشيوس',en:'Mauritius'},{c:'mx',ar:'المكسيك',en:'Mexico'},
  {c:'md',ar:'مولدوفا',en:'Moldova'},{c:'mn',ar:'منغوليا',en:'Mongolia'},{c:'me',ar:'الجبل الأسود',en:'Montenegro'},{c:'ma',ar:'المغرب',en:'Morocco'},{c:'mz',ar:'موزمبيق',en:'Mozambique'},
  {c:'mm',ar:'ميانمار',en:'Myanmar'},{c:'na',ar:'ناميبيا',en:'Namibia'},{c:'np',ar:'نيبال',en:'Nepal'},{c:'nl',ar:'هولندا',en:'Netherlands'},{c:'nz',ar:'نيوزيلندا',en:'New Zealand'},
  {c:'ni',ar:'نيكاراغوا',en:'Nicaragua'},{c:'ne',ar:'النيجر',en:'Niger'},{c:'ng',ar:'نيجيريا',en:'Nigeria'},{c:'kp',ar:'كوريا الشمالية',en:'North Korea'},{c:'mk',ar:'مقدونيا الشمالية',en:'North Macedonia'},
  {c:'no',ar:'النرويج',en:'Norway'},{c:'om',ar:'عُمان',en:'Oman'},{c:'pk',ar:'باكستان',en:'Pakistan'},{c:'ps',ar:'فلسطين',en:'Palestine'},{c:'pa',ar:'بنما',en:'Panama'},
  {c:'py',ar:'باراغواي',en:'Paraguay'},{c:'pe',ar:'بيرو',en:'Peru'},{c:'ph',ar:'الفلبين',en:'Philippines'},{c:'pl',ar:'بولندا',en:'Poland'},{c:'pt',ar:'البرتغال',en:'Portugal'},
  {c:'qa',ar:'قطر',en:'Qatar'},{c:'ro',ar:'رومانيا',en:'Romania'},{c:'ru',ar:'روسيا',en:'Russia'},{c:'rw',ar:'رواندا',en:'Rwanda'},{c:'sa',ar:'السعودية',en:'Saudi Arabia'},
  {c:'sn',ar:'السنغال',en:'Senegal'},{c:'rs',ar:'صربيا',en:'Serbia'},{c:'sg',ar:'سنغافورة',en:'Singapore'},{c:'sk',ar:'سلوفاكيا',en:'Slovakia'},{c:'si',ar:'سلوفينيا',en:'Slovenia'},
  {c:'so',ar:'الصومال',en:'Somalia'},{c:'za',ar:'جنوب أفريقيا',en:'South Africa'},{c:'kr',ar:'كوريا الجنوبية',en:'South Korea'},{c:'ss',ar:'جنوب السودان',en:'South Sudan'},{c:'es',ar:'إسبانيا',en:'Spain'},
  {c:'lk',ar:'سريلانكا',en:'Sri Lanka'},{c:'sd',ar:'السودان',en:'Sudan'},{c:'se',ar:'السويد',en:'Sweden'},{c:'ch',ar:'سويسرا',en:'Switzerland'},{c:'sy',ar:'سوريا',en:'Syria'},
  {c:'tw',ar:'تايوان',en:'Taiwan'},{c:'tj',ar:'طاجيكستان',en:'Tajikistan'},{c:'tz',ar:'تنزانيا',en:'Tanzania'},{c:'th',ar:'تايلاند',en:'Thailand'},{c:'tl',ar:'تيمور الشرقية',en:'Timor-Leste'},
  {c:'tg',ar:'توغو',en:'Togo'},{c:'tn',ar:'تونس',en:'Tunisia'},{c:'tr',ar:'تركيا',en:'Turkey'},{c:'tm',ar:'تركمانستان',en:'Turkmenistan'},{c:'ug',ar:'أوغندا',en:'Uganda'},
  {c:'ua',ar:'أوكرانيا',en:'Ukraine'},{c:'ae',ar:'الإمارات',en:'United Arab Emirates'},{c:'gb',ar:'المملكة المتحدة',en:'United Kingdom'},{c:'us',ar:'الولايات المتحدة',en:'United States'},{c:'uy',ar:'الأوروغواي',en:'Uruguay'},
  {c:'uz',ar:'أوزبكستان',en:'Uzbekistan'},{c:'ve',ar:'فنزويلا',en:'Venezuela'},{c:'vn',ar:'فيتنام',en:'Vietnam'},{c:'ye',ar:'اليمن',en:'Yemen'},{c:'zm',ar:'زامبيا',en:'Zambia'},{c:'zw',ar:'زيمبابوي',en:'Zimbabwe'}
];
const BLOCKED_COUNTRIES=['sy','ps','il','kr'];
const isBlockedCountry=c=>BLOCKED_COUNTRIES.includes(String(c||'').toLowerCase());
const countryLabel=(code,ar)=>{
  const it=WORLD_COUNTRIES.find(x=>x.c===code);
  if(!it)return code||'';
  return ar?it.ar:it.en;
};

const OnboardFlow=({onFinish,setLang,setTheme,setExpMode,setStyle2})=>{
  const[step,setStep]=useState(0);
  const[langPick,setLangPick]=useState(null);
  const[themePick,setThemePick]=useState(null);
  const[lookPick,setLookPick]=useState(null);
  const[countryPick,setCountryPick]=useState(null);
  const[sheet,setSheet]=useState(null);
  const[sheetQ,setSheetQ]=useState('');
  const[pct,setPct]=useState(0);
  const ar=langPick==='ar';
  useEffect(()=>{if(sheet)setSheetQ('')},[sheet]);
  useEffect(()=>{
    if(step!==6)return;
    const start=Date.now();
    const t=setInterval(()=>{
      const p=Math.min(100,((Date.now()-start)/8000)*100);
      setPct(p);
      if(p>=100){clearInterval(t);onFinish({lang:langPick||'ar',theme:themePick||'light',exp:!lookPick,style2:!!lookPick,country:countryPick||'us'})}
    },50);
    return()=>clearInterval(t);
  },[step]);
  const goNext=()=>{
    if(step===0){setStep(1);return}
    if(step===1){if(!langPick){setSheet('lang');return}setLang(langPick);setStep(2);return}
    if(step===2){if(!themePick){setSheet('theme');return}setTheme(themePick);setStep(3);return}
    if(step===3){if(lookPick===null)return;setStyle2(!!lookPick);setExpMode(!lookPick);setStep(4);return}
    if(step===4){setStep(5);return}
    if(step===5){if(!countryPick){setSheet('country');return}setStep(6)}
  };
  const langLabel=langPick==='ar'?'العربية':langPick==='en'?'English':(ar?'اختر اللغة':'Choose language');
  const themeLabel=themePick==='dark'?(ar?'داكن':'Dark'):themePick==='light'?(ar?'فاتح':'Light'):(ar?'اختر الثيم':'Choose theme');
  const countryName=countryPick?countryLabel(countryPick,ar):(ar?'اختر البلد':'Choose country');
  const filteredCountries=WORLD_COUNTRIES.filter(x=>{
    const q=sheetQ.trim().toLowerCase();
    if(!q)return true;
    return x.ar.includes(sheetQ.trim())||x.en.toLowerCase().includes(q)||x.c.includes(q);
  });
  return(
    React.createElement('div', { className: "ob-screen", dir: ar?'rtl':'ltr',}
      , step===0&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement(ObSvg, { className: "ob-logo", html: SVG_SETUP,})
          , React.createElement('div', { className: "ob-title",}, "Store Setup" )
        )
      )
      , step===1&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement(ObSvg, { className: "ob-logo", html: SVG_LANG,})
          , React.createElement('button', { type: "button", className: "ob-select", onClick: ()=>setSheet('lang'),}
            , React.createElement('span', null, langLabel), React.createElement('span', null, "▾")
          )
        )
      )
      , step===2&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement(ObSvg, { className: "ob-logo", html: SVG_THEME,})
          , React.createElement('button', { type: "button", className: "ob-select", onClick: ()=>setSheet('theme'),}
            , React.createElement('span', null, themeLabel), React.createElement('span', null, "▾")
          )
        )
      )
      , step===3&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement('div', { className: "ob-title", style: {marginBottom:18},}, ar?'تخصيص التثبيت والستايل':'Install page and style')
          , React.createElement('div', { className: "ob-previews",}
            , React.createElement('button', { type: "button", className: `ob-preview-wrap ${lookPick===false?'on':''}`, onClick: ()=>setLookPick(false),}
              , React.createElement('div', { className: "ob-preview",}, React.createElement(InstallMock, { promo: true,}))
              , React.createElement('span', { className: "ob-preview-cap",}, ar?'ستايل أخضر مع دعائية':'Green style with promo')
            )
            , React.createElement('button', { type: "button", className: `ob-preview-wrap ${lookPick===true?'on':''}`, onClick: ()=>setLookPick(true),}
              , React.createElement('div', { className: "ob-preview",}, React.createElement(InstallMock, { promo: false, blue: true,}))
              , React.createElement('span', { className: "ob-preview-cap",}, ar?'ستايل أزرق دون دعائية':'Blue style without promo')
            )
          )
        )
      )
      , step===4&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement(ObSvg, { className: "ob-logo sm" , html: SVG_TERMS,})
          , React.createElement('p', { className: "ob-legal",}, "بمتابعتك أنت توافق على بنود الخدمة وسياسة الخصوصية الخاصة بنا. كما أنه سيتم جلب بيانات هائلة عبر خدمات خارجية مثل iTunes وقد تخضع هذه المواقع إلى بنود خدمة وسياسة خصوصية خاصة بها. نحن لا نتحمل مسؤولية أي محتوى صادر من هذه الخدمات."                                         )
        )
      )
      , step===5&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement(ObSvg, { className: "ob-logo sm" , html: SVG_TERMS,})
          , React.createElement('button', { type: "button", className: "ob-select", onClick: ()=>setSheet('country'),}
            , React.createElement('span', null, countryName), React.createElement('span', null, "▾")
          )
        )
      )
      , step===6&&(
        React.createElement('div', { className: "ob-body",}
          , React.createElement('div', { style: {fontSize:28,fontWeight:800,lineHeight:1.3,textAlign:'center'},}, ar?'مرحبا بك في APKDroid Store':'Welcome to APKDroid Store')
          , React.createElement('div', { style: {marginTop:14,fontSize:16,opacity:.8},}, ar?'الإعداد':'Setup')
          , React.createElement('div', { className: "ob-bar",}, React.createElement('i', { style: {width:pct+'%'},}))
        )
      )
      , step!==6&&(
        React.createElement('div', { className: "ob-foot",}
          , React.createElement('button', { type: "button", className: "ob-next", onClick: goNext,}, step===4?'Next And Save':'Next')
        )
      )
      , sheet&&(
        React.createElement('div', { className: "ob-sheet-bg", onClick: ()=>setSheet(null),}
          , React.createElement('div', { className: "ob-sheet", onClick: e=>e.stopPropagation(),}
            , React.createElement('div', { className: "ob-sheet-handle",})
            , sheet==='lang'&&React.createElement(React.Fragment, null
              , React.createElement('button', { type: "button", className: `ob-sheet-item ${langPick==='ar'?'on':''}`, onClick: ()=>{setLangPick('ar');setSheet(null)},}, "العربية")
              , React.createElement('button', { type: "button", className: `ob-sheet-item ${langPick==='en'?'on':''}`, onClick: ()=>{setLangPick('en');setSheet(null)},}, "English")
            )
            , sheet==='theme'&&React.createElement(React.Fragment, null
              , React.createElement('button', { type: "button", className: `ob-sheet-item ${themePick==='light'?'on':''}`, onClick: ()=>{setThemePick('light');setSheet(null)},}
                , React.createElement('span', { className: "ob-dot", style: {background:'#f2f2f7'},}), ar?'فاتح':'Light'
              )
              , React.createElement('button', { type: "button", className: `ob-sheet-item ${themePick==='dark'?'on':''}`, onClick: ()=>{setThemePick('dark');setSheet(null)},}
                , React.createElement('span', { className: "ob-dot", style: {background:'#182C26'},}), ar?'داكن':'Dark'
              )
            )
            , sheet==='country'&&React.createElement(React.Fragment, null
              , React.createElement('input', { className: "ob-sheet-search", value: sheetQ, onChange: e=>setSheetQ(e.target.value), placeholder: ar?'بحث عن بلد':'Search country',})
              , React.createElement('div', { className: "ob-sheet-list",}
                , filteredCountries.map(x=>(
                  React.createElement('button', { key: x.c, type: "button", className: `ob-sheet-item ${countryPick===x.c?'on':''}`, onClick: ()=>{setCountryPick(x.c);setSheet(null)},}
                    , ar?x.ar:x.en
                  )
                ))
              )
            )
          )
        )
      )
    )
  );
};


const SVG_BLOCKED='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><g><path d="M36,36m-36,0a36,36 0,1 1,72 0a36,36 0,1 1,-72 0" fill="#F28B82" fill-opacity="0.08"></path><path d="M20.417,48.75L36,21.833L51.583,48.75H20.417ZM46.667,45.917L36,27.486L25.333,45.917H46.667ZM34.583,41.667V44.5H37.417V41.667H34.583ZM34.583,33.167H37.417V38.833H34.583V33.167Z" fill="#F28B82"></path></g></svg>';
const CountryBlock=({country,setCountry,lang})=>{
  const[open,setOpen]=useState(false);
  const[q,setQ]=useState('');
  const ar=lang==='ar';
  const list=WORLD_COUNTRIES.filter(x=>{
    const s=q.trim().toLowerCase();
    if(!s)return true;
    return x.ar.includes(q.trim())||x.en.toLowerCase().includes(s)||x.c.includes(s);
  });
  const pick=c=>{
    setCountry(c);setS('apk_country',c);setOpen(false);
    if(!isBlockedCountry(c))location.reload();
  };
  return(
    React.createElement('div', { className: "ob-screen", dir: ar?'rtl':'ltr',}
      , React.createElement('div', { className: "ob-body",}
        , React.createElement(ObSvg, { className: "ob-logo sm" , html: SVG_BLOCKED,})
        , React.createElement('p', { className: "ob-legal", style: {opacity:1,fontSize:'1rem',fontWeight:700},}, t('country_blocked'))
        , React.createElement('button', { type: "button", className: "ob-select", onClick: ()=>setOpen(true),}
          , React.createElement('span', null, countryLabel(country,ar)||t('choose_country')), React.createElement('span', null, "▾")
        )
      )
      , open&&(
        React.createElement('div', { className: "ob-sheet-bg", onClick: ()=>setOpen(false),}
          , React.createElement('div', { className: "ob-sheet", onClick: e=>e.stopPropagation(),}
            , React.createElement('div', { className: "ob-sheet-handle",})
            , React.createElement('input', { className: "ob-sheet-search", value: q, onChange: e=>setQ(e.target.value), placeholder: ar?'بحث عن بلد':'Search country',})
            , React.createElement('div', { className: "ob-sheet-list",}
              , list.map(x=>(
                React.createElement('button', { key: x.c, type: "button", className: `ob-sheet-item ${country===x.c?'on':''}`, onClick: ()=>pick(x.c),}
                  , ar?x.ar:x.en
                )
              ))
            )
          )
        )
      )
    )
  );
};

function App(){
  const[route,nav]=useHash();
  const[theme,setThemeS]=useState(()=>getS('apk_theme','light'));
  const[country,setCountry]=useState(()=>getS('apk_country','us'));
  const[lang,setLangS]=useState(()=>getS('apk_lang','ar'));
  const[favs,setFavs]=useState(()=>loadFavs());
  const[songFavs,setSongFavs]=useState(()=>loadSongFavs());
  const[style2,setStyle2S]=useState(()=>!!getS('apk_style2',false));
  const setStyle2=v=>{setStyle2S(!!v);setS('apk_style2',!!v)};
  const[selStore,setSelStore]=useState(()=>{
    if(!getS('apk_store_v2',false)){
      setS('apk_store_v2',true);
      setS('apk_store','direct');
      return 'direct';
    }
    return normalizeStore(getS('apk_store','direct'));
  });
  const[expMode,setExpModeS]=useState(()=>{
    const s2=!!getS('apk_style2',false);
    const exp=!s2;
    setS('apk_exp_mode',exp);
    return exp;
  });
  const setExpMode=v=>{setExpModeS(!!v);setS('apk_exp_mode',!!v)};
  const[detailApp,setDetailApp]=useState(null);
  const[track,setTrack]=useState(null);const[playing,setPlaying]=useState(false);const[menuOpen,setMenuOpen]=useState(false);
  const[platOpen,setPlatOpen]=useState(false); // kept unused after moving sources to Settings
  const[accOpen,setAccOpen]=useState(false);
  const[offOpen,setOffOpen]=useState(false);
  const[offBusy,setOffBusy]=useState(false);
  const probeNet=async()=>{
    if(typeof navigator!=='undefined'&&navigator.onLine===false) return false;
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),2800);
    try{
      await fetch('https://www.gstatic.com/generate_204',{method:'GET',mode:'no-cors',cache:'no-store',signal:ctrl.signal});
      return true;
    }catch(e){
      return false;
    }finally{clearTimeout(timer)}
  };
  const retryNet=async()=>{
    setOffBusy(true);
    const ok=await probeNet();
    setOffBusy(false);
    if(ok) setOffOpen(false);
  };
  const[profile,setProfile]=useState(()=>getS('apk_profile',{name:'',photo:''}));
  const[night,setNightS]=useState(()=>{const saved=getS('apk_night',null);if(saved==null)return getS('apk_theme','light')==='black';return !!saved});
  const setNight=v=>{setNightS(!!v);setS('apk_night',!!v)};
  const[queue,setQueue]=useState([]);const[qIdx,setQIdx]=useState(0);
  const[progress,setProgress]=useState(0);const[duration,setDuration]=useState(0);
  const[eqOn,setEqOnS]=useState(()=>getS('apk_eq_on',false));
  const[bands,setBands]=useState(()=>getS('apk_eq_bands',EQ_FREQS.map(()=>0)));
  const[volume,setVolumeS]=useState(()=>getS('apk_volume',1));
  const audio=useRef(null);
  const ctxRef=useRef(null);const filtersRef=useRef(null);const gainRef=useRef(null);const sourceRef=useRef(null);const wiredRef=useRef(false);
  const queueRef=useRef([]);const qIdxRef=useRef(0);
  useEffect(()=>{queueRef.current=queue;qIdxRef.current=qIdx},[queue,qIdx]);
  useEffect(()=>{
    let cancel=false;
    probeNet().then(ok=>{if(!cancel&&!ok)setOffOpen(true)});
    const off=()=>setOffOpen(true);
    const on=()=>setOffOpen(false);
    window.addEventListener('offline',off);
    window.addEventListener('online',on);
    return()=>{cancel=true; window.removeEventListener('offline',off); window.removeEventListener('online',on)};
  },[]);

  useEffect(()=>{
    const n=!!night;const th=theme==='black'?'dark':theme;if(th!==theme)setThemeS(th);
    document.documentElement.classList.toggle('black',n);
    document.documentElement.classList.toggle('dark',th==='dark');
    setS('apk_theme',th);setS('apk_night',n);
    const special=!!accOpen||route==='/settings'||route==='/downloads'||route==='/search-log';
    const color=special?'#1F1F1F':(n?'#000000':(th==='dark'?'#141415':'#FFFFFF'));
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',color);
    try{
      fetch('./manifest.json').then(r=>r.json()).then(man=>{
        man.background_color=color;man.theme_color=color;
        const url=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:'application/manifest+json'}));
        let link=document.querySelector('link[rel="manifest"]');
        if(!link){link=document.createElement('link');link.rel='manifest';document.head.appendChild(link)}
        const prev=link.dataset.blob;
        link.href=url;link.dataset.blob=url;
        if(prev)URL.revokeObjectURL(prev);
      }).catch(()=>{});
    }catch (e39){}
  },[theme,night,route,accOpen]);
  useEffect(()=>{installImgFallback()},[]);
  useEffect(()=>{document.documentElement.classList.toggle('style2',!!style2);setS('apk_style2',!!style2)},[style2]);
  useEffect(()=>{setLangGlobal(lang);document.documentElement.lang=lang},[lang]);
  useEffect(()=>{bumpReloadSeed()},[]);
  const setTheme=v=>setThemeS(v);
  const isDarkNow=!!night||theme==='dark';
  const[themePick,setThemePick]=useState(false);
  const themeCur=night?'dim':(theme==='dark'?'dark':'light');
  const applyThemeMode=mode=>{
    if(mode==='dim'){setNight(true);setTheme('dark')}
    else if(mode==='dark'){setNight(false);setTheme('dark')}
    else{setNight(false);setTheme('light')}
    setThemePick(false);
  };
  const toggleTheme=()=>setThemePick(true);
  const setLang=v=>{setLangGlobal(v);setLangS(v)};
  const[onboardDone,setOnboardDone]=useState(()=>!!getS('apk_onboard_done',false));
  const finishOnboard=({lang:l,theme:th,exp,style2:s2,country:co})=>{
    setLang(l);setTheme(th);setStyle2(!!s2);setExpMode(!s2);
    if(co){setCountry(co);setS('apk_country',co)}
    setS('apk_onboard_done',true);setOnboardDone(true);
  };

  const ensureAudioGraph=(el)=>{
    try{
      if(!ctxRef.current){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return false;
        ctxRef.current=new AC();
        const filters=EQ_FREQS.map(f=>{
          const b=ctxRef.current.createBiquadFilter();
          b.type='peaking';b.frequency.value=f;b.Q.value=1.4;b.gain.value=0;
          return b;
        });
        filtersRef.current=filters;
        const gain=ctxRef.current.createGain();
        gain.gain.value=volume;
        gainRef.current=gain;
        for(let i=1;i<filters.length;i++)filters[i-1].connect(filters[i]);
        filters[filters.length-1].connect(gain);
        gain.connect(ctxRef.current.destination);
      }
      if(ctxRef.current.state==='suspended')ctxRef.current.resume();
      try{sourceRef.current&&sourceRef.current.disconnect()}catch (e40){}
      const src=ctxRef.current.createMediaElementSource(el);
      sourceRef.current=src;
      src.connect(filtersRef.current[0]);
      wiredRef.current=true;
      if(filtersRef.current)filtersRef.current.forEach((f,i)=>{f.gain.value=eqOn?bands[i]:0});
      if(gainRef.current)gainRef.current.gain.value=volume;
      return true;
    }catch(err){console.warn('Audio graph',err);return false}
  };

  useEffect(()=>{
    if(!filtersRef.current)return;
    filtersRef.current.forEach((f,i)=>{f.gain.value=eqOn?bands[i]:0});
  },[eqOn,bands]);
  useEffect(()=>{if(gainRef.current)gainRef.current.gain.value=volume},[volume]);

  useEffect(()=>{
    const a=audio.current;if(!a)return;
    const onTime=()=>{setProgress(a.currentTime||0);setDuration(a.duration||0)};
    const onEnd=()=>{
      setPlaying(false);
      const list=queueRef.current;const idx=qIdxRef.current;
      if(list.length){const ni=(idx+1)%list.length;setTimeout(()=>playAt(list,ni),50)}
    };
    a.addEventListener('timeupdate',onTime);
    a.addEventListener('ended',onEnd);
    a.addEventListener('loadedmetadata',onTime);
    return()=>{a.removeEventListener('timeupdate',onTime);a.removeEventListener('ended',onEnd);a.removeEventListener('loadedmetadata',onTime)};
  },[track]);

  const setEqOn=v=>{setEqOnS(v);setS('apk_eq_on',v)};
  const setBand=(i,val)=>{setBands(prev=>{const n=[...prev];n[i]=val;setS('apk_eq_bands',n);return n})};
  const setVolume=v=>{setVolumeS(v);setS('apk_volume',v);if(audio.current&&!gainRef.current)audio.current.volume=v};

  const toggle=app=>{
    if(!app||app.trackId==null)return;
    const id=String(app.trackId);
    setFavs(prev=>{
      const base=Array.isArray(prev)?prev:loadFavs();
      const exists=base.some(f=>String(f.trackId)===id);
      const n=exists?base.filter(f=>String(f.trackId)!==id):[...base,slimApp(app)];
      saveFavs(n);
      return n;
    });
  };
  const toggleSongFav=song=>{
    if(!song||song.trackId==null)return;
    setSongFavs(prev=>{
      const base=Array.isArray(prev)?prev:loadSongFavs();
      const e=base.some(f=>String(f.trackId)===String(song.trackId));
      const n=e?base.filter(f=>String(f.trackId)!==String(song.trackId)):[...base,slimSong(song)];
      saveSongFavs(n);
      return n;
    });
  };
  const isSongFav=track&&songFavs.some(f=>String(f.trackId)===String(track.trackId));
  const open=app=>nav(`/app/${app.trackId}`);
  const openInstall=app=>nav(`/app/${app.trackId}?install=1`);

  const playAt=(list,idx)=>{
    const song=list[idx];if(!song||!song.previewUrl)return;
    if(audio.current){try{audio.current.pause()}catch (e41){}audio.current=null}
    const a=new Audio(song.previewUrl);
    a.preload='auto';
    a.volume=typeof volume==='number'?volume:1;
    a.crossOrigin='anonymous';
    audio.current=a;
    wiredRef.current=false;
    sourceRef.current=null;
    const start=()=>{
      setTrack(song);setQueue(list);setQIdx(idx);setPlaying(true);setProgress(0);setDuration(song.duration||0);
      // Only wire Web Audio EQ when enabled — otherwise keep normal element playback (avoids silence from CORS)
      if(eqOn){try{ensureAudioGraph(a)}catch (e42){}}
    };
    const tryPlay=()=>a.play().then(start).catch(()=>{
      // Retry without crossOrigin if stream blocks
      try{a.crossOrigin=null}catch (e43){}
      a.play().then(start).catch(()=>{setTrack(song);setQueue(list);setQIdx(idx);setPlaying(false)});
    });
    tryPlay();
  };
  const play=song=>{
    // when playing from music list without full queue, use single-item queue
    playAt([song],0);
  };
  const playFromList=(song,list)=>{
    const idx=list.findIndex(s=>s.trackId===song.trackId);
    playAt(list,idx>=0?idx:0);
  };
  const togglePlay=()=>{
    if(!audio.current)return;
    if(playing){audio.current.pause();setPlaying(false)}
    else{audio.current.play().then(()=>{if(_optionalChain([ctxRef, 'access', _24 => _24.current, 'optionalAccess', _25 => _25.state])==='suspended')ctxRef.current.resume();setPlaying(true)}).catch(()=>{})}
  };
  const playNext=()=>{
    if(!queue.length)return;
    const ni=(qIdx+1)%queue.length;
    playAt(queue,ni);
  };
  const playPrev=()=>{
    if(!queue.length)return;
    if(progress>3){if(audio.current)audio.current.currentTime=0;return}
    const pi=(qIdx-1+queue.length)%queue.length;
    playAt(queue,pi);
  };
  const seekTo=t=>{if(audio.current&&isFinite(t)){audio.current.currentTime=t;setProgress(t)}};
  const closeP=()=>{if(audio.current){audio.current.pause();audio.current=null}setTrack(null);setPlaying(false);setProgress(0);setDuration(0)};

  const isDetail=route.startsWith('/app/');
  const isDownloads=route==='/downloads';
  const hideMini=route==='/now-playing'||route==='/equalizer'||isDownloads||route==='/settings'||route==='/search-log';
  let page=null;
  if(route==='/'||route==='')page=React.createElement(Home, { nav: nav, open: open, openInstall: openInstall,});
  else if(route==='/games')page=React.createElement(Games, { open: open,});
  else if(route==='/search-log')page=React.createElement(SearchLogPage, { nav: nav,});
  else if(route==='/search'||route.startsWith('/search?')){const q=new URLSearchParams(route.split('?')[1]||'').get('q')||'';page=React.createElement(Search, { nav: nav, open: open, initQ: q, photo: profile&&profile.photo, onOpenAccount: ()=>setAccOpen(true),})}
  else if(isDetail){const _p=route.split('?');const _id=(_p[0].split('/')[2]||'');const _qi=new URLSearchParams(_p[1]||'').get('install')==='1';page=React.createElement(Detail, { id: _id, nav: nav, favs: favs, toggle: toggle, selStore: selStore, expMode: expMode, setDetailApp: setDetailApp, autoInstall: _qi, onToggleTheme: toggleTheme, isDark: isDarkNow,})}
  else if(route==='/favorites')page=React.createElement(Favs, { favs: favs, songFavs: songFavs, open: open, toggle: toggle, toggleSongFav: toggleSongFav, play: playFromList,});
  else if(route==='/downloads')page=React.createElement(DownloadsManager, { open: open,});
  else if(route==='/music')page=React.createElement(Music, { play: playFromList,});
  else if(route==='/now-playing')page=React.createElement(NowPlaying, { track: track, playing: playing, progress: progress, duration: duration, onToggle: togglePlay, onPrev: playPrev, onNext: playNext, onSeek: seekTo, onFav: toggleSongFav, isFav: isSongFav, nav: nav,});
  else if(route==='/equalizer')page=React.createElement(EqualizerPage, { eqOn: eqOn, setEqOn: setEqOn, bands: bands, setBand: setBand, volume: volume, setVolume: setVolume, nav: nav,});
  else if(route==='/settings')page=React.createElement(Settings, { selStore: selStore, setSelStore: setSelStore, style2: style2, setStyle2: setStyle2, setExpMode: setExpMode, lang: lang, setLang: setLang, night: night, setNight: setNight, nav: nav,});
  else if(route.startsWith('/category/'))page=React.createElement(Category, { genre: route.split('/')[2], open: open,});
  else page=React.createElement(Home, { nav: nav, open: open, openInstall: openInstall,});

  const showS=!route.startsWith('/search')&&!isDetail&&route!=='/now-playing'&&route!=='/equalizer'&&!isDownloads;

  useEffect(()=>{
    const el=document.getElementById('app-scroll');
    if(el)el.scrollTop=0;
  },[route]);

  if(!onboardDone)return React.createElement(OnboardFlow, { onFinish: finishOnboard, setLang: setLang, setTheme: setTheme, setExpMode: setExpMode, setStyle2: setStyle2,});
  if(isBlockedCountry(country))return React.createElement(CountryBlock, { country: country, setCountry: setCountry, lang: lang,});

  return(
    React.createElement('div', { className: "app-shell", key: lang,}
      , React.createElement(AccountHub, { open: accOpen, onClose: ()=>setAccOpen(false), nav: nav, theme: theme, setTheme: setTheme, profile: profile, setProfile: setProfile, lang: lang, night: night, setNight: setNight,})
      , React.createElement(AccPick, { open: themePick, title: t('choose_theme'), onClose: ()=>setThemePick(false),}
        , [{id:'light',label:t('light')},{id:'dark',label:t('dark')},{id:'dim',label:t('theme_dim')}].map(it=>(
          React.createElement('button', { key: it.id, type: "button", className: `acc-pick-item ${themeCur===it.id?'on':''}`, onClick: ()=>applyThemeMode(it.id),}
            , React.createElement('span', null, it.label)
            , themeCur===it.id&&React.createElement('span', { style: {marginInlineStart:'auto'},}, "✓")
          )
        ))
      )
      , React.createElement('main', { id: "app-scroll", className: "app-main max-w-screen-2xl mx-auto w-full"   ,}
        , !(isDownloads||route==='/settings'||route==='/search-log'||accOpen||isDetail||route.startsWith('/search'))&&React.createElement(TopNav, { nav: nav, isDetail: isDetail, onOpenAccount: ()=>setAccOpen(true), route: route, photo: profile&&profile.photo,})
        , React.createElement('div', { className: "app-scroll-fill",}, page)
      )
      , !hideMini&&React.createElement(MiniPlayer, { track: track, playing: playing, progress: progress, duration: duration, onToggle: togglePlay, onClose: closeP, onPrev: playPrev, onNext: playNext, onSeek: seekTo, onOpen: ()=>nav('/now-playing'), isFav: isSongFav, onFav: toggleSongFav,})
      , !(isDownloads||route==='/settings'||route==='/search-log'||accOpen)&&React.createElement(BottomNav, { route: route, nav: nav,})
      , offOpen&&(
        React.createElement('div', { className: "off-layer", role: "dialog", 'aria-modal': "true",}
          , React.createElement('div', { className: "off-sheet",}
            , React.createElement('div', { className: "off-badge",}
              , React.createElement('svg', { viewBox: "0 0 24 24"   , width: "34", height: "34", 'aria-hidden': "true",}, React.createElement('path', { fill: "#8ab4f8", d: "M12 6c3.3 0 6.2 1.3 8.4 3.4l1.4-1.4C19.4 5.6 15.9 4 12 4S4.6 5.6 2.2 8l1.4 1.4C5.8 7.3 8.7 6 12 6zm0 4c2.2 0 4.2.9 5.6 2.3l1.4-1.4C17.1 9 14.7 8 12 8s-5.1 1-7 2.9l1.4 1.4C7.8 10.9 9.8 10 12 10zm0 4c1.1 0 2.1.4 2.8 1.2L12 18l-2.8-2.8C9.9 14.4 10.9 14 12 14z"                                                 ,}), React.createElement('path', { fill: "#f28b82", d: "M3.3 3.3L2 4.6 6.2 8.8C4.7 9.8 3.4 11.1 2.2 12.6l1.4 1.4c1-.1.2 0 0 0z"             , opacity: "0",}), React.createElement('path', { fill: "#e8eaed", d: "M2.1 3.5l1.4-1.4 18.4 18.4-1.4 1.4z"    ,}))
              , React.createElement('span', { className: "off-emoji",}, "🤔")
            )
            , React.createElement('div', { className: "off-title",}, _lang==='ar'?'أنت غير متصل بالإنترنت':'You are offline')
            , React.createElement('div', { className: "off-sub",}, _lang==='ar'?'بعض الميزات غير متوفرة.':'Some features are unavailable.')
            , React.createElement('div', { className: "off-actions",}
              , React.createElement('button', { type: "button", className: "off-retry", onClick: retryNet, disabled: offBusy,}, offBusy?(_lang==='ar'?'جارٍ التحقق…':'Checking…'):(_lang==='ar'?'إعادة المحاولة':'Retry'))
              , React.createElement('button', { type: "button", className: "off-cancel", onClick: ()=>setOffOpen(false),}, _lang==='ar'?'إلغاء':'Cancel')
            )
          )
        )
      )
    )
  );
}

class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null}}
  static getDerivedStateFromError(e){return{err:e}}
  componentDidCatch(e,i){console.error('UI error',e,i)}
  render(){
    if(this.state.err)return(
      React.createElement('div', { style: {padding:24,fontFamily:'sans-serif'},}
        , React.createElement('h2', { style: {margin:'0 0 8px'},}, "حدث خطأ في العرض"   )
        , React.createElement('p', { style: {color:'#666',fontSize:14},}, String(this.state.err&&this.state.err.message||this.state.err))
        , React.createElement('button', { type: "button", onClick: ()=>{this.setState({err:null});location.hash='#/'}, style: {marginTop:12,padding:'10px 16px',borderRadius:10,border:'none',background:'#02C57A',color:'#fff'},}, "العودة للرئيسية" )
      )
    );
    return this.props.children;
  }
}
_bootStore().then(()=>{ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App, null)));}).catch(()=>{ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App, null)));});
