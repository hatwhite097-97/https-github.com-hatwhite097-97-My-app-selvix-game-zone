// Selvix Game Zone - Main Application Client Controller (SPA Engine)

class SelvixApp {
  constructor() {
    this.currentView = 'splash';
    this.activeTab = 'games'; // user home tab: games, chat, rewards, settings, withdrawals
    this.chatRoom = 'Chat Kuu'; // chat rooms: FIFA, GTA V, Call of Duty, Chat Kuu
    this.activeCategoryFilter = 'ZOTE'; // categories: ZOTE, PC GAME, EMULATOR GAME, MOBILE GAME
    this.selectedGame = null;
    this.activeUserChat = null; // admin chatting with specific user
    this.notifications = [];
    this.paymentProgress = "";
    this.paymentStatus = "";

    // Extract & save referral parameter if present in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('referredBy');
    if (refParam) {
      localStorage.setItem('selvix_temp_ref', refParam.trim().toLowerCase());
    }

    this.applyTheme();
    this.bindEvents();
    this.start();
  }

  applyTheme() {
    const theme = window.db.getActiveTheme();
    document.body.classList.remove('theme-cyberpunk', 'theme-light', 'theme-orange');
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else if (theme === 'orange') {
      document.body.classList.add('theme-orange');
    } else {
      document.body.classList.add('theme-cyberpunk');
    }
  }

  start() {
    this.showView('splash');
    let percent = 0;
    const interval = setInterval(() => {
      percent += 5;
      const progressEl = document.getElementById('splash-progress');
      const percentEl = document.getElementById('splash-percentage');
      if (progressEl) progressEl.style.width = percent + '%';
      if (percentEl) percentEl.textContent = percent + '%';
      
      if (percent >= 100) {
        clearInterval(interval);
        const currentUser = window.db.getCurrentUser();
        if (currentUser) {
          if (currentUser.isAdmin) {
            this.showView('admin-dashboard');
          } else {
            this.showView('user-home');
          }
        } else {
          this.showView('login');
        }
      }
    }, 70); // 70ms * 20 = 1.4s total load time
  }

