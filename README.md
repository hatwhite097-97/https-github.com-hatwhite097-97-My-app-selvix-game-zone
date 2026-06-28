<p align="center">
  <img src="https://cdn.phototourl.com/member/2026-06-26-c8b3db6d-a763-4ee2-b235-16a7d6d70717.png" alt="Selvix Game Zone Logo" width="220px" style="border-radius: 16px; box-shadow: 0px 4px 20px rgba(0,0,0,0.5);"/>
</p>

<h1 align="center">🎮 Selvix Game Zone PWA 🚀</h1>

<p align="center">
  <strong>Jukwaa la Kimapinduzi la Michezo, Mialiko, na Jamii ya Gamers nchini Tanzania — Sasa ikiwa kama Web App (PWA) ya Kisasa!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%2F%20Android%20WebView-blue?style=for-the-badge&logo=javascript&logoColor=white" alt="Web" />
  <img src="https://img.shields.io/badge/Backend-Appwrite-FD366E?style=for-the-badge&logo=appwrite&logoColor=white" alt="Appwrite" />
  <img src="https://img.shields.io/badge/PWA-Progressive%20Web%20App-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Design-Glassmorphism%20%26%20Gradients-000000?style=for-the-badge" alt="Glassmorphism" />
</p>

---

## 📝 Utangulizi (Introduction)

**Selvix Game Zone PWA** ni toleo jipya na la kisasa la web application ambalo limebadilishwa kikamilifu kutoka Kotlin Android kwenda **HTML5, CSS3, JavaScript (ES6+), na Appwrite kama Backend-as-a-Service (BaaS)**.

Toleo hili limejengwa kama **Progressive Web App (PWA)** thabiti ambalo linafanya kazi offline kwa kutumia Service Worker na Cache Storage, na pia limeunganishwa kama WebView ndani ya Android App ili kutoa uzoefu uleule wa asili wa simu (native app feel).

---

## ✨ Folder Structure (Muundo wa Faili)

Mradi umepangwa kwa makini sana ili kurahisisha matengenezo na upelelekaji (deployment):

```
/
├── index.html                   # Ukurasa mkuu wa Single Page Application (SPA)
├── manifest.json                # PWA configuration ya kuwezesha install kwenye simu
├── service-worker.js            # Service worker wa kushughulikia cache na offline mode
├── css/
│   └── style.css                # Muonekano wa kisasa (neon lights, glassmorphism, responsive)
├── js/
│   ├── database.js              # Local database engine kwa kutumia localStorage (Room Fallback)
│   ├── appwrite-client.js       # Appwrite integration client (Auth, Database, Storage)
│   └── app.js                   # SPA Engine, Routing, na UI View controllers
├── appwrite/
│   └── functions/
│       └── speedpesa-integration/
│           └── index.js         # Secure backend functions za SpeedPesa APIs
└── app/                         # Android WebView Wrapper (kwa ajili ya kutengeneza APK)
    └── src/main/assets/         # Nakala ya faili zote za web kwa ajili ya kufanya kazi offline ndani ya simu
```

---

## ✨ Vipengele Kuu vya Programu (Core Features)

### 🎮 1. Soko la Michezo (Game Store)
* **Aina Tofauti za Michezo**: Vinjari na pakua michezo ya **PC**, **Emulator**, na **Mobile**.
* **Michezo ya Bure & Kulipia**: Pakua michezo ya bure au nunua michezo ya premium.
* **Maelezo ya Kina**: Kurasa zenye maelezo ya picha, saizi, mahitaji ya kifaa, na download link salama.

### 💳 2. Mfumo wa Malipo (SpeedPesa Integration via Appwrite Functions)
* **Ulinzi wa API Keys**: Api keys zote za SpeedPesa zimefichwa upande wa server kwenye **Appwrite Functions** ili kuzuia wizi wa data na salio.
* **Vipengele vya SpeedPesa**:
  * **Collection API**: Kupokea malipo kutoka kwa wateja (M-Pesa/Tigo/Airtel).
  * **Transaction Status API**: Kuhakiki kama muamala umefanikiwa au umeshindwa.
  * **Disbursement API**: Kutuma pesa kiotomatiki kwenda kwa watumiaji pindi wanapotoa.
  * **Balance Check API**: Angalia salio la akaunti ya mfanyabiashara.

### 💸 3. Mfumo wa Kutoa Pesa (Withdrawal)
* **Kutoa Salio**: Badilisha Coins zako kuwa fedha taslimu kwa kutoa kuanzia **TZS 3,000**.
* **Uhakiki wa Haraka**: Maombi ya kutoa yanahifadhiwa kwenye database na yanasubiri uhakiki wa Admin kwenye dashboard yake.

### 💬 4. Vyumba vya Gumzo (Social Chat Rooms)
* Chati na marafiki kwa wakati mmoja kwenye vyumba vya **FIFA**, **GTA V**, **Call of Duty**, na **Chat Kuu**.

### 🎁 5. Zawadi za Kila Siku (Daily Rewards)
* Fungua boksi la zawadi kila baada ya masaa 24 upate kuanzia **Coins 100 hadi 500** bure kabisa!

---

## 🛡️ Admin Panel (Usimamizi wa Mfumo)

Admin ana uwezo wa kusimamia mifumo yote kupitia jopo maalum la udhibiti:
1. **Analytics**: Tazama jumla ya mapato, maombi yanayosubiri, na idadi ya watumiaji.
2. **System Controls**: Washa au zima mfumo wa mialiko na utoaji wa fedha kwa kubonyeza kitufe kimoja.
3. **Withdrawal Requests**: Pitisha au kataa maombi ya watumiaji ya kutoa fedha.
4. **User Management**: Angalia taarifa za watumiaji na kuongeza salio au kum-mute mtumiaji asichat.
5. **Appwrite Cloud Connector**: Fomu ya kuunganisha na wingu lako la Appwrite moja kwa moja bila kuandika code upya!

---

## 🏃 Jinsi ya Kuendesha na Ku-deploy (Deployment Guide)

### 1. Kuendesha Kwenye Simu (Android WebView)
Mradi una Android wrapper iliyojengwa tayari. Folda ya `/app/src/main/assets` inabeba toleo kamili la web ili kuhakikisha app inafunguka kwa haraka na inafanya kazi hata bila mtandao (offline-first).
* Bonyeza **Compile** au tumia Gradle kutengeneza APK yako mpya kwa sekunde chache!

### 2. Kujenga kwenye Appwrite Cloud
1. Fungua akaunti yako ya **Appwrite Cloud** (https://cloud.appwrite.io).
2. Tengeneza Project mpya na upe jina la **Selvix Game Zone**.
3. Nenda kwenye sehemu ya **Databases** na tengeneza database iitwayo `selvix_db`.
4. Ndani yake, tengeneza Collections zifuatazo:
   * `users`
   * `games`
   * `transactions`
   * `chats`
   * `settings`
5. Pakia code za upande wa server zilizopo kwenye folda ya `/appwrite/functions/speedpesa-integration/` kwenda kwenye Appwrite Functions ili kuwasha mifumo ya kifedha ya SpeedPesa.

---

<p align="center">
  Imeundwa kwa upendo na ustadi wa hali ya juu kwa ajili ya Gamers wote wa Tanzania! 🇹🇿✨<br/>
  <strong>Selvix Game Zone — Jumba la Mabingwa wa Michezo!</strong>
</p>
