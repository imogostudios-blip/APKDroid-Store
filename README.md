# APKDroid

نسخة تفتح من الكاش بدون إنترنت، بنفس الشكل.

ما تغيّر:
- React وReactDOM محليان في vendor/
- app.jsx يُترجم مسبقاً إلى src/app.js، بدون Babel في المتصفح
- Tailwind مبني في src/styles/tailwind.css بدل سكربت CDN
- خطوط Inter وRoboto اللاتينية في res/fonts/
- Service Worker apkdroid-v6 يخزّن كل غلاف التطبيق

src/app.jsx بقي مصدراً للتعديل. بعد أي تعديل على الواجهة أعد بناء app.js وtailwind.css.

البحث والتنزيل من المتاجر ما زال يحتاج نت.

## التشغيل

python3 -m http.server 8080

ثم افتح http://localhost:8080 مرة وأنت متصل حتى يُثبَّت Service Worker. بعدها يفتح بدون نت.