  bindEvents() {
    // Add global event listeners or delegate actions dynamically
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const act = action.getAttribute('data-action');
      const param = action.getAttribute('data-param');
      
      this.handleAction(act, param, e);
    });
  }

  handleAction(action, param, event) {
    if (event) event.preventDefault();

    switch (action) {
      case 'nav':
        this.showView(param);
        break;
      case 'set-tab':
        this.activeTab = param;
        this.render();
        break;
      case 'change-theme':
        window.db.setActiveTheme(param);
        this.applyTheme();
        this.render();
        break;
      case 'google-login':
        this.handleGoogleLogin();
        break;
      case 'filter-category':
        this.activeCategoryFilter = param;
        this.renderTabContent();
        break;
      case 'set-chat-room':
        this.chatRoom = param;
        this.renderChatRoom();
        break;
      case 'logout':
        window.appwrite.logout();
        this.showView('login');
        break;
      case 'view-game':
        this.selectedGame = window.db.getGame(param);
        this.showView('game-details');
        break;
      case 'back-home':
        this.selectedGame = null;
        this.showView('user-home');
        break;
      case 'claim-reward':
        this.handleClaimReward();
        break;
      case 'send-chat':
        this.handleSendChat();
        break;
      case 'buy-coins':
        this.handleBuyWithCoins();
        break;
      case 'buy-speedpesa':
        this.handleBuyWithSpeedPesa();
        break;
      case 'request-withdrawal':
        this.handleWithdrawalRequest();
        break;
      case 'admin-approve-wd':
        this.handleApproveWithdrawal(param);
        break;
      case 'admin-reject-wd':
        this.handleRejectWithdrawal(param);
        break;
      case 'admin-toggle-referral':
        this.handleToggleSetting('isReferralActive');
        break;
      case 'admin-toggle-withdrawal':
        this.handleToggleSetting('isWithdrawalActive');
        break;
      case 'admin-delete-game':
        this.handleDeleteGame(param);
        break;
      case 'admin-upload-game':
        this.handleUploadGame();
        break;
      case 'admin-edit-user':
        this.handleEditUser(param);
        break;
      case 'admin-delete-chat':
        this.handleDeleteChat(param);
        break;
      case 'update-profile':
        this.handleUpdateProfile();
        break;
      case 'copy-referral-link':
        this.handleCopyReferralLink();
        break;
      case 'save-appwrite':
        this.handleSaveAppwriteConfig();
        break;
    }
  }

  showView(viewName) {
    this.currentView = viewName;
    if (['splash', 'login', 'register', 'forgot-password'].includes(viewName)) {
      document.body.classList.add('auth-view');
    } else {
      document.body.classList.remove('auth-view');
    }
    this.render();
  }

  togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    }
  }

  addNotification(msg) {
    this.notifications.unshift({ msg, date: new Date().toLocaleTimeString() });
    this.renderNotificationsList();
  }

  async handleGoogleLogin() {
    if (window.appwrite.isActive) {
      try {
        await window.appwrite.loginWithGoogle();
      } catch (err) {
        alert("Google Sign-In imefeli: " + err.message);
      }
    } else {
      alert("Ili kucheza na kuingia kwa kutumia Google, lazima uunganishe na uweke maelezo ya akaunti yako ya Supadatabase. Unaweza kuomba nikuwekee kwa kunipatia API URL na Anon Key kwenye soga ya AI Studio!");
    }
  }

  // --- Auth Handlers ---
  async handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const referredBy = document.getElementById('reg-referredby').value.trim().toLowerCase();

    // Validations
    const nameTokens = fullName.split(/\s+/);
    if (nameTokens.length !== 3) {
      alert("Majina yanatakiwa kuwa matatu kamili (mfn: John Joseph Deo).");
      return;
    }

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      alert("Namba ya simu lazima iwe na tarakimu 9 na ianze na 7 au 6 baada ya +255.");
      return;
    }

    if (referredBy && referredBy === username) {
      alert("Huwezi kutumia username yako kama mualikaji wako!");
      return;
    }

    if (referredBy) {
      const referrer = window.db.getUser(referredBy);
      if (!referrer) {
        alert("Mtumiaji aliyekualika (@" + referredBy + ") hayupo! Hakikisha username yake ni sahihi.");
        return;
      }
    }

    try {
      const email = username + "@selvix.com"; // dummy email for appwrite compatibility
      const user = await window.appwrite.register(username, email, password, fullName, phone, referredBy);
      this.addNotification("Karibu Selvix Game Zone, " + user.fullName + "!");
      this.showView('user-home');
    } catch (err) {
      alert(err.message);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    try {
      const user = await window.appwrite.login(username, password);
      this.addNotification("Karibu tena, " + user.fullName + "!");
      if (user.isAdmin) {
        this.showView('admin-dashboard');
      } else {
        this.showView('user-home');
      }
    } catch (err) {
      alert(err.message);
    }
  }

  // --- Claim Reward Handlers ---
  handleClaimReward() {
    const user = window.db.getCurrentUser();
    if (!user) return;

    const today = new Date().toDateString();
    if (user.lastRewardClaimedDate === today) {
      alert("Tayari umeshachukua zawadi yako leo! Rudi tena kesho.");
      return;
    }

    // Calculate streak
    let newStreak = (user.streakCount || 0) + 1;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (user.lastRewardClaimedDate !== yesterday && user.lastRewardClaimedDate !== "") {
      newStreak = 1; // broken streak
    }

    const rewardAmount = Math.min(100.0 + (newStreak - 1) * 50.0, 500.0);
    user.pointsBalance = (user.pointsBalance || 0) + rewardAmount;
    user.lastRewardClaimedDate = today;
    user.streakCount = newStreak;

    window.db.updateUser(user);
    this.addNotification("Umejipatia TZS " + rewardAmount + " ya zawadi!");
    
    // Animate box open
    const giftBox = document.getElementById('gift-box');
    if (giftBox) {
      giftBox.classList.remove('gift-box-animate');
      giftBox.innerHTML = `
        <div class="text-64px mb-4 text-glow-magenta"><i class="fa-solid fa-box-open text-7xl text-pink-500"></i></div>
        <p class="text-xl text-pink-400 font-bold">ZAWADI IMEMWAGIKA!</p>
        <p class="text-3xl text-yellow-400 font-extrabold mt-2 text-glow-cyan">+ TZS ${rewardAmount}</p>
        <p class="text-sm text-gray-400 mt-1">Streak yako: Siku ${newStreak}</p>
      `;
    }

    setTimeout(() => this.render(), 3000);
  }

  // --- Chat Handlers ---
  handleSendChat() {
    const user = window.db.getCurrentUser();
    if (!user) return;

    if (user.isBlockedFromChatting) {
      alert("Huruhusiwi kuchat kwa sasa (Muted na Admin).");
      return;
    }

    const input = document.getElementById('chat-input-field');
    const msg = input.value.trim();
    if (!msg) return;

    window.db.insertChatMessage({
      senderUsername: user.username,
      senderFullName: user.fullName,
      message: msg,
      isSocial: true,
      roomName: this.chatRoom
    });

    input.value = "";
    this.renderChatRoom();
  }

  // --- Purchase Handlers ---
  handleBuyWithCoins() {
    const user = window.db.getCurrentUser();
    const game = this.selectedGame;
    if (!user || !game) return;

    if (user.pointsBalance < game.price) {
      alert("Coins hazitoshi! Unahitaji TZS " + game.price + " ila una TZS " + user.pointsBalance + ".");
      return;
    }

    user.pointsBalance -= game.price;
    window.db.updateUser(user);

    // Record successful transaction
    window.db.insertTransaction({
      reference: "COIN-BUY-" + Date.now(),
      username: user.username,
      gameId: game.id,
      phonenumber: user.phoneNumber,
      amount: game.price,
      status: "SUCCESS"
    });

    this.addNotification("Mchezo wa " + game.title + " umenunuliwa kwa Coins!");
    alert("Hongera! Umefanikiwa kununua " + game.title + " kwa kutumia Coins.");
    this.showView('game-details');
  }

  handleBuyWithSpeedPesa() {
    const user = window.db.getCurrentUser();
    const game = this.selectedGame;
    if (!user || !game) return;

    const phoneInput = document.getElementById('speedpesa-phone');
    const phone = phoneInput ? phoneInput.value.trim() : user.phoneNumber;

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      alert("Weka namba sahihi ya simu ya tarakimu 9.");
      return;
    }

    const ref = "SP-" + Date.now();
    window.db.insertTransaction({
      reference: ref,
      username: user.username,
      gameId: game.id,
      phonenumber: "255" + phone,
      amount: game.price,
      status: "PENDING"
    });

    // Start payment simulation workflow
    this.paymentProgress = "Inatuma ombi la malipo SpeedPesa (Reference: " + ref + ")...";
    this.paymentStatus = "PENDING";
    this.renderPaymentProgressModal();

    setTimeout(() => {
      this.paymentProgress = "Ombi limepokelewa. Hakiki namba yako ya siri ya simu ili kuthibitisha malipo ya TZS " + game.price + "...";
      this.renderPaymentProgressModal();

      setTimeout(() => {
        // Mock successful verify
        this.paymentProgress = "Ujumbe kutoka SpeedPesa: Malipo ya TZS " + game.price + " yamehakikishwa! Inapakua sasa...";
        this.paymentStatus = "SUCCESS";
        this.renderPaymentProgressModal();

        window.db.updateTransactionStatus(ref, "SUCCESS");

        // Credit referral bonus if applicable
        if (game.price >= 5000.0 && user.referredBy) {
          const referrer = window.db.getUser(user.referredBy);
          if (referrer) {
            referrer.pointsBalance = (referrer.pointsBalance || 0) + 100.0;
            window.db.saveUser(referrer);
            window.db.insertTransaction({
              reference: "REF-BONUS-" + Date.now(),
              username: referrer.username,
              gameId: -2, // referral bonus indicator
              phonenumber: referrer.phoneNumber,
              amount: 100.0,
              status: "SUCCESS"
            });
          }
        }

        setTimeout(() => {
          this.closePaymentProgressModal();
          this.addNotification("Malipo ya " + game.title + " yamekamilika kwa ufanisi!");
          alert("Hongera! Malipo yako ya SpeedPesa yamehakikishwa. Download yako inaunganishwa sasa.");
          this.showView('game-details');
        }, 2000);

      }, 3500);

    }, 2000);
  }

  // --- Withdrawal Handlers ---
  handleWithdrawalRequest() {
    const user = window.db.getCurrentUser();
    const settings = window.db.getSettings();
    if (!user) return;

    if (!settings.isWithdrawalActive) {
      alert("Huduma ya kutoa fedha imefungwa kwa sasa na Admin.");
      return;
    }

    const amountInput = document.getElementById('wd-amount');
    const phoneInput = document.getElementById('wd-phone');
    const amount = parseFloat(amountInput.value);
    const phone = phoneInput.value.trim();

    if (isNaN(amount) || amount < 3000) {
      alert("Kiasi cha chini kabisa cha kutoa ni TZS 3,000.");
      return;
    }

    if (user.pointsBalance < amount) {
      alert("Coins hazitoshi kutoa kiasi hiki.");
      return;
    }

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      alert("Weka namba sahihi ya simu ya tarakimu 9.");
      return;
    }

    user.pointsBalance -= amount;
    window.db.updateUser(user);

    window.db.insertTransaction({
      reference: "WITHDRAW-" + Date.now(),
      username: user.username,
      gameId: -1, // withdrawal
      phonenumber: "255" + phone,
      amount: amount,
      status: "PENDING"
    });

    amountInput.value = "";
    this.addNotification("Ombi lako la kutoa TZS " + amount + " limewasilishwa.");
    alert("Ombi la kutoa pesa limepokelewa na linasubiri uhakiki wa Admin!");
    this.render();
  }

  // --- Admin Panel Handlers ---
  handleApproveWithdrawal(ref) {
    window.db.updateTransactionStatus(ref, 'SUCCESS');
    this.addNotification("Withdrawal imeidhinishwa: " + ref);
    this.render();
  }

  handleRejectWithdrawal(ref) {
    const tx = window.db.getTransaction(ref);
    if (tx && tx.status === 'PENDING') {
      window.db.updateTransactionStatus(ref, 'FAILED');
      
      // Refund user
      const user = window.db.getUser(tx.username);
      if (user) {
        user.pointsBalance = (user.pointsBalance || 0) + tx.amount;
        window.db.updateUser(user);
      }
      this.addNotification("Withdrawal imekataliwa: " + ref + " (Coins zimerudishwa)");
      this.render();
    }
  }

  handleToggleSetting(key) {
    const settings = window.db.getSettings();
    settings[key] = !settings[key];
    window.db.saveSettings(settings);
    this.addNotification("Mipangilio imebadilishwa.");
    this.render();
  }

  handleDeleteGame(id) {
    if (confirm("Je, una uhakika unataka kufuta mchezo huu?")) {
      window.db.deleteGame(id);
      this.addNotification("Mchezo ulifutwa.");
      this.render();
    }
  }

  handleUploadGame() {
    const title = document.getElementById('upload-title').value.trim();
    const cover = document.getElementById('upload-cover').value.trim();
    const category = document.getElementById('upload-category').value;
    const price = parseFloat(document.getElementById('upload-price').value || 0);
    const link = document.getElementById('upload-link').value.trim();
    const desc = document.getElementById('upload-desc').value.trim();

    if (!title || !cover || !link || !desc) {
      alert("Tafadhali jaza sehemu zote!");
      return;
    }

    window.db.insertGame({
      title,
      imageUrl: cover,
      category,
      isPaid: price > 0,
      price,
      downloadUrl: link,
      description: desc
    });

    this.addNotification("Mchezo mpya wa " + title + " umepakiwa!");
    alert("Mchezo umefanikiwa kuongezwa kwenye soko!");
    
    // Clear form
    document.getElementById('upload-title').value = "";
    document.getElementById('upload-cover').value = "";
    document.getElementById('upload-price').value = "0";
    document.getElementById('upload-link').value = "";
    document.getElementById('upload-desc').value = "";

    this.render();
  }

  handleEditUser(username) {
    const user = window.db.getUser(username);
    if (!user) return;

    const action = prompt(`Dhibiti Mtumiaji @${user.username}:\n1: Badili kuwa Admin\n2: Ondoa u-Admin\n3: Mute/Block kuchat\n4: Unmute kuchat\n5: Ongeza Salio la Coins\nAndika namba ya chaguo lako:`);
    
    if (action === "1") {
      user.isAdmin = true;
    } else if (action === "2") {
      user.isAdmin = false;
    } else if (action === "3") {
      user.isBlockedFromChatting = true;
    } else if (action === "4") {
      user.isBlockedFromChatting = false;
    } else if (action === "5") {
      const amt = parseFloat(prompt("Weka kiasi cha kuongeza (Coins/TZS):", "1000"));
      if (!isNaN(amt)) {
        user.pointsBalance = (user.pointsBalance || 0) + amt;
      }
    } else {
      return;
    }

    window.db.updateUser(user);
    this.addNotification("Wasifu wa " + user.fullName + " umesasishwa!");
    this.render();
  }

  handleDeleteChat(id) {
    if (confirm("Futa ujumbe huu wa mazungumzo?")) {
      window.db.deleteChatMessage(id);
      this.render();
    }
  }

  // --- Profile Handler ---
  handleUpdateProfile() {
    const user = window.db.getCurrentUser();
    if (!user) return;

    const fullName = document.getElementById('prof-fullname').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const password = document.getElementById('prof-password').value;

    const nameTokens = fullName.split(/\s+/);
    if (nameTokens.length !== 3) {
      alert("Majina yanatakiwa kuwa matatu kamili (mfn: John Joseph Deo).");
      return;
    }

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      alert("Namba ya simu lazima iwe na tarakimu 9.");
      return;
    }

    user.fullName = fullName;
    user.phoneNumber = phone;
    if (password) user.password = password;

    window.db.updateUser(user);
    this.addNotification("Wasifu wako umesasishwa kikamilifu.");
    alert("Wasifu wako umesasishwa vizuri!");
    this.render();
  }

  handleCopyReferralLink() {
    const user = window.db.getCurrentUser();
    if (!user) return;
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${user.username}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(refLink)
        .then(() => {
          alert("Kiungo chako cha mwaliko kimenakiliwa: " + refLink);
        })
        .catch(err => {
          alert("Imeshindwa kunakili: " + err.message);
        });
    } else {
      // Fallback for older browsers or insecure contexts
      const el = document.createElement('textarea');
      el.value = refLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert("Kiungo chako cha mwaliko kimenakiliwa: " + refLink);
    }
  }

  // --- Appwrite Configuration Save ---
  handleSaveAppwriteConfig() {
    const end = document.getElementById('cfg-endpoint').value.trim();
    const proj = document.getElementById('cfg-project').value.trim();
    const dbId = document.getElementById('cfg-dbid').value.trim();

    if (!proj) {
      alert("Tafadhali weka Project ID angalau!");
      return;
    }

    window.appwrite.updateConfig({
      endpoint: end || 'https://cloud.appwrite.io/v1',
      projectId: proj,
      databaseId: dbId || 'selvix_db'
    });
  }

  // --- RENDERING VIEWS ---
  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Reset view body
    root.innerHTML = '';

    if (this.currentView === 'splash') {
      root.innerHTML = this.getSplashHTML();
    } else if (this.currentView === 'register') {
      root.innerHTML = this.getRegisterHTML();
    } else if (this.currentView === 'login') {
      root.innerHTML = this.getLoginHTML();
    } else if (this.currentView === 'forgot-password') {
      root.innerHTML = this.getForgotPasswordHTML();
    } else if (this.currentView === 'user-home') {
      root.innerHTML = this.getUserHomeHTML();
      this.renderTabContent();
    } else if (this.currentView === 'game-details') {
      root.innerHTML = this.getGameDetailsHTML();
    } else if (this.currentView === 'admin-dashboard') {
      root.innerHTML = this.getAdminDashboardHTML();
    }
  }

  // --- HTML TEMPLATES ---
  getSplashHTML() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610] flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
        <!-- High-tech gaming glowing background grids -->
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent opacity-60"></div>
        <div class="absolute w-80 h-80 bg-[#ff5100]/25 rounded-full blur-[100px] top-[-10%] left-[-10%] animate-pulse"></div>
        <div class="absolute w-80 h-80 bg-[#ffaa00]/15 rounded-full blur-[100px] bottom-[-10%] right-[-10%] animate-pulse" style="animation-delay: 1.5s"></div>
        
        <!-- Animated Main Logo Container -->
        <div class="mb-8 relative z-10 flex flex-col items-center scale-105">
          <div class="relative p-1.5 rounded-[2.5rem] bg-gradient-to-tr from-[#ff5100] to-yellow-500 shadow-2xl animate-bounce" style="animation-duration: 4s">
            <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" 
                 alt="Selvix Logo" 
                 class="w-28 h-28 object-contain rounded-[2.2rem] bg-[#0c1224] p-2" />
          </div>
          <!-- Glowing brand name -->
          <h2 class="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-yellow-500 tracking-[0.25em] mt-5 uppercase text-glow-cyan">SELVIX</h2>
          <div class="text-[9px] text-[#ff5100] font-black tracking-[0.4em] uppercase mt-1">GAME ZONE ESPORTS</div>
        </div>

        <div class="relative z-10 w-full max-w-xs px-4">
          <h1 class="text-xs font-black uppercase text-gray-300 tracking-widest mb-2 animate-pulse">Inasoma rasilimali zote...</h1>
          <p class="text-[11px] text-gray-400 mb-6 font-medium leading-relaxed">Jukwaa la kipekee la kupakua michezo na kupata zawadi kubwa Tanzania!</p>

          <!-- Modern glowing progress container -->
          <div class="w-full bg-[#101730] rounded-full p-1 border border-gray-800/80 shadow-2xl">
            <div id="splash-progress" class="h-1.5 bg-gradient-to-r from-orange-600 via-[#ff5100] to-yellow-500 rounded-full transition-all duration-150 ease-out shadow-glow-cyan" style="width: 0%"></div>
          </div>
          <div class="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mt-2.5 uppercase tracking-widest" id="splash-percentage">0%</div>
        </div>

        <!-- Premium Footnote -->
        <div class="absolute bottom-8 left-0 right-0 text-[9px] text-gray-500 font-extrabold uppercase tracking-[0.2em] z-10">
          Mifumo Imesimbwa • <span class="text-orange-500">Supadatabase Cloud</span>
        </div>
      </div>
    `;
  }

  getRegisterHTML() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610] flex flex-col p-6 fade-in text-white relative">
        <!-- Decorative Blur BG -->
        <div class="absolute w-64 h-64 bg-[#ff5100]/10 rounded-full blur-[80px] top-[10%] right-[-10%]"></div>
        <div class="absolute w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] bottom-[10%] left-[-10%]"></div>

        <!-- Top Navigation -->
        <div class="flex items-center justify-between mb-8 relative z-10">
          <button data-action="nav" data-param="login" 
                  class="w-11 h-11 rounded-2xl bg-[#101730] hover:bg-[#182245] flex items-center justify-center border border-gray-800/80 transition duration-300 shadow-lg group">
            <i class="fa-solid fa-arrow-left text-[#ff5100] group-hover:scale-110 transition duration-300"></i>
          </button>
          <div class="text-[9px] font-black bg-[#101730] px-4 py-2.5 rounded-full uppercase tracking-[0.15em] border border-gray-800/80 shadow-md text-glow-cyan text-orange-500">
            JISAJILI SASA
          </div>
        </div>

        <!-- Form container with glass card -->
        <div class="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 pb-12">
          <div class="flex flex-col items-center mb-6">
            <div class="p-1 rounded-2xl bg-gradient-to-tr from-orange-500 to-yellow-500 shadow-xl mb-3">
              <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" 
                   alt="Selvix Logo" 
                   class="w-14 h-14 object-contain rounded-xl bg-[#0c1224] p-1" />
            </div>
            <h2 class="text-xl font-black uppercase tracking-wider text-white">Unda Akaunti Mpya</h2>
            <p class="text-[11px] text-gray-400 mt-1 text-center">Fungua fursa ya kucheza na kushinda zawadi papo hapo!</p>
          </div>

          <form onsubmit="app.handleRegister(event)" class="space-y-3">
            <!-- Full Name Input -->
            <div class="relative bg-[#101730] rounded-2xl p-3 shadow-inner flex items-center gap-3 border border-gray-800/80 focus-within:border-orange-500/50 transition duration-300">
              <div class="flex items-center justify-center text-orange-500 text-base w-5">
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Majina Matatu Kamili</span>
                <input type="text" id="reg-fullname" placeholder="John Joseph Doe" required
                       class="w-full bg-transparent text-white text-xs font-bold placeholder-gray-600 focus:outline-none mt-0.5" />
              </div>
            </div>

            <!-- Username Input -->
            <div class="relative bg-[#101730] rounded-2xl p-3 shadow-inner flex items-center gap-3 border border-gray-800/80 focus-within:border-orange-500/50 transition duration-300">
              <div class="flex items-center justify-center text-orange-500 text-base w-5">
                <i class="fa-solid fa-at"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Username</span>
                <input type="text" id="reg-username" placeholder="salehe99" required
                       class="w-full bg-transparent text-white text-xs font-bold placeholder-gray-600 focus:outline-none mt-0.5" />
              </div>
            </div>

            <!-- Phone Number Input -->
            <div class="relative bg-[#101730] rounded-2xl p-3 shadow-inner flex items-center gap-3 border border-gray-800/80 focus-within:border-orange-500/50 transition duration-300">
              <div class="flex items-center justify-center text-orange-500 text-base w-5">
                <i class="fa-solid fa-phone"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Namba ya Simu (+255)</span>
                <div class="flex items-center mt-0.5">
                  <span class="text-white text-xs font-bold mr-1.5">+255</span>
                  <input type="tel" id="reg-phone" placeholder="750020767" required
                         class="w-full bg-transparent text-white text-xs font-bold placeholder-gray-600 focus:outline-none" />
                </div>
              </div>
            </div>

            <!-- Password Input -->
            <div class="relative bg-[#101730] rounded-2xl p-3 shadow-inner flex items-center gap-3 border border-gray-800/80 focus-within:border-orange-500/50 transition duration-300">
              <div class="flex items-center justify-center text-orange-500 text-base w-5">
                <i class="fa-solid fa-lock"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Neno la Siri (Password)</span>
                <input type="password" id="reg-password" placeholder="******" required
                       class="w-full bg-transparent text-white text-xs font-bold placeholder-gray-600 focus:outline-none mt-0.5" />
              </div>
              <button type="button" onclick="app.togglePasswordVisibility('reg-password', this)" class="text-gray-500 hover:text-white transition w-5">
                <i class="fa-solid fa-eye-slash"></i>
              </button>
            </div>

            <!-- Referred By Input (Optional) -->
            <div class="relative bg-[#101730] rounded-2xl p-3 shadow-inner flex items-center gap-3 border border-gray-800/80 ${localStorage.getItem('selvix_temp_ref') ? 'border-green-500/50' : 'focus-within:border-orange-500/50'} transition duration-300">
              <div class="flex items-center justify-center ${localStorage.getItem('selvix_temp_ref') ? 'text-green-400' : 'text-orange-500'} text-base w-5">
                <i class="fa-solid fa-user-plus"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[8px] ${localStorage.getItem('selvix_temp_ref') ? 'text-green-400 font-extrabold' : 'text-gray-500 font-bold'} uppercase tracking-wider">
                  Mualikaji ${localStorage.getItem('selvix_temp_ref') ? '(IMEJAZWA AUTOMATIC)' : '(Sio Lazima)'}
                </span>
                <input type="text" id="reg-referredby" placeholder="admin" value="${localStorage.getItem('selvix_temp_ref') || ''}"
                       ${localStorage.getItem('selvix_temp_ref') ? 'readonly' : ''}
                       class="w-full bg-transparent ${localStorage.getItem('selvix_temp_ref') ? 'text-green-400 font-extrabold cursor-not-allowed' : 'text-white font-bold placeholder-gray-600 focus:outline-none'} text-xs mt-0.5" />
              </div>
            </div>

            <!-- Submit Button with glowing orange gradient -->
            <button type="submit" 
                    class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-[#ff5100] to-yellow-500 text-white font-black text-xs flex items-center justify-between shadow-glow-cyan transform active:scale-95 transition-all duration-300 hover:opacity-95 mt-6 uppercase tracking-wider">
              <span>Hifadhi & Unda Akaunti</span>
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </form>
        </div>

        <!-- Floating Bottom Navigation Card -->
        <div class="mt-auto pt-6 pb-4 w-full flex flex-col items-center bg-[#050812] rounded-t-[2.5rem] px-6 border-t border-gray-800/70 -mx-6 shadow-2xl relative z-10">
          <p class="text-center text-xs text-gray-400">
            Tayari una akaunti bado? 
            <a href="#" data-action="nav" data-param="login" class="text-orange-500 hover:underline font-black uppercase ml-1 tracking-wider text-glow-cyan">Ingia Hapa</a>
          </p>
        </div>
      </div>
    `;
  }

  getLoginHTML() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-[#060814] via-[#0d1127] to-[#04050e] flex flex-col p-6 fade-in text-white relative overflow-hidden">
        <!-- Floating high-fidelity gaming background glow circles -->
        <div class="absolute w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] top-[10%] left-[-15%] animate-pulse"></div>
        <div class="absolute w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] bottom-[15%] right-[-15%] animate-pulse" style="animation-delay: 2s"></div>
        <div class="absolute w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] top-[40%] left-[20%]"></div>

        <!-- Top Navigation with Back and Capsule action buttons -->
        <div class="flex items-center justify-between mb-8 relative z-10">
          <button data-action="nav" data-param="splash" 
                  class="w-12 h-12 rounded-2xl bg-[#0e1329]/60 backdrop-blur-md flex items-center justify-center border border-gray-800/80 hover:border-cyan-500/50 transition-all duration-300 shadow-lg group">
            <i class="fa-solid fa-arrow-left text-[#00f0ff] text-lg group-hover:scale-110 transition duration-300"></i>
          </button>
          <button data-action="nav" data-param="splash"
                  class="text-[10px] font-black bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 rounded-full uppercase tracking-[0.2em] shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95 transition-all duration-300 text-white">
            INGIA SASA
          </button>
        </div>

        <!-- Main Content Area -->
        <div class="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 pb-12">
          
          <!-- Animated Logo and Brand Headers -->
          <div class="flex flex-col items-center mb-8">
            <div class="relative p-1 rounded-[2.5rem] bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.45)] animate-pulse mb-4">
              <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" 
                   alt="Selvix Logo" 
                   class="w-24 h-24 object-contain rounded-[2.2rem] bg-[#0c1224] p-1.5" />
            </div>
            <div class="text-[#00f0ff] font-extrabold text-[10px] tracking-[0.4em] uppercase text-glow-cyan mb-1">MOBILE ESPORTS</div>
            <h1 class="text-3xl font-black text-white italic tracking-wider uppercase text-center">SELVIX GAME ZONE</h1>
          </div>

          <!-- Section Heading -->
          <h2 class="text-xl font-extrabold text-center text-[#00f0ff] uppercase tracking-wider mb-2 text-glow-cyan">INGIA KWENYE AKAUNTI</h2>
          <p class="text-[11px] text-center text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">Ingiza maelezo yako ya akaunti kuanza kupakua na kucheza michezo!</p>

          <form onsubmit="app.handleLogin(event)" class="space-y-4">
            <!-- Username Input -->
            <div class="relative bg-white rounded-3xl p-4 shadow-2xl flex items-center gap-4 border border-blue-100/30">
              <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
                <i class="fa-solid fa-user-tag"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[9px] text-blue-600 font-extrabold uppercase tracking-widest">USERNAME AU EMAIL</span>
                <input type="text" id="login-username" placeholder="Mf: salehe99" required
                       class="w-full bg-transparent text-gray-900 text-sm font-bold placeholder-gray-400 focus:outline-none mt-0.5" />
              </div>
            </div>

            <!-- Password Input -->
            <div class="relative bg-white rounded-3xl p-4 shadow-2xl flex items-center gap-4 border border-blue-100/30">
              <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
                <i class="fa-solid fa-lock"></i>
              </div>
              <div class="flex-grow flex flex-col text-left">
                <span class="text-[9px] text-blue-600 font-extrabold uppercase tracking-widest">NENO LA SIRI (PASSWORD)</span>
                <input type="password" id="login-password" placeholder="*******" required
                       class="w-full bg-transparent text-gray-900 text-sm font-bold placeholder-gray-400 focus:outline-none mt-0.5" />
              </div>
              <button type="button" onclick="app.togglePasswordVisibility('login-password', this)" class="text-blue-500 hover:text-blue-700 transition w-6 flex items-center justify-center">
                <i class="fa-solid fa-eye-slash text-base"></i>
              </button>
            </div>

            <!-- Forgot Password -->
            <div class="text-right">
              <a href="#" data-action="nav" data-param="forgot-password" class="text-xs text-[#00f0ff] hover:text-white font-bold transition uppercase tracking-wider text-glow-cyan">Umesahau neno la siri?</a>
            </div>

            <!-- Submit Button with stunning blue-cyan gradient -->
            <button type="submit" 
                    class="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-between shadow-[0_10px_25px_rgba(6,182,212,0.35)] transform active:scale-95 transition-all duration-300 hover:brightness-110 mt-6 uppercase tracking-widest">
              <span class="flex-grow text-center">INGIA SASA</span>
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </form>

          <!-- Alternative login / divider separator -->
          <div class="flex flex-col items-center mt-8 w-full">
            <div class="flex items-center w-full mb-4">
              <div class="flex-grow h-px bg-gray-800/60"></div>
              <span class="px-4 text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.25em]">AU</span>
              <div class="flex-grow h-px bg-gray-800/60"></div>
            </div>
            
            <div class="text-center text-[10px] text-gray-400 uppercase font-bold tracking-[0.15em] mb-3">INGIA KWA GOOGLE</div>
            
            <button type="button" data-action="google-login" class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform active:scale-90 transition duration-300 hover:shadow-cyan-500/20 hover:scale-105">
              <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" class="w-7 h-7"/>
            </button>
          </div>
        </div>

        <!-- Footer Card -->
        <div class="mt-auto pt-6 pb-4 w-full flex flex-col items-center bg-[#050812]/95 border-t border-gray-800/70 -mx-6 shadow-2xl relative z-10">
          <p class="text-center text-xs text-gray-400">
            Huna akaunti bado? 
            <a href="#" data-action="nav" data-param="register" class="text-[#00f0ff] hover:underline font-extrabold uppercase ml-1 tracking-widest text-glow-cyan">Jisajili Hapa</a>
          </p>
        </div>
      </div>
    `;
  }

  getForgotPasswordHTML() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610] flex flex-col p-6 fade-in text-white relative">
        <!-- Decorative Blur BG -->
        <div class="absolute w-64 h-64 bg-[#ff5100]/10 rounded-full blur-[80px] top-[10%] right-[-10%]"></div>

        <!-- Top Navigation -->
        <div class="flex items-center justify-between mb-8 relative z-10">
          <button data-action="nav" data-param="login" 
                  class="w-11 h-11 rounded-2xl bg-[#101730] hover:bg-[#182245] flex items-center justify-center border border-gray-800/80 transition duration-300 shadow-lg group">
            <i class="fa-solid fa-arrow-left text-[#ff5100] group-hover:scale-110 transition duration-300"></i>
          </button>
          <div class="text-[9px] font-black bg-[#101730] px-4 py-2.5 rounded-full uppercase tracking-[0.15em] border border-gray-800/80 shadow-md text-glow-cyan text-orange-500">
            REJESHA PASS
          </div>
        </div>

        <div class="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 pb-12">
          <div class="flex flex-col items-center mb-6">
            <div class="p-1 rounded-2xl bg-gradient-to-tr from-orange-500 to-yellow-500 shadow-xl mb-3">
              <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" 
                   alt="Selvix Logo" 
                   class="w-14 h-14 object-contain rounded-xl bg-[#0c1224] p-1" />
            </div>
          </div>

          <div class="w-full bg-[#101730] rounded-3xl p-6 text-white shadow-xl border border-gray-800/80 text-center">
            <div class="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 text-3xl mx-auto mb-4 border border-[#ff5100]/20 animate-pulse">
              <i class="fa-solid fa-key text-glow-cyan animate-bounce" style="animation-duration: 3s"></i>
            </div>
            <h2 class="text-base font-black uppercase tracking-wider mb-2 text-white text-glow-cyan">REJESHA PASSWORD</h2>
            <p class="text-xs text-gray-400 leading-relaxed mb-6">Tafadhali wasiliana na msimamizi kuweka neno jipya la siri kwa usalama thabiti wa akaunti yako!</p>
            
            <div class="p-4 bg-[#050812] rounded-2xl text-left border border-gray-800/80 text-xs text-gray-400 mb-6">
              <div class="flex items-center gap-2 mb-2 text-white font-black uppercase tracking-wider">
                <i class="fa-solid fa-circle-info text-orange-500 text-sm"></i> Maelezo ya Admin
              </div>
              Akaunti yako imesimbwa kikamilifu. Wasiliana kupitia soga au piga simu sasa hivi:<br />
              <strong class="text-orange-500 font-extrabold mt-1 inline-block text-sm text-glow-cyan">0750 020 767</strong>
            </div>

            <button data-action="nav" data-param="login" 
                    class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-[#ff5100] to-yellow-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-cyan hover:opacity-90 transition">
              Rudi Kwenye Kuingia
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getUserHomeHTML() {
    const user = window.db.getCurrentUser() || { fullName: "Mgeni", username: "mgeni", pointsBalance: 0, streakCount: 0 };
    const initial = user.fullName ? user.fullName[0].toUpperCase() : "M";
    return `
      <div class="min-h-screen flex flex-col pb-24 fade-in bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610]">
        <!-- Premium Floating-Style Header -->
        <header class="sticky top-0 z-50 px-4 py-3 bg-[#070b19]/90 backdrop-blur-md border-b border-gray-800/70 shadow-xl flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-0.5 rounded-xl bg-gradient-to-tr from-orange-500 to-yellow-500 shadow-md">
                <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" class="w-8 h-8 object-contain rounded-lg bg-[#0c1224] p-0.5" />
              </div>
              <div class="flex flex-col">
                <span class="text-white font-black tracking-widest text-[11px] uppercase">SELVIX</span>
                <span class="text-[8px] text-orange-500 font-extrabold tracking-widest uppercase">GAME ZONE</span>
              </div>
            </div>
            
            <!-- Quick stats & User Action Badge -->
            <div class="flex items-center gap-3">
              <!-- Golden glowing coins balance badge -->
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-yellow-400 font-bold text-[10px] shadow-sm">
                <i class="fa-solid fa-coins animate-spin text-orange-500" style="animation-duration: 4s"></i>
                <span>${user.pointsBalance.toFixed(0)} TZS</span>
              </div>

              <!-- User Initials Avatar with logout action -->
              <div data-action="set-tab" data-param="settings" class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 flex items-center justify-center text-white font-black text-xs cursor-pointer border border-white/10 uppercase shadow-md active:scale-90 transition">
                ${initial}
              </div>
            </div>
          </div>
          
          <div class="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-800/40 pt-2">
            <span class="flex items-center gap-1"><i class="fa-solid fa-user text-orange-500"></i> Karibu, @${user.username}</span>
            <div data-action="logout" class="flex items-center text-red-400 hover:text-red-500 cursor-pointer font-black uppercase tracking-wider gap-1 transition">
              <i class="fa-solid fa-right-from-bracket text-[9px]"></i> Toka
            </div>
          </div>
        </header>

        <!-- Dynamic Page Content Container with padding bottom to prevent floating nav overlap -->
        <main id="tab-content" class="flex-grow p-4 overflow-y-auto">
          <!-- Rendered tab contents go here -->
        </main>

        <!-- Gorgeous Floating Bottom Navigation Pill -->
        <div class="fixed bottom-4 left-4 right-4 z-50">
          <nav class="bg-[#101730]/90 backdrop-blur-lg rounded-2xl py-2.5 px-4 flex justify-around items-center border border-gray-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            <button data-action="set-tab" data-param="games" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${this.activeTab === 'games' ? 'text-orange-500 text-glow-cyan' : 'text-gray-400 hover:text-white'}">
              <i class="fa-solid fa-gamepad text-lg group-hover:scale-110 transition"></i>
              <span class="text-[9px] mt-1 font-bold uppercase tracking-wider">Soko</span>
              ${this.activeTab === 'games' ? '<span class="absolute bottom-[-6px] w-1.5 h-1.5 bg-orange-500 rounded-full"></span>' : ''}
            </button>
            <button data-action="set-tab" data-param="chats" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${this.activeTab === 'chats' ? 'text-orange-500 text-glow-cyan' : 'text-gray-400 hover:text-white'}">
              <i class="fa-solid fa-comments text-lg group-hover:scale-110 transition"></i>
              <span class="text-[9px] mt-1 font-bold uppercase tracking-wider">Chats</span>
              ${this.activeTab === 'chats' ? '<span class="absolute bottom-[-6px] w-1.5 h-1.5 bg-orange-500 rounded-full"></span>' : ''}
            </button>
            <button data-action="set-tab" data-param="rewards" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${this.activeTab === 'rewards' ? 'text-orange-500 text-glow-cyan' : 'text-gray-400 hover:text-white'}">
              <i class="fa-solid fa-gift text-lg group-hover:scale-110 transition animate-pulse"></i>
              <span class="text-[9px] mt-1 font-bold uppercase tracking-wider">Zawadi</span>
              ${this.activeTab === 'rewards' ? '<span class="absolute bottom-[-6px] w-1.5 h-1.5 bg-orange-500 rounded-full"></span>' : ''}
            </button>
            <button data-action="set-tab" data-param="withdrawals" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${this.activeTab === 'withdrawals' ? 'text-orange-500 text-glow-cyan' : 'text-gray-400 hover:text-white'}">
              <i class="fa-solid fa-wallet text-lg group-hover:scale-110 transition"></i>
              <span class="text-[9px] mt-1 font-bold uppercase tracking-wider">Kutoa</span>
              ${this.activeTab === 'withdrawals' ? '<span class="absolute bottom-[-6px] w-1.5 h-1.5 bg-orange-500 rounded-full"></span>' : ''}
            </button>
            <button data-action="set-tab" data-param="settings" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative group ${this.activeTab === 'settings' ? 'text-orange-500 text-glow-cyan' : 'text-gray-400 hover:text-white'}">
              <i class="fa-solid fa-user-astronaut text-lg group-hover:scale-110 transition"></i>
              <span class="text-[9px] mt-1 font-bold uppercase tracking-wider">Wasifu</span>
              ${this.activeTab === 'settings' ? '<span class="absolute bottom-[-6px] w-1.5 h-1.5 bg-orange-500 rounded-full"></span>' : ''}
            </button>
          </nav>
        </div>
      </div>
    `;
  }

  getGameDetailsHTML() {
    const game = this.selectedGame;
    if (!game) return '';
    const user = window.db.getCurrentUser() || { pointsBalance: 0 };
    const hasPaid = !game.isPaid || window.db.getTransactions().some(t => t.username.toLowerCase() === (user.username || '').toLowerCase() && t.gameId === game.id && t.status === "SUCCESS");

    return `
      <div class="min-h-screen flex flex-col pb-6 fade-in">
        <!-- Cover Art Banner -->
        <div class="relative h-64 w-full bg-cover bg-center" style="background-image: url('${game.imageUrl}')">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
          <button data-action="back-home" 
                  class="absolute top-6 left-6 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white interactive-target">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
        </div>

        <div class="px-6 -mt-8 relative z-10">
          <div class="glass-panel p-6 rounded-3xl">
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full bg-cyan-900 border border-cyan-500 text-cyan-400 text-xs font-bold uppercase">${game.category}</span>
              <span class="text-xl font-bold ${game.isPaid ? 'text-pink-500 text-glow-magenta' : 'text-green-400 text-glow-cyan'}">
                ${game.isPaid ? 'TZS ' + game.price.toFixed(0) : 'BURE'}
              </span>
            </div>

            <h1 class="text-3xl font-extrabold text-white mb-2 text-glow-cyan uppercase">${game.title}</h1>
            <p class="text-sm text-gray-400 leading-relaxed mb-6">${game.description}</p>

            <!-- Specs Requirements -->
            <div class="p-4 bg-gray-800 bg-opacity-60 rounded-2xl border border-gray-700 mb-6 text-sm space-y-2">
              <p class="font-bold text-white uppercase text-xs tracking-wider text-cyan-400 mb-2"><i class="fa-solid fa-microchip mr-2"></i>Mahitaji ya Kifaa</p>
              <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>OS: Android 10+</div>
                <div>RAM: 4GB au zaidi</div>
                <div>Nafasi: 1.2 GB huru</div>
                <div>GPU: Mali / Adreno</div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="space-y-4">
              ${hasPaid ? `
                <!-- Game Download -->
                <a href="${game.downloadUrl}" target="_blank"
                   class="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:opacity-90 text-white font-extrabold tracking-widest uppercase shadow-glow-cyan flex items-center justify-center space-x-2 interactive-target">
                  <i class="fa-solid fa-download animate-bounce"></i>
                  <span>PAKUA MICHEZO (DOWNLOAD NOW)</span>
                </a>
              ` : `
                <!-- SpeedPesa Option -->
                <div class="p-4 bg-gray-900 bg-opacity-80 rounded-2xl border border-gray-800">
                  <p class="text-xs text-cyan-400 font-bold mb-2 uppercase"><i class="fa-solid fa-phone-card mr-2"></i>Lipia kwa SpeedPesa (M-Pesa/Airtel/Tigo)</p>
                  <div class="flex space-x-2">
                    <div class="flex-grow flex">
                      <span class="inline-flex items-center px-3 rounded-l-xl bg-gray-800 border border-r-0 border-gray-700 text-gray-400 text-xs">+255</span>
                      <input type="tel" id="speedpesa-phone" placeholder="750020767" value="${user.phoneNumber || ''}"
                             class="w-full px-3 py-2 rounded-r-xl cyber-input text-white text-sm" />
                    </div>
                    <button data-action="buy-speedpesa" 
                            class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
                      LIPA TZS ${game.price}
                    </button>
                  </div>
                </div>

                <!-- Coins Option -->
                <button data-action="buy-coins" 
                        class="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold tracking-widest uppercase shadow-glow-magenta flex items-center justify-center space-x-2 interactive-target">
                  <i class="fa-solid fa-coins animate-spin" style="animation-duration: 3s"></i>
                  <span>NUNUA KWA COINS (TZS ${game.price})</span>
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getAdminDashboardHTML() {
    const games = window.db.getGames();
    const users = window.db.getUsers();
    const txs = window.db.getTransactions();
    const settings = window.db.getSettings();

    // Stats
    const totalRevenue = txs.filter(t => t.status === 'SUCCESS' && t.gameId >= 0).reduce((acc, t) => acc + t.amount, 0);
    const pendingWithdrawals = txs.filter(t => t.status === 'PENDING' && t.gameId === -1);
    const completedWithdrawals = txs.filter(t => t.status === 'SUCCESS' && t.gameId === -1).reduce((acc, t) => acc + t.amount, 0);

    return `
      <div class="min-h-screen flex flex-col pb-6 fade-in text-sm">
        <!-- Header -->
        <header class="glass-panel px-6 py-4 flex items-center justify-between border-b border-gray-800">
          <div class="flex items-center space-x-3">
            <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" class="w-10 h-10 object-contain rounded-xl border border-orange-500 bg-white p-0.5" />
            <div>
              <h1 class="text-base font-black text-white uppercase tracking-wider">Admin Dashboard</h1>
              <p class="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Usimamizi wa Selvix</p>
            </div>
          </div>
          <button data-action="logout" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs shadow-md transition">LOGOUT</button>
        </header>

        <div class="p-6 space-y-6">
          <!-- Analytics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-panel p-4 rounded-2xl">
              <p class="text-xs text-gray-400 uppercase">Jumla ya Mapato</p>
              <p class="text-lg font-extrabold text-green-400 text-glow-cyan mt-1">TZS ${totalRevenue.toFixed(0)}</p>
            </div>
            <div class="glass-panel p-4 rounded-2xl">
              <p class="text-xs text-gray-400 uppercase">Withdrawals Pending</p>
              <p class="text-lg font-extrabold text-pink-500 text-glow-magenta mt-1">${pendingWithdrawals.length}</p>
            </div>
            <div class="glass-panel p-4 rounded-2xl">
              <p class="text-xs text-gray-400 uppercase">Withdrawals Zilizolipwa</p>
              <p class="text-lg font-extrabold text-yellow-400 text-glow-cyan mt-1">TZS ${completedWithdrawals.toFixed(0)}</p>
            </div>
            <div class="glass-panel p-4 rounded-2xl">
              <p class="text-xs text-gray-400 uppercase">Watumiaji Wote</p>
              <p class="text-lg font-extrabold text-white mt-1">${Object.keys(users).length}</p>
            </div>
          </div>

          <!-- Controls Section -->
          <div class="glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-sliders mr-2"></i>Dhibiti Mifumo (Controls)</h3>
            <div class="flex flex-col md:flex-row gap-4">
              <button data-action="admin-toggle-referral" 
                      class="flex-1 py-3 px-4 rounded-xl flex items-center justify-between font-bold border ${settings.isReferralActive ? 'bg-green-900 border-green-500 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-400'}">
                <span>Mfumo wa Mialiko (Referrals)</span>
                <span>${settings.isReferralActive ? 'UPO WAZI (ON)' : 'UMEFUNGWA (OFF)'}</span>
              </button>
              <button data-action="admin-toggle-withdrawal" 
                      class="flex-1 py-3 px-4 rounded-xl flex items-center justify-between font-bold border ${settings.isWithdrawalActive ? 'bg-green-900 border-green-500 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-400'}">
                <span>Huduma ya Kutoa (Withdrawals)</span>
                <span>${settings.isWithdrawalActive ? 'UPO WAZI (ON)' : 'UMEFUNGWA (OFF)'}</span>
              </button>
            </div>
          </div>

          <!-- Pending Withdrawals List -->
          <div class="glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-magenta"><i class="fa-solid fa-circle-exclamation mr-2"></i>Maombi ya Kutoa Pesa (Pending Withdrawals)</h3>
            ${pendingWithdrawals.length === 0 ? `
              <p class="text-xs text-gray-400 text-center py-4">Hakuna maombi ya kutoa fedha kwa sasa!</p>
            ` : `
              <div class="space-y-3">
                ${pendingWithdrawals.map(wd => `
                  <div class="p-4 bg-gray-800 bg-opacity-60 rounded-2xl border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p class="font-semibold text-white">Mtumiaji: @${wd.username}</p>
                      <p class="text-xs text-gray-400 mt-1">Namba ya Pokelea: +${wd.phonenumber} | Kiasi: <span class="font-bold text-yellow-400">TZS ${wd.amount}</span></p>
                      <p class="text-[10px] text-gray-500 mt-1">Tarehe: ${wd.created}</p>
                    </div>
                    <div class="flex space-x-2">
                      <button data-action="admin-approve-wd" data-param="${wd.reference}" 
                              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg uppercase">Thibitisha (Approve)</button>
                      <button data-action="admin-reject-wd" data-param="${wd.reference}" 
                              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase">Kataa (Reject)</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Upload Game Form -->
          <div class="glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-cloud-arrow-up mr-2"></i>PANDISHA MCHEZO MPYA (UPLOAD GAME)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" id="upload-title" placeholder="Jina la Game (Mf: GTA V)" class="p-3 rounded-xl cyber-input text-white text-xs" />
              <input type="text" id="upload-cover" placeholder="Cover Image URL (Kutoka Unsplash au mtandaoni)" class="p-3 rounded-xl cyber-input text-white text-xs" />
              <select id="upload-category" class="p-3 rounded-xl cyber-input text-white text-xs">
                <option value="PC GAME">PC GAME</option>
                <option value="EMULATOR GAME">EMULATOR GAME</option>
                <option value="MOBILE GAME">MOBILE GAME</option>
              </select>
              <input type="number" id="upload-price" placeholder="Bei ya TZS (Weka 0 ikiwa ni ya bure)" value="0" class="p-3 rounded-xl cyber-input text-white text-xs" />
              <input type="text" id="upload-link" placeholder="Download Link (Mf: drive.google.com/xyz)" class="p-3 rounded-xl cyber-input text-white text-xs" />
              <textarea id="upload-desc" placeholder="Maelezo kamili ya mchezo..." rows="3" class="p-3 rounded-xl cyber-input text-white text-xs md:col-span-2"></textarea>
            </div>
            <button data-action="admin-upload-game" 
                    class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan interactive-target">
              Hifadhi na Pandisha
            </button>
          </div>

          <!-- Manage Games List -->
          <div class="glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-gamepad mr-2"></i>MICHEZO ILIYOPANDISHWA (${games.length})</h3>
            ${games.length === 0 ? `
              <p class="text-xs text-gray-400 text-center py-4">Hakuna michezo iliyopandishwa kwa sasa!</p>
            ` : `
              <div class="space-y-3 max-h-80 overflow-y-auto">
                ${games.map(g => `
                  <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <img src="${g.imageUrl}" alt="${g.title}" class="w-12 h-12 object-cover rounded-lg border border-gray-600" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200'"/>
                      <div>
                        <p class="font-semibold text-white">${g.title}</p>
                        <p class="text-xs text-gray-400 mt-0.5">${g.category} | <span class="text-yellow-400 font-bold">${g.price > 0 ? 'TZS ' + g.price : 'BURE'}</span></p>
                      </div>
                    </div>
                    <button data-action="admin-delete-game" data-param="${g.id}" 
                            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                      <i class="fa-solid fa-trash-can"></i> Futa
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Users Management -->
          <div class="glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-users-gear mr-2"></i>USIMAMIZI WA WATUMIAJI (USERS)</h3>
            <div class="space-y-3 max-h-80 overflow-y-auto">
              ${Object.values(users).map(u => `
                <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-white">@${u.username} ${u.isAdmin ? '<span class="text-[10px] bg-pink-900 border border-pink-500 text-pink-300 px-1 py-0.5 rounded ml-2">ADMIN</span>' : ''}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${u.fullName} | Simu: +255${u.phoneNumber}</p>
                    <p class="text-xs text-yellow-400 font-bold mt-0.5">Coins: TZS ${u.pointsBalance || 0} ${u.isBlockedFromChatting ? ' <span class="text-red-500">[MUTED]</span>' : ''}</p>
                  </div>
                  <button data-action="admin-edit-user" data-param="${u.username}" 
                          class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg uppercase">Manage</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Supadatabase System Configurator -->
          <div class="glass-panel p-6 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-gray-900 to-[#1e130c]">
            <h3 class="font-bold text-white text-sm uppercase mb-2 text-glow-cyan"><i class="fa-solid fa-database mr-2 text-orange-500"></i>SUPADATABASE CLOUD INTEGRATION PANEL</h3>
            <p class="text-xs text-gray-400 mb-4">Weka maelezo ya API URL na Anon Key yako ya Supadatabase ili kusawazisha Database ya Selvix na Wingu!</p>
            <div class="space-y-3">
              <div>
                <label class="block text-[10px] uppercase text-orange-500 font-bold mb-1">Supadatabase API URL</label>
                <input type="text" id="cfg-endpoint" value="${window.appwrite.config.endpoint}" placeholder="https://yourproject.supabase.co" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs" />
              </div>
              <div>
                <label class="block text-[10px] uppercase text-orange-500 font-bold mb-1">Supadatabase Anon Key</label>
                <input type="text" id="cfg-project" value="${window.appwrite.config.projectId}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." class="w-full p-2.5 rounded-lg cyber-input text-white text-xs" />
              </div>
              <div>
                <label class="block text-[10px] uppercase text-orange-500 font-bold mb-1">Mifumo Suffix (Optional)</label>
                <input type="text" id="cfg-dbid" value="${window.appwrite.config.databaseId || 'selvix_prod'}" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs" />
              </div>
              <button data-action="save-appwrite" 
                      class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-yellow-500 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan interactive-target">
                Unganisha Wingu la Supadatabase
              </button>
            </div>
          </div>

          <button data-action="nav" data-param="user-home" 
                  class="w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase tracking-wider text-xs border border-gray-700">
            Fungua upande wa User (User Interface)
          </button>
        </div>
      </div>
    `;
  }

  // --- TAB RENDERING FOR USER VIEWS ---
  renderTabContent() {
    const container = document.getElementById('tab-content');
    if (!container) return;

    container.innerHTML = '';

    if (this.activeTab === 'games') {
      container.innerHTML = this.getGamesTabHTML();
    } else if (this.activeTab === 'chats') {
      container.innerHTML = this.getChatsTabHTML();
      this.renderChatRoom();
    } else if (this.activeTab === 'rewards') {
      container.innerHTML = this.getRewardsTabHTML();
    } else if (this.activeTab === 'withdrawals') {
      container.innerHTML = this.getWithdrawalsTabHTML();
    } else if (this.activeTab === 'settings') {
      container.innerHTML = this.getSettingsTabHTML();
    }
  }

  getGamesTabHTML() {
    const allGames = window.db.getGames();
    const categories = ['ZOTE', 'PC GAME', 'EMULATOR GAME', 'MOBILE GAME'];
    
    const filteredGames = this.activeCategoryFilter === 'ZOTE'
      ? allGames
      : allGames.filter(g => g.category === this.activeCategoryFilter);

    return `
      <div class="space-y-4 fade-in">
        <!-- Horizontal Scrollable Category Chips -->
        <div class="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar flex-nowrap">
          ${categories.map(cat => {
            const isActive = this.activeCategoryFilter === cat;
            return `
              <button data-action="filter-category" data-param="${cat}"
                      class="px-4 py-2.5 rounded-full text-[10px] font-black tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                        isActive
                          ? 'bg-[#ea2b41] text-white shadow-lg scale-105'
                          : 'border border-[#3b1212] bg-[#1d0d0d] bg-opacity-70 text-gray-400 hover:border-[#ea2b41] hover:text-white'
                      }">
                ${cat}
              </button>
            `;
          }).join('')}
        </div>

        <!-- 2-Column Games Grid -->
        <div class="grid grid-cols-2 gap-3.5">
          ${filteredGames.map(game => {
            const isPaid = game.isPaid;
            const priceStr = isPaid ? 'TZS ' + game.price.toLocaleString() : 'BURE';
            return `
              <div class="relative flex flex-col bg-[#160a0a] border border-[#301111] rounded-2xl overflow-hidden shadow-lg hover:border-[#ea2b41] transition-all duration-300 group">
                <!-- Cover Image Section -->
                <div data-action="view-game" data-param="${game.id}" class="relative w-full aspect-[4/3] overflow-hidden cursor-pointer">
                  <img src="${game.imageUrl}" alt="${game.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                  <!-- Overlaid Category Badge -->
                  <span class="absolute top-2 left-2 bg-black bg-opacity-70 text-[8px] font-black text-cyan-400 uppercase px-1.5 py-0.5 rounded border border-cyan-500 border-opacity-30">
                    ${game.category.split(' ')[0]}
                  </span>
                  <!-- Overlaid Action Button -->
                  <button data-action="view-game" data-param="${game.id}" class="absolute bottom-2 right-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black text-[9px] px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition duration-300">
                    <i class="fa-solid fa-download"></i> Download
                  </button>
                </div>

                <!-- Info Section -->
                <div class="p-3 flex flex-col justify-between h-16 bg-[#0f0404] bg-opacity-80">
                  <h4 data-action="view-game" data-param="${game.id}" class="text-white text-xs font-black tracking-wide uppercase truncate cursor-pointer hover:text-red-500 transition">${game.title}</h4>
                  <p class="text-[10px] font-extrabold ${isPaid ? 'text-orange-500' : 'text-green-500'}">
                    ${priceStr}
                  </p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  getChatsTabHTML() {
    const rooms = ['Chat Kuu', 'FIFA', 'GTA V', 'Call of Duty'];
    return `
      <div class="flex flex-col h-[calc(100vh-180px)] fade-in">
        <!-- Room Selector Tabs -->
        <div class="flex space-x-2 overflow-x-auto pb-3 mb-4 border-b border-gray-800">
          ${rooms.map(room => `
            <button data-action="set-chat-room" data-param="${room}"
                    class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap tab-transition ${this.chatRoom === room ? 'bg-cyan-500 text-white shadow-glow-cyan' : 'bg-gray-800 text-gray-400 hover:text-white'}">
              ${room}
            </button>
          `).join('')}
        </div>

        <!-- Chat Logs Container -->
        <div id="chat-logs-container" class="flex-grow overflow-y-auto space-y-3 p-2 bg-gray-900 bg-opacity-40 rounded-2xl border border-gray-800 max-h-[50vh] min-h-[40vh]">
          <!-- Dynamic logs go here -->
        </div>

        <!-- Text Input and Send (Interactive Target compliant) -->
        <div class="mt-4 flex space-x-2">
          <input type="text" id="chat-input-field" placeholder="Andika ujumbe wako..." 
                 class="flex-grow px-4 py-3 rounded-xl cyber-input text-white text-xs" />
          <button data-action="send-chat" 
                  class="w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center interactive-target shadow-glow-cyan">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderChatRoom() {
    const container = document.getElementById('chat-logs-container');
    if (!container) return;

    const chats = window.db.getChats().filter(c => c.roomName === this.chatRoom);
    const currentUser = window.db.getCurrentUser();

    if (chats.length === 0) {
      container.innerHTML = `<div class="text-center text-xs text-gray-500 py-10">Anzisha mazungumzo katika chumba cha ${this.chatRoom}!</div>`;
      return;
    }

    container.innerHTML = chats.map(chat => {
      const isMe = currentUser && currentUser.username === chat.senderUsername;
      return `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} px-3 py-1">
          <div class="max-w-[80%] rounded-2xl p-3 text-xs ${isMe ? 'bg-cyan-900 text-cyan-100 rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none'}">
            <p class="font-bold text-[10px] text-pink-400 mb-1">@${chat.senderUsername} (${chat.senderFullName})</p>
            <p class="leading-relaxed whitespace-pre-wrap">${chat.message}</p>
          </div>
          <span class="text-[9px] text-gray-500 mt-0.5">${chat.timestamp}</span>
        </div>
      `;
    }).join('');

    // scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  getRewardsTabHTML() {
    const user = window.db.getCurrentUser();
    const today = new Date().toDateString();
    const claimedToday = user && user.lastRewardClaimedDate === today;

    return `
      <div class="flex flex-col items-center justify-center text-center p-6 space-y-6 fade-in min-h-[60vh]">
        <div id="gift-box" class="w-48 h-48 rounded-full glass-panel flex flex-col items-center justify-center cursor-pointer ${claimedToday ? '' : 'gift-box-animate'}"
             data-action="${claimedToday ? '' : 'claim-reward'}">
          ${claimedToday ? `
            <div class="text-64px mb-4 text-glow-cyan"><i class="fa-solid fa-box-open text-7xl text-cyan-400"></i></div>
            <p class="text-sm text-cyan-400 font-bold">KIFURUSHI KILICHUKULIWA</p>
            <p class="text-[10px] text-gray-500 mt-1">Rudi tena kesho kufungua kingine!</p>
          ` : `
            <div class="text-64px mb-4 text-glow-magenta"><i class="fa-solid fa-gift text-7xl text-pink-500"></i></div>
            <p class="text-sm text-pink-400 font-bold uppercase animate-pulse">GUSA KUFUNGUA</p>
            <p class="text-[9px] text-gray-400 mt-1">ZAWADI YA KILA SIKU</p>
          `}
        </div>

        <div class="glass-panel p-6 rounded-3xl w-full max-w-md text-left space-y-4">
          <h3 class="font-bold text-white text-sm uppercase text-glow-cyan"><i class="fa-solid fa-circle-info mr-2"></i>Miongozo ya Zawadi za Kila Siku</h3>
          <p class="text-xs text-gray-400 leading-relaxed">
            Kila masaa 24 unaweza kufungua boksi lako la bahati upate kuanzia <span class="text-yellow-400 font-bold">Coins 100 hadi 500</span> bure kabisa!
            Ukiendelea kufungua kila siku bila kukosa, pointi na streak yako zitazidi kuongezeka kwa kiasi cha <span class="text-cyan-400 font-bold">TZS 50 kila siku</span>.
          </p>
          <div class="p-3 bg-gray-800 rounded-xl flex justify-between items-center text-xs">
            <span class="text-gray-400">Streak yako sasa:</span>
            <span class="font-extrabold text-white text-sm">${user ? user.streakCount || 0 : 0} Siku</span>
          </div>
        </div>
      </div>
    `;
  }

  getWithdrawalsTabHTML() {
    const user = window.db.getCurrentUser() || { pointsBalance: 0 };
    const txs = window.db.getTransactions().filter(t => t.username === user.username && t.gameId === -1);

    return `
      <div class="space-y-6 fade-in text-sm">
        <!-- Coin Wallet Card -->
        <div class="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-950 to-gray-900 border-indigo-900 flex items-center justify-between">
          <div>
            <p class="text-xs text-indigo-400 font-bold uppercase tracking-wider">Kiasi Kinachoweza Kutolewa</p>
            <h2 class="text-3xl font-black text-yellow-400 text-glow-cyan mt-1">TZS ${user.pointsBalance.toFixed(0)}</h2>
            <p class="text-[10px] text-gray-400 mt-1">Sawa na Coins ${(user.pointsBalance || 0).toFixed(0)}</p>
          </div>
          <i class="fa-solid fa-wallet text-4xl text-indigo-500"></i>
        </div>

        <!-- Request form -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <h3 class="font-bold text-white uppercase text-sm text-glow-cyan"><i class="fa-solid fa-money-bill-transfer mr-2"></i>Omba Kutoa Pesa (Withdraw)</h3>
          
          <div>
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Kiasi cha Kutoa (Kuanzia TZS 3,000)</label>
            <input type="number" id="wd-amount" placeholder="Mf: 3500" class="w-full px-4 py-3 rounded-xl cyber-input text-white text-xs" />
          </div>

          <div>
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Namba ya Pokelea (Tigo/Mpesa/Airtel)</label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-xl bg-gray-800 border border-r-0 border-gray-700 text-gray-400 text-xs">+255</span>
              <input type="tel" id="wd-phone" placeholder="750020767" value="${user.phoneNumber || ''}"
                     class="w-full px-4 py-3 rounded-r-xl cyber-input text-white text-xs" />
            </div>
          </div>

          <button data-action="request-withdrawal" 
                  class="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold tracking-widest uppercase shadow-glow-cyan interactive-target">
            Wasilisha Ombi la Malipo
          </button>
        </div>

        <!-- Historic logs -->
        <div class="glass-panel p-6 rounded-3xl space-y-3">
          <h3 class="font-bold text-white uppercase text-sm"><i class="fa-solid fa-clock-rotate-left mr-2"></i>Historia ya Kutoa</h3>
          ${txs.length === 0 ? `
            <p class="text-xs text-gray-500 text-center py-4">Hujawahi kuomba kutoa fedha bado.</p>
          ` : `
            <div class="space-y-2">
              ${txs.map(tx => `
                <div class="p-3 bg-gray-800 bg-opacity-60 rounded-xl flex justify-between items-center border border-gray-700">
                  <div>
                    <p class="font-bold text-white text-xs">TZS ${tx.amount}</p>
                    <p class="text-[9px] text-gray-500 mt-0.5">${tx.created}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status === 'SUCCESS' ? 'bg-green-950 text-green-300 border border-green-800' : tx.status === 'FAILED' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-yellow-950 text-yellow-300 border border-yellow-800'}">
                    ${tx.status === 'SUCCESS' ? 'Imekamilika' : tx.status === 'FAILED' ? 'Imekataliwa' : 'Inasubiri'}
                  </span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  getSettingsTabHTML() {
    const user = window.db.getCurrentUser() || { fullName: "", phoneNumber: "", username: "" };
    return `
      <div class="space-y-6 fade-in text-sm">
        <!-- User Badge card -->
        <div class="glass-panel p-6 rounded-3xl flex items-center space-x-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff8c00] to-[#ff3c00] flex items-center justify-center text-white font-black text-2xl shadow-md uppercase">
            ${user.fullName ? user.fullName[0] : 'S'}
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">${user.fullName}</h2>
            <p class="text-xs text-gray-400">@${user.username} (Mtumiaji)</p>
          </div>
        </div>

        <!-- Referral Card -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <h3 class="font-bold text-white uppercase text-sm text-glow-cyan">
            <i class="fa-solid fa-gift mr-2 text-orange-500 animate-pulse"></i>Mpango wa Mialiko (Referrals)
          </h3>
          <p class="text-xs text-gray-300 leading-relaxed">
            Mualike rafiki yako ajiunge na Selvix Game Zone na upate bonasi ya <strong class="text-orange-400">TZS 100 Coins</strong> papo hapo wanapojisajili, nao wanapata <strong class="text-orange-400">TZS 100 Coins</strong> papo hapo!
          </p>
          
          <div class="bg-gray-950 bg-opacity-40 p-3.5 rounded-2xl border border-gray-800 flex flex-col space-y-2">
            <span class="text-[10px] text-orange-400 font-black uppercase tracking-widest">Kiungo chako cha Mwaliko:</span>
            <div class="flex items-center gap-2">
              <input type="text" readonly value="${window.location.origin}${window.location.pathname}?ref=${user.username}" 
                     class="flex-grow bg-transparent text-white font-mono text-[11px] border-0 focus:ring-0 select-all outline-none overflow-x-auto no-scrollbar" />
              <button data-action="copy-referral-link" class="px-3 py-2 bg-gradient-to-r from-[#ff8c00] to-[#ff3c00] hover:opacity-90 rounded-xl text-white text-xs font-bold flex items-center space-x-1 transition shrink-0 shadow-md">
                <i class="fa-solid fa-copy"></i>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Edit profile form -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <h3 class="font-bold text-white uppercase text-sm text-glow-cyan"><i class="fa-solid fa-user-pen mr-2"></i>Sasisha Wasifu</h3>
          
          <div>
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Majina Matatu Kamili</label>
            <input type="text" id="prof-fullname" value="${user.fullName}" class="w-full px-4 py-3 rounded-xl cyber-input text-white text-xs" />
          </div>

          <div>
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Namba ya Simu (+255)</label>
            <input type="tel" id="prof-phone" value="${user.phoneNumber}" class="w-full px-4 py-3 rounded-xl cyber-input text-white text-xs" />
          </div>

          <div>
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Password Mpya (Acha wazi kama hutaki kubadili)</label>
            <input type="password" id="prof-password" placeholder="******" class="w-full px-4 py-3 rounded-xl cyber-input text-white text-xs" />
          </div>

          <button data-action="update-profile" 
                  class="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold tracking-widest uppercase shadow-glow-cyan interactive-target">
            Hifadhi Mabadiliko
          </button>
        </div>

        <!-- Theme Switcher Card -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <h3 class="font-bold text-white uppercase text-sm text-glow-cyan">
            <i class="fa-solid fa-palette mr-2"></i>Chagua Mandhari (Theme)
          </h3>
          <p class="text-xs text-gray-400">Kubali muonekano unaoupenda kwa kubofya chaguzi hapa chini:</p>
          <div class="grid grid-cols-3 gap-2 pt-1">
            <button data-action="change-theme" data-param="cyberpunk" 
                    class="py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all duration-300 ${window.db.getActiveTheme() === 'cyberpunk' ? 'bg-cyan-500 text-white shadow-glow-cyan border-cyan-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}">
              CYBER
            </button>
            <button data-action="change-theme" data-param="light" 
                    class="py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all duration-300 ${window.db.getActiveTheme() === 'light' ? 'bg-pink-500 text-white shadow-glow-magenta border-pink-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}">
              LIGHT
            </button>
            <button data-action="change-theme" data-param="orange" 
                    class="py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all duration-300 ${window.db.getActiveTheme() === 'orange' ? 'bg-[#ff6b00] text-white shadow-lg border-[#ff8c3b]' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}">
              ORANGE
            </button>
          </div>
        </div>

        <!-- Link to Admin if user is admin -->
        ${user.isAdmin ? `
          <button data-action="nav" data-param="admin-dashboard" 
                  class="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold tracking-widest uppercase shadow-glow-magenta interactive-target">
            <i class="fa-solid fa-user-shield mr-2"></i> Fungua Admin Panel
          </button>
        ` : ''}

        <!-- Notifications list -->
        <div class="glass-panel p-6 rounded-3xl space-y-3">
          <h3 class="font-bold text-white uppercase text-sm"><i class="fa-solid fa-bell mr-2"></i>Arifa (Notifications)</h3>
          <div id="notifications-list" class="space-y-2 max-h-40 overflow-y-auto">
            <!-- Render notifications -->
          </div>
        </div>

        <button data-action="logout" 
                class="w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-red-500 font-bold uppercase tracking-wider text-xs border border-gray-700">
          LOGOUT (Ondoka kwenye Programu)
        </button>
      </div>
    `;
  }

  renderNotificationsList() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Arifa zako zote zimeshasomwa!</p>`;
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex justify-between items-start">
        <p class="text-xs text-gray-300 leading-relaxed">${n.msg}</p>
        <span class="text-[9px] text-gray-500">${n.date}</span>
      </div>
    `).join('');
  }

  // --- Payment Modal Rendering Helpers ---
  renderPaymentProgressModal() {
    let modal = document.getElementById('payment-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'payment-modal';
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black bg-opacity-80 backdrop-blur-sm fade-in';
      document.body.appendChild(modal);
    }

    const spinnerColor = this.paymentStatus === 'SUCCESS' ? 'text-green-400' : 'text-pink-500';
    const statusIcon = this.paymentStatus === 'SUCCESS' 
      ? '<i class="fa-solid fa-circle-check text-5xl text-green-400 text-glow-cyan animate-bounce"></i>'
      : '<i class="fa-solid fa-rotate text-5xl text-pink-500 text-glow-magenta animate-spin"></i>';

    modal.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl w-full max-w-sm text-center space-y-6">
        <div>
          ${statusIcon}
        </div>
        <h3 class="text-lg font-bold text-white uppercase tracking-wider">SpeedPesa Processing</h3>
        <p class="text-xs text-gray-300 leading-relaxed">${this.paymentProgress}</p>
        ${this.paymentStatus === 'SUCCESS' ? `
          <p class="text-[10px] text-green-400 font-bold animate-pulse">IMEKUBALIWA! INAPAKUA SASA...</p>
        ` : `
          <p class="text-[10px] text-cyan-400 animate-pulse">Tafadhali usifunge dirisha hili...</p>
        `}
      </div>
    `;
  }

  closePaymentProgressModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.remove();
    }
  }
}

window.app = new SelvixApp();
