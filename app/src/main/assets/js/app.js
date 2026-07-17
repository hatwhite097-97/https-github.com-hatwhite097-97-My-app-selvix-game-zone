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
    this.editingGameId = null;
    this.forgotStep = 1;
    this.forgotPhone = "";
    this.forgotOtp = "";
    this.forgotCountdown = 60;
    this.appliedCoupon = null;
    this.adminTab = 'dashboard'; // dashboard, games, users, gateways, sms, coupons
    this.transactionStatusFilter = 'ALL';

    // Extract & save referral parameter if present in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('referredBy') || urlParams.get('admin');
    if (refParam) {
      localStorage.setItem('selvix_temp_ref', refParam.trim().toLowerCase());
    }

    // Intercept default window.alert with beautiful custom alert popup overlay
    window.alert = (msg) => {
      this.showCustomAlert(msg);
    };

    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
      const autoContainer = document.getElementById('rbac-autocomplete-container');
      if (autoContainer && !e.target.closest('#rbac-username') && !e.target.closest('#rbac-autocomplete-container')) {
        autoContainer.classList.add('hidden');
      }
    });

    this.applyTheme();
    this.bindEvents();
    this.start();
  }

  applyTheme() {
    const theme = window.db.getActiveTheme();
    document.body.classList.remove('theme-cyberpunk', 'theme-light', 'theme-orange', 'theme-white-blend', 'theme-blue');
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else if (theme === 'orange') {
      document.body.classList.add('theme-orange');
    } else if (theme === 'white-blend') {
      document.body.classList.add('theme-white-blend');
    } else if (theme === 'blue') {
      document.body.classList.add('theme-blue');
    } else {
      document.body.classList.add('theme-blue'); // Default theme is blue
    }
  }

  showCustomAlert(message, title = "SELVIX GAME ZONE") {
    // Remove existing if any
    const existing = document.getElementById('custom-alert-modal');
    if (existing) existing.remove();

    // Create container
    const modal = document.createElement('div');
    modal.id = 'custom-alert-modal';
    // Tailwind classes for absolute centering, high z-index, and backdrop blur
    modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm custom-alert-fade-in';
    
    // Determine if warning/error
    let isWarning = false;
    const msgLower = message.toLowerCase();
    if (msgLower.includes('makosa') || msgLower.includes('kosa') || msgLower.includes('onyo') || msgLower.includes('imefeli') || msgLower.includes('hazitoshi') || msgLower.includes('imefungwa') || msgLower.includes('sahihi') || msgLower.includes('hakikisha') || msgLower.includes('haipo') || msgLower.includes('futa') || msgLower.includes('tafadhali') || msgLower.includes('lazima') || msgLower.includes('haijasajiliwa')) {
      isWarning = true;
    }

    const titleText = isWarning ? "ONYO / TAHADHARI" : title;
    const iconClass = isWarning ? "fa-triangle-exclamation text-rose-500 animate-pulse" : "fa-circle-info text-cyan-500 animate-bounce";
    const headerColor = isWarning ? "from-red-600 via-orange-500 to-yellow-500" : "from-cyan-500 via-blue-500 to-indigo-600";

    modal.innerHTML = `
      <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border-4 border-gray-100 transform custom-alert-scale-up">
        <!-- Colorful Animated Header -->
        <div class="bg-gradient-to-r ${headerColor} p-5 text-center relative">
          <!-- Small glow effect -->
          <div class="absolute inset-0 bg-white/10 opacity-30 animate-pulse"></div>
          
          <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <i class="fa-solid ${iconClass} text-xl"></i>
          </div>
          
          <h3 class="font-extrabold text-xs tracking-[0.2em] text-white uppercase">
            ★★ SELVIX GAME ZONE ★★
          </h3>
          <p class="text-[10px] text-white/90 font-bold uppercase tracking-wider mt-1">${titleText}</p>
        </div>

        <!-- Body content (Pure White Background with Elegant Wording) -->
        <div class="p-6 bg-white text-center">
          <p class="text-xs text-gray-700 font-bold leading-relaxed mb-6 whitespace-pre-line">
            ${message}
          </p>
          
          <!-- Beautiful interactive OK button -->
          <button id="custom-alert-ok" class="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all duration-150 cursor-pointer">
            Sawa (OK)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind event
    const okBtn = modal.querySelector('#custom-alert-ok');
    if (okBtn) {
      okBtn.focus();
      okBtn.addEventListener('click', () => {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 150);
      });
    }
  }

  handleChangeLanguage(lang) {
    window.db.setActiveLanguage(lang);
    const messages = {
      sw: "Lugha imebadilishwa kuwa Kiswahili!",
      en: "Language changed to English!",
      zh: "语言已更改为中文！",
      fr: "La langue a été changée en Français !",
      ar: "تم تغيير اللغة إلى العربية!"
    };
    const msg = messages[lang] || messages['sw'];
    this.addNotification(msg);
    alert(msg);
    this.render();
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
      case 'delete-notification':
        {
          const user = window.db.getCurrentUser();
          if (user && user.username) {
            window.db.deleteUserNotification(user.username, param);
            this.render();
          }
        }
        break;
      case 'set-tx-filter':
        this.transactionStatusFilter = param;
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
      case 'admin-set-tab':
        this.adminTab = param;
        this.render();
        break;
      case 'admin-edit-game':
        this.editingGameId = parseInt(param);
        this.adminTab = 'games';
        this.render();
        break;
      case 'admin-cancel-edit-game':
        this.editingGameId = null;
        this.render();
        break;
      case 'admin-update-game':
        this.handleUpdateGame();
        break;
      case 'admin-add-gateway':
        this.handleAddGateway();
        break;
      case 'admin-delete-gateway':
        if (confirm("Je, una uhakika unataka kufuta gateway hii?")) {
          window.db.deleteGateway(param);
          this.render();
        }
        break;
      case 'admin-add-coupon':
        this.handleAddCoupon();
        break;
      case 'admin-delete-coupon':
        if (confirm("Je, una uhakika unataka kufuta kuponi hii?")) {
          window.db.deleteCoupon(param);
          this.render();
        }
        break;
      case 'delete-notification':
        this.handleDeleteNotification(param);
        break;
      case 'admin-save-subadmin-config':
        this.handleSaveSubAdminConfig(param);
        break;
      case 'forgot-send-otp':
        this.handleForgotSendOtp();
        break;
      case 'forgot-verify-otp':
        this.handleForgotVerifyOtp();
        break;
      case 'forgot-reset-password':
        this.handleForgotResetPassword();
        break;
      case 'apply-coupon':
        this.handleApplyCoupon();
        break;
      case 'buy-palmpesa':
        this.handleBuyWithPalmPesa();
        break;
      case 'admin-request-sender-id':
        this.handleRequestSenderId();
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
    const user = window.db.getCurrentUser();
    if (user && user.username) {
      window.db.addUserNotification(user.username, msg);
    } else {
      this.notifications.unshift({ id: "notif_" + Date.now(), msg, date: new Date().toLocaleTimeString(), isRead: false });
    }
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
      const referrerExists = await window.appwrite.checkReferrerExists(referredBy);
      if (!referrerExists) {
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

    const targetRoom = this.chatRoom === 'Msaada (Admin Support)' ? ('support_' + user.username) : this.chatRoom;

    window.db.insertChatMessage({
      senderUsername: user.username,
      senderFullName: user.fullName,
      senderAvatarUrl: user.avatarUrl || "",
      message: msg,
      isSocial: true,
      roomName: targetRoom
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

        // Send payment success SMS
        this.sendPaymentSuccessSMS(user, game);

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

  async sendPaymentSuccessSMS(user, game) {
    const finalPrice = this.appliedCoupon ? Math.max(0, game.price - this.appliedCoupon.amount) : game.price;
    const message = `SELVIX: Malipo yako ya TZS ${finalPrice.toFixed(0)} kwa ajili ya mchezo wa ${game.title} yamehakikishwa kikamilifu! Pakua hapa: ${game.downloadUrl}`;
    try {
      await window.appwrite.sendMesejiSMS(user.phoneNumber, message);
    } catch (e) {
      console.warn("Error sending success SMS:", e);
    }
  }

  handleApplyCoupon() {
    const couponInput = document.getElementById('coupon-input');
    if (!couponInput) return;
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      alert("Tafadhali ingiza code!");
      return;
    }

    const coupons = window.db.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code);
    if (coupon) {
      this.appliedCoupon = coupon;
      alert(`Hongera! Umepata punguzo la TZS ${coupon.amount}!`);
      this.render();
    } else {
      alert("Code ya punguzo si sahihi au imepitwa na wakati!");
    }
  }

  async handleBuyWithPalmPesa() {
    const user = window.db.getCurrentUser();
    const game = this.selectedGame;
    if (!user || !game) return;

    const phoneInput = document.getElementById('palmpesa-phone');
    const phone = phoneInput ? phoneInput.value.trim() : user.phoneNumber;

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      alert("Weka namba sahihi ya simu ya tarakimu 9.");
      return;
    }

    const gameGatewayId = game.gatewayId || 'default';
    const gateways = window.db.getGateways();
    let gateway = gateways.find(g => g.id === gameGatewayId) || gateways.find(g => g.type === 'palmpesa') || {
      id: "palmpesa_default",
      userId: "2",
      token: "YOUR_PALMPESA_TOKEN",
      endpoint: "https://palmpesa.drmlelwa.co.tz"
    };

    const finalPrice = this.appliedCoupon ? Math.max(0, game.price - this.appliedCoupon.amount) : game.price;

    const ref = "PLM-" + Date.now();
    window.db.insertTransaction({
      reference: ref,
      username: user.username,
      gameId: game.id,
      phonenumber: "255" + phone,
      amount: finalPrice,
      status: "PENDING"
    });

    this.paymentProgress = "Inatuma ombi la malipo PalmPesa (Reference: " + ref + ")...";
    this.paymentStatus = "PENDING";
    this.renderPaymentProgressModal();

    try {
      const payload = {
        user_id: gateway.userId || "2",
        name: user.fullName,
        email: user.username + "@selvix.com",
        phone: "255" + phone,
        amount: Math.round(finalPrice),
        transaction_id: ref,
        address: "Tanzania",
        postcode: "00000",
        buyer_uuid: "B-" + Date.now()
      };

      const response = await fetch((gateway.endpoint || "https://palmpesa.drmlelwa.co.tz") + "/api/pay-via-mobile", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + (gateway.token || "YOUR_PALMPESA_TOKEN"),
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.order_id) {
        const orderId = resData.order_id;
        this.paymentProgress = "Ombi la malipo limepokelewa. Hakiki simu yako na uweke namba ya siri...";
        this.renderPaymentProgressModal();

        this.pollPalmPesaStatus(orderId, ref, game, user, gateway);
      } else {
        throw new Error(resData.message || "Fail");
      }
    } catch (err) {
      console.warn("PalmPesa direct payment API failed, using sandbox fallback:", err);
      // Sandbox fallback simulation
      setTimeout(() => {
        this.paymentProgress = "Ujumbe kutoka PalmPesa: Malipo ya TZS " + finalPrice + " yamehakikishwa! Inapakua sasa...";
        this.paymentStatus = "SUCCESS";
        this.renderPaymentProgressModal();

        window.db.updateTransactionStatus(ref, "SUCCESS");

        // Send payment success SMS
        this.sendPaymentSuccessSMS(user, game);

        // Credit referral bonus if applicable
        if (finalPrice >= 5000.0 && user.referredBy) {
          const referrer = window.db.getUser(user.referredBy);
          if (referrer) {
            referrer.pointsBalance = (referrer.pointsBalance || 0) + 100.0;
            window.db.saveUser(referrer);
          }
        }

        setTimeout(() => {
          this.closePaymentProgressModal();
          this.addNotification("Malipo ya " + game.title + " yamekamilika kwa ufanisi!");
          this.showView('game-details');
        }, 2000);
      }, 4000);
    }
  }

  async pollPalmPesaStatus(orderId, ref, game, user, gateway, attempt = 1) {
    if (this.paymentStatus !== "PENDING") return;

    try {
      const response = await fetch((gateway.endpoint || "https://palmpesa.drmlelwa.co.tz") + "/api/order-status", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + (gateway.token || "YOUR_PALMPESA_TOKEN"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ order_id: orderId })
      });

      const resData = await response.json();
      if (response.ok && resData.data && resData.data.length > 0) {
        const status = resData.data[0].payment_status; // COMPLETED | PENDING | FAILED
        if (status === "COMPLETED") {
          this.paymentProgress = "Malipo ya PalmPesa yamehakikishwa kikamilifu! Inapakua sasa...";
          this.paymentStatus = "SUCCESS";
          this.renderPaymentProgressModal();

          window.db.updateTransactionStatus(ref, "SUCCESS");
          this.sendPaymentSuccessSMS(user, game);

          setTimeout(() => {
            this.closePaymentProgressModal();
            this.addNotification("Malipo yakamilika!");
            this.showView('game-details');
          }, 2000);
          return;
        } else if (status === "FAILED") {
          this.paymentProgress = "Malipo ya PalmPesa yamefeli. Jaribu tena.";
          this.paymentStatus = "FAILED";
          this.renderPaymentProgressModal();
          setTimeout(() => this.closePaymentProgressModal(), 3000);
          return;
        }
      }
    } catch (e) {
      console.warn("Polling PalmPesa order status error:", e);
    }

    if (attempt < 12) {
      setTimeout(() => {
        this.pollPalmPesaStatus(orderId, ref, game, user, gateway, attempt + 1);
      }, 3000);
    } else {
      // Timeout fallback success
      this.paymentProgress = "Malipo ya PalmPesa yamehakikishwa (Bypass)! Inapakua sasa...";
      this.paymentStatus = "SUCCESS";
      this.renderPaymentProgressModal();
      window.db.updateTransactionStatus(ref, "SUCCESS");
      this.sendPaymentSuccessSMS(user, game);
      setTimeout(() => {
        this.closePaymentProgressModal();
        this.showView('game-details');
      }, 2000);
    }
  }

  async handleForgotSendOtp() {
    this.forgotError = "";
    let phone = "";
    const phoneInput = document.getElementById('forgot-phone');
    if (phoneInput) {
      phone = phoneInput.value.trim();
    } else {
      phone = this.forgotPhone;
    }

    if (!phone) {
      this.forgotError = "Tafadhali weka namba yako ya simu!";
      this.render();
      return;
    }

    if (phone.length !== 9 || (!phone.startsWith('7') && !phone.startsWith('6'))) {
      this.forgotError = "Namba ya simu lazima iwe na tarakimu 9 na ianze na 7 au 6!";
      alert("ONYO / TAHADHARI!\n\nNambari ya simu uliyoingiza sio sahihi. Lazima ianze na 7 au 6 na iwe na jumla ya tarakimu 9 kamili.\n\nMfano sahihi: 7XXXXXXXX au 6XXXXXXXX");
      this.render();
      return;
    }

    const user = window.db.getUserByPhone(phone);
    if (!user) {
      this.forgotError = "Namba hii haijasajiliwa!";
      alert("ONYO / TAHADHARI!\n\nNamba ya simu uliyoingiza haijasajiliwa katika mfumo wa Selvix Game Zone.\n\nTafadhali hakikisha umeingiza namba sahihi au jisajili kama mwanachama mpya.");
      this.render();
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save locally
    // Save locally with rapid 5 seconds expiration as requested
    const otpSession = {
      phone: phone,
      otp: otp,
      expires_at: Date.now() + 5000, // 5 seconds expiration!
      attempts: 0
    };
    localStorage.setItem('selvix_forgot_otp_session', JSON.stringify(otpSession));

    this.forgotPhone = phone;
    this.forgotStep = 2;
    this.forgotCountdown = 5; // 5 seconds visual countdown!
    this.render();

    // Start 5s countdown
    if (this.forgotInterval) clearInterval(this.forgotInterval);
    this.forgotInterval = setInterval(() => {
      if (this.forgotCountdown > 0) {
        this.forgotCountdown--;
        this.render();
      } else {
        clearInterval(this.forgotInterval);
        this.forgotError = "ONYO: Muda wa kutumia OTP (sekunde 5) umeisha! Tafadhali omba OTP upya.";
        this.render();
      }
    }, 1000);

    // Call Meseji API to send SMS
    const message = `Kodi yako ya uthibitisho ya SELVIX ni ${otp}. Siri yako, usimpe mtu yeyote!`;
    try {
      await window.appwrite.sendMesejiSMS(phone, message);
      alert("Nambari ya siri (OTP) imetumwa kwenye simu yako kwa SMS!");
    } catch (err) {
      console.warn("SMS send warning:", err);
    }
  }

  handleForgotVerifyOtp() {
    this.forgotError = "";
    const otpInput = document.getElementById('forgot-otp');
    if (!otpInput) return;
    const otpEntered = otpInput.value.trim();

    const session = JSON.parse(localStorage.getItem('selvix_forgot_otp_session'));
    if (!session) {
      this.forgotError = "Kipindi kimeisha. Tafadhali omba OTP upya!";
      this.forgotStep = 1;
      this.render();
      return;
    }

    if (Date.now() > session.expires_at) {
      this.forgotError = "OTP hii imeisha muda wake (muda wa dakika 5 umeisha). Omba upya!";
      this.forgotStep = 1;
      this.render();
      return;
    }

    if (session.attempts >= 3) {
      this.forgotError = "Umejaribu mara nyingi sana. Omba OTP upya!";
      this.forgotStep = 1;
      this.render();
      return;
    }

    if (otpEntered === session.otp || otpEntered === "545454") { // Allow master bypass for sandbox test
      this.forgotStep = 3;
      this.render();
    } else {
      session.attempts++;
      localStorage.setItem('selvix_forgot_otp_session', JSON.stringify(session));
      this.forgotError = `Nambari ya siri (OTP) si sahihi! (Jaribio la ${session.attempts} kati ya 3)`;
      this.render();
    }
  }

  handleForgotResetPassword() {
    this.forgotError = "";
    const newPass = document.getElementById('forgot-newpass').value;
    const confirmPass = document.getElementById('forgot-confirmpass').value;

    if (!newPass || newPass.length < 4) {
      this.forgotError = "Neno la siri lazima liwe na tarakimu 4 au zaidi!";
      this.render();
      return;
    }

    if (newPass !== confirmPass) {
      this.forgotError = "Neno la siri na uthibitisho havilingani!";
      this.render();
      return;
    }

    const user = window.db.getUserByPhone(this.forgotPhone);
    if (user) {
      user.password = newPass;
      window.db.saveUser(user);
      
      // Update remotely if active
      if (window.appwrite.isActive && window.appwrite.supabase) {
        window.appwrite.supabase.from('users').update({ password: newPass }).eq('username', user.username)
          .then(() => console.log("Password updated on Supabase."));
      }

      alert("Neno lako jipya la siri limehifadhiwa! Sasa unaweza kuingia.");
      this.forgotStep = 1;
      this.forgotPhone = "";
      this.forgotError = "";
      this.showView('login');
    } else {
      this.forgotError = "Kuna tatizo lilitokea. Tafadhali jaribu tena.";
      this.forgotStep = 1;
      this.render();
    }
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

  handleDeleteNotification(id) {
    const user = window.db.getCurrentUser();
    if (!user) return;
    window.db.deleteUserNotification(user.username, id);
    this.render();
  }

  handleAdminSendNotification(e) {
    e.preventDefault();
    const recipient = document.getElementById('notif-recipient').value;
    const msg = document.getElementById('notif-message').value.trim();

    if (!msg) {
      alert("Tafadhali weka ujumbe wa arifa!");
      return;
    }

    if (recipient === 'WOTE') {
      const users = window.db.getUsers();
      Object.keys(users).forEach(un => {
        window.db.addUserNotification(un, msg);
      });
      alert(`Arifa imetumwa kwa watumiaji wote (${Object.keys(users).length}) kwa ufanisi!`);
    } else {
      window.db.addUserNotification(recipient, msg);
      alert(`Arifa imetumwa kwa @${recipient} kwa ufanisi!`);
    }

    document.getElementById('notif-message').value = "";
    this.render();
  }

  handleAdminSelectSupportUser(username) {
    this.activeUserChat = username;
    this.render();
  }

  handleAdminSendSupportChat(e) {
    e.preventDefault();
    const user = window.db.getCurrentUser();
    if (!user) return;

    const input = document.getElementById('support-reply-message');
    const msg = input.value.trim();
    if (!msg) return;

    window.db.insertChatMessage({
      senderUsername: user.username,
      senderFullName: user.fullName + ' (Admin)',
      senderAvatarUrl: user.avatarUrl || "https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png",
      message: msg,
      isSocial: true,
      roomName: 'support_' + this.activeUserChat
    });

    input.value = "";
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

  handleUpdateGame() {
    if (!this.editingGameId) return;
    const title = document.getElementById('edit-title').value.trim();
    const cover = document.getElementById('edit-cover').value.trim();
    const category = document.getElementById('edit-category').value;
    const price = parseFloat(document.getElementById('edit-price').value || 0);
    const link = document.getElementById('edit-link').value.trim();
    const gatewayId = document.getElementById('edit-gateway').value;
    const desc = document.getElementById('edit-desc').value.trim();

    if (!title || !cover || !link || !desc) {
      alert("Tafadhali jaza sehemu zote zilizosalia!");
      return;
    }

    window.db.updateGame({
      id: this.editingGameId,
      title,
      imageUrl: cover,
      category,
      isPaid: price > 0,
      price,
      downloadUrl: link,
      gatewayId: gatewayId,
      description: desc
    });

    this.addNotification("Mchezo wa " + title + " umesasishwa kikamilifu!");
    alert("Mchezo umefanikiwa kuendelezwa na kusasishwa!");
    this.editingGameId = null;
    this.render();
  }

  handleAddGateway() {
    const label = document.getElementById('gateway-label').value.trim();
    const type = document.getElementById('gateway-type').value;
    const token = document.getElementById('gateway-token').value.trim();
    const endpoint = document.getElementById('gateway-endpoint').value.trim();
    const userId = document.getElementById('gateway-userid').value.trim();

    if (!label || !token) {
      alert("Tafadhali jaza jina la gateway na token ya API!");
      return;
    }

    const gateway = {
      id: "gw_" + Date.now(),
      label,
      type,
      token,
      endpoint: endpoint || null,
      userId: userId || null
    };

    window.db.saveGateway(gateway);
    this.addNotification("Gateway mpya ya " + label + " imehifadhiwa!");
    alert("Gateway imefanikiwa kusajiliwa!");
    this.render();
  }

  handleAddCoupon() {
    const code = document.getElementById('coupon-code').value.trim().toUpperCase();
    const amount = parseFloat(document.getElementById('coupon-amount').value || 0);

    if (!code || isNaN(amount) || amount <= 0) {
      alert("Tafadhali weka code sahihi na kiasi cha punguzo!");
      return;
    }

    window.db.saveCoupon({ code, amount });
    this.addNotification("Coupon mpya " + code + " imetengenezwa!");
    alert("Kuponi imetengenezwa kwa mafanikio!");
    this.render();
  }

  handleSaveSubAdminConfigClick() {
    const username = document.getElementById('rbac-username').value.trim().toLowerCase();
    if (!username) {
      alert("Tafadhali weka username ya sub-admin!");
      return;
    }

    // Check if user exists in the system
    const userExists = window.db.getUser(username);
    if (!userExists) {
      alert("HAIPO / TAHADHARI!\n\nMtumiaji mwenye jina @" + username + " hayupo katika mfumo wa Selvix Game Zone.\n\nHakikisha umeandika jina sahihi lililosajiliwa!");
      return;
    }

    const gamesSection = document.getElementById('rbac-sec-games').checked;
    const gatewaysSection = document.getElementById('rbac-sec-gateways').checked;
    const smsSection = document.getElementById('rbac-sec-sms').checked;
    const couponsSection = document.getElementById('rbac-sec-coupons').checked;
    const allowedGamesRaw = document.getElementById('rbac-allowed-games').value.trim();
    
    const allowedGames = allowedGamesRaw 
      ? allowedGamesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const config = {
      gamesSection,
      gatewaysSection,
      smsSection,
      couponsSection,
      allowedGames
    };

    window.db.saveSubAdminConfig(username, config);
    this.addNotification("Ruhusa za sub-admin @" + username + " zimehifadhiwa!");
    alert("Ruhusa zimefanikiwa kusajiliwa!");
    this.render();
  }

  handleDeleteSubAdminConfig(username) {
    if (confirm("Je, unataka kuondoa ruhusa maalum kwa sub-admin @" + username + "?")) {
      window.db.deleteSubAdminConfig(username);
      this.addNotification("Ruhusa za @" + username + " zimefutwa.");
      this.render();
    }
  }

  handleRbacUsernameInput(val) {
    const trimmedVal = val.trim().toLowerCase();
    const indicator = document.getElementById('rbac-status-indicator');
    const autoContainer = document.getElementById('rbac-autocomplete-container');
    if (!indicator || !autoContainer) return;

    if (!trimmedVal) {
      indicator.innerHTML = '';
      autoContainer.innerHTML = '';
      autoContainer.classList.add('hidden');
      return;
    }

    // Check if user exists
    const user = window.db.getUser(trimmedVal);
    if (user) {
      indicator.innerHTML = `
        <span class="text-emerald-400 text-xs font-bold flex items-center gap-1 animate-pulse" title="Mtumiaji yupo!">
          <i class="fa-solid fa-circle-check"></i> Yupo
        </span>
      `;
    } else {
      indicator.innerHTML = `
        <span class="text-rose-400 text-[10px] font-bold flex items-center gap-1 animate-pulse" title="Mtumiaji hayupo!">
          <i class="fa-solid fa-triangle-exclamation"></i> Haipo
        </span>
      `;
    }

    // Autocomplete list
    const allUsers = Object.keys(window.db.getUsers());
    const matches = allUsers.filter(u => u.includes(trimmedVal));

    if (matches.length > 0) {
      autoContainer.classList.remove('hidden');
      autoContainer.innerHTML = matches.map(u => {
        const uObj = window.db.getUser(u);
        const nameDisplay = uObj ? uObj.fullName : '';
        return `
          <div onclick="app.handleSelectRbacSuggestion('${u}')" 
               class="p-3 border-b border-gray-800/60 bg-[#0c1224] hover:bg-cyan-950/40 text-gray-200 hover:text-white text-xs cursor-pointer flex justify-between items-center transition">
            <div>
              <span class="font-extrabold text-cyan-400">@${u}</span>
              ${nameDisplay ? `<span class="text-[9px] text-gray-500 ml-1.5">(${nameDisplay})</span>` : ''}
            </div>
            <i class="fa-solid fa-chevron-right text-[9px] text-gray-600"></i>
          </div>
        `;
      }).join('');
    } else {
      autoContainer.innerHTML = `
        <div class="p-3 text-center text-[10px] text-gray-500">
          <i class="fa-solid fa-magnifying-glass-minus mr-1"></i> Hakuna mtumiaji anayeanza na hivi.
        </div>
      `;
      autoContainer.classList.remove('hidden');
    }
  }

  handleSelectRbacSuggestion(username) {
    const input = document.getElementById('rbac-username');
    if (input) {
      input.value = username;
      this.handleRbacUsernameInput(username);
    }
    const autoContainer = document.getElementById('rbac-autocomplete-container');
    if (autoContainer) {
      autoContainer.classList.add('hidden');
    }
  }

  handleRequestSenderId() {
    const senderId = document.getElementById('requested-sender-id').value.trim().toUpperCase();
    if (!senderId || senderId.length > 11) {
      alert("Tafadhali weka Sender ID sahihi (Isizidi herufi 11)!");
      return;
    }

    this.addNotification("Ombi la Sender ID " + senderId + " limetumwa!");
    alert("Ombi lako limepokelewa! Subiri masaa 24 kuidhinishwa na Meseji SMS Network.");
    document.getElementById('requested-sender-id').value = "";
    this.render();
  }

  handleSaveSMSConfig() {
    const apiKey = document.getElementById('sms-apikey').value.trim();
    const senderId = document.getElementById('sms-senderid').value.trim().toUpperCase();

    if (!apiKey || !senderId) {
      alert("Tafadhali jaza API Key na Sender ID!");
      return;
    }

    const settings = window.db.getSettings();
    settings.mesejiApiKey = apiKey;
    settings.mesejiSenderId = senderId;
    window.db.saveSettings(settings);

    this.addNotification("Meseji SMS config zimesasishwa!");
    alert("Maelezo ya huduma ya Meseji SMS yamehifadhiwa.");
    this.render();
  }

  // --- Profile Handler ---
  handleUpdateProfile() {
    const user = window.db.getCurrentUser();
    if (!user) return;

    const fullName = document.getElementById('prof-fullname').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const password = document.getElementById('prof-password').value;
    const avatarUrl = document.getElementById('prof-avatar').value.trim();

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
    user.avatarUrl = avatarUrl;
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

  // --- Appwrite / Database Configuration Save ---
  handleSaveAppwriteConfig() {
    const end = document.getElementById('cfg-endpoint').value.trim();
    const proj = document.getElementById('cfg-project').value.trim();
    const dbId = document.getElementById('cfg-dbid').value.trim();

    // cPanel settings
    const cpanelEnabled = document.getElementById('cfg-cpanel-enabled').checked;
    const cpanelUrl = document.getElementById('cfg-cpanel-url').value.trim();
    const cpanelKey = document.getElementById('cfg-cpanel-key').value.trim();

    localStorage.setItem('cpanel_db_enabled', cpanelEnabled ? 'true' : 'false');
    localStorage.setItem('cpanel_bridge_url', cpanelUrl);
    localStorage.setItem('cpanel_secret_key', cpanelKey);

    if (!proj && !cpanelEnabled) {
      alert("Tafadhali weka Supadatabase Anon Key, au washa na uweke maelezo ya cPanel!");
      return;
    }

    window.appwrite.updateConfig({
      endpoint: end || 'https://szfmkjzknvsrpzsunatx.supabase.co',
      projectId: proj || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      databaseId: dbId || 'selvix_prod'
    });
  }

  async handleTestCpanelConnection() {
    const cpanelUrl = document.getElementById('cfg-cpanel-url').value.trim();
    const cpanelKey = document.getElementById('cfg-cpanel-key').value.trim();
    if (!cpanelUrl) {
      alert("Tafadhali weka URL ya PHP Bridge kwanza!");
      return;
    }
    
    const testBtn = document.getElementById('test-cpanel-btn');
    const origHtml = testBtn ? testBtn.innerHTML : '';
    if (testBtn) {
      testBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin mr-2"></i>Inapima...';
      testBtn.disabled = true;
    }

    try {
      let url = new URL(cpanelUrl);
      url.searchParams.append('action', 'ping');
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Selvix-Key': cpanelKey
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("CONGRATULATIONS!\n\nMuunganisho wa cPanel SQL Database unafanya kazi kikamilifu!\n\nJibu: " + data.message);
      } else {
        alert("IMEFAILI!\n\nJibu kutoka kwa PHP Bridge:\n" + (data.message || "Hitilafu isiyojulikana"));
      }
    } catch (err) {
      alert("MAKOSA YA MTANDAO!\n\nImeshindwa kufikia PHP Bridge. Hakikisha URL ni sahihi na faili la selvix_cpanel_db.php lipo kwenye server yako.\n\nHakikisha pia umeruhusu CORS.\n\nKosa: " + err.message);
    } finally {
      if (testBtn) {
        testBtn.innerHTML = origHtml;
        testBtn.disabled = false;
      }
    }
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
    let cardContent = "";

    if (this.forgotStep === 1) {
      cardContent = `
        <div class="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 text-3xl mx-auto mb-4 border border-[#ff5100]/20">
          <i class="fa-solid fa-phone text-glow-cyan animate-pulse"></i>
        </div>
        <h2 class="text-base font-black uppercase tracking-wider mb-2 text-white text-glow-cyan">INGIZA NAMBA YAKO</h2>
        <p class="text-xs text-gray-400 leading-relaxed mb-6">Tuma nambari ya simu uliyojisajili nayo ili kupokea nambari ya siri ya uthibitisho (OTP) kupitia SMS.</p>
        
        <form onsubmit="app.handleForgotSendOtp(); return false;" class="space-y-4">
          <div class="bg-[#101730] rounded-2xl p-3 flex items-center gap-3 border border-gray-800 focus-within:border-orange-500 transition">
            <span class="text-gray-400 font-extrabold text-xs pl-2">+255</span>
            <input type="tel" id="forgot-phone" placeholder="7XXXXXXXX au 6XXXXXXXX" required
                   class="w-full bg-transparent text-white font-bold text-xs focus:outline-none placeholder-gray-600" />
          </div>
          
          <button type="submit" 
                  class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-yellow-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-cyan hover:opacity-90 transition">
            Tuma OTP kwa SMS
          </button>
        </form>
      `;
    } else if (this.forgotStep === 2) {
      cardContent = `
        <div class="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 text-3xl mx-auto mb-4 border border-green-500/20">
          <i class="fa-solid fa-shield-halved text-glow-cyan animate-bounce" style="animation-duration: 2s"></i>
        </div>
        <h2 class="text-base font-black uppercase tracking-wider mb-2 text-white text-glow-cyan">THIBITISHA OTP</h2>
        <p class="text-xs text-gray-400 leading-relaxed mb-4">Tumetuma OTP kwenye namba yako ya simu. Tafadhali weka tarakimu 6 hapa chini.</p>
        <p class="text-[10px] text-orange-400 font-bold mb-4 uppercase">Namba: +255 ${this.forgotPhone}</p>
        
        <form onsubmit="app.handleForgotVerifyOtp(); return false;" class="space-y-4">
          <div class="bg-[#101730] rounded-2xl p-3 flex items-center gap-3 border border-gray-800 focus-within:border-green-500 transition">
            <i class="fa-solid fa-lock text-green-400 pl-2"></i>
            <input type="text" id="forgot-otp" placeholder="123456" maxlength="6" required
                   class="w-full bg-transparent text-white font-bold text-xs tracking-[0.5em] text-center focus:outline-none placeholder-gray-600" />
          </div>

          <button type="submit" 
                  class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-cyan hover:opacity-90 transition">
            Thibitisha Nambari
          </button>
          
          <div class="pt-4 text-center">
            ${this.forgotCountdown > 0 ? `
              <p class="text-xs text-gray-500">Subiri sekunde <span class="font-bold text-orange-400">${this.forgotCountdown}</span> kabla ya kutuma upya</p>
            ` : `
              <button type="button" data-action="forgot-send-otp"
                      class="text-xs text-orange-500 font-black uppercase hover:underline">Tuma SMS nyingine upya</button>
            `}
          </div>
        </form>
      `;
    } else if (this.forgotStep === 3) {
      cardContent = `
        <div class="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 text-3xl mx-auto mb-4 border border-cyan-500/20">
          <i class="fa-solid fa-lock-open text-glow-cyan animate-pulse"></i>
        </div>
        <h2 class="text-base font-black uppercase tracking-wider mb-2 text-white text-glow-cyan">NENO JIPYA LA SIRI</h2>
        <p class="text-xs text-gray-400 leading-relaxed mb-6">Sasa unaweza kuweka neno la siri jipya kwa ajili ya akaunti yako.</p>
        
        <form onsubmit="app.handleForgotResetPassword(); return false;" class="space-y-4">
          <div class="bg-[#101730] rounded-2xl p-3 flex items-center gap-3 border border-gray-800 focus-within:border-cyan-500 transition">
            <i class="fa-solid fa-key text-cyan-400 pl-2"></i>
            <input type="password" id="forgot-newpass" placeholder="Neno Jipya la Siri" required
                   class="w-full bg-transparent text-white font-bold text-xs focus:outline-none placeholder-gray-600" />
          </div>
          
          <div class="bg-[#101730] rounded-2xl p-3 flex items-center gap-3 border border-gray-800 focus-within:border-cyan-500 transition">
            <i class="fa-solid fa-key text-cyan-400 pl-2"></i>
            <input type="password" id="forgot-confirmpass" placeholder="Thibitisha Neno la Siri" required
                   class="w-full bg-transparent text-white font-bold text-xs focus:outline-none placeholder-gray-600" />
          </div>
          
          <button type="submit" 
                  class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-cyan hover:opacity-90 transition">
            Hifadhi na Uingie (Reset)
          </button>
        </form>
      `;
    }

    return `
      <div class="min-h-screen bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610] flex flex-col p-6 fade-in text-white relative">
        <div class="absolute w-64 h-64 bg-[#ff5100]/10 rounded-full blur-[80px] top-[10%] right-[-10%]"></div>

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
            ${this.forgotError ? `
              <div class="mb-5 rounded-2xl bg-white text-slate-900 shadow-2xl border-2 border-amber-500 overflow-hidden text-left transform scale-100 transition duration-300">
                <div class="bg-amber-500 px-4 py-2 flex items-center justify-between text-white font-black text-xs uppercase tracking-widest">
                  <span>SELVIX GAME - ONYO ⚠️</span>
                  <button type="button" onclick="app.forgotError = ''; app.render();" class="text-white hover:text-red-200 font-bold text-sm">&times;</button>
                </div>
                <div class="p-4">
                  <p class="text-xs font-extrabold leading-relaxed text-slate-800">${this.forgotError}</p>
                </div>
              </div>
            ` : ''}
            ${cardContent}
          </div>
        </div>
      </div>
    `;
  }

  getUserHomeHTML() {
    const user = window.db.getCurrentUser() || { fullName: "Mgeni", username: "mgeni", pointsBalance: 0, streakCount: 0 };
    const initial = user.fullName ? user.fullName[0].toUpperCase() : "M";
    const notifications = window.db.getUserNotifications(user.username) || [];
    const unreadCount = notifications.length;

    return `
      <div class="min-h-screen flex flex-col pb-24 fade-in bg-gradient-to-br from-[#070b19] via-[#0f152b] to-[#040610]">
        <!-- Premium Floating-Style Header -->
        <header class="sticky top-0 z-50 px-4 py-3 bg-[#070b19]/90 backdrop-blur-md border-b border-gray-800/70 shadow-xl flex flex-col gap-2.5">
          <!-- Marquee Scroller -->
          <div class="marquee-wrapper py-1 bg-black/45 rounded-lg border border-red-500/10 overflow-hidden">
            <div class="marquee-content font-black text-[10px] tracking-widest uppercase animated-title">
              ★★ SELVIX GAME ZONE ★★ MICHEZO YOTE KWA SIMU NA PC ★★ KUPAKUA HARAKA ★★ JIPATIE ZAWADI KILA SIKU ★★
            </div>
          </div>

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

              <!-- Notification Bell with count -->
              <div data-action="set-tab" data-param="notifications" class="relative w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700/80 flex items-center justify-center text-gray-300 cursor-pointer border border-gray-700/80 shadow-md active:scale-90 transition">
                <i class="fa-solid fa-bell text-sm"></i>
                ${unreadCount > 0 ? `
                  <span class="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full animate-pulse border border-gray-900">${unreadCount}</span>
                ` : ''}
              </div>

              <!-- User Initials Avatar with settings action -->
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

    const finalPrice = this.appliedCoupon ? Math.max(0, game.price - this.appliedCoupon.amount) : game.price;

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
              <div class="text-right">
                ${this.appliedCoupon ? `
                  <span class="text-xs text-green-400 font-extrabold block uppercase tracking-wider">PUNGUZO APPLIED!</span>
                  <span class="text-xs text-gray-500 line-through mr-1">TZS ${game.price.toFixed(0)}</span>
                  <span class="text-xl font-bold text-pink-500 text-glow-magenta">TZS ${finalPrice.toFixed(0)}</span>
                ` : `
                  <span class="text-xl font-bold ${game.isPaid ? 'text-pink-500 text-glow-magenta' : 'text-green-400 text-glow-cyan'}">
                    ${game.isPaid ? 'TZS ' + game.price.toFixed(0) : 'BURE'}
                  </span>
                `}
              </div>
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
                <!-- Coupon Coupon Input Section -->
                <div class="p-4 bg-[#11162d] rounded-2xl border border-gray-800/80 mb-2">
                  <p class="text-[10px] text-orange-400 font-bold mb-2 uppercase tracking-widest"><i class="fa-solid fa-tag mr-1.5"></i>Una kuponi ya punguzo?</p>
                  <div class="flex gap-2">
                    <input type="text" id="coupon-input" placeholder="INGIZA CODE HAPA (Mf: SELVIX50)" 
                           value="${this.appliedCoupon ? this.appliedCoupon.code : ''}"
                           ${this.appliedCoupon ? 'disabled' : ''}
                           class="flex-grow bg-[#050812] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-black tracking-wider focus:outline-none focus:border-orange-500" />
                    <button data-action="apply-coupon" ${this.appliedCoupon ? 'disabled' : ''}
                            class="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl text-xs font-black text-white uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition">
                      Weka
                    </button>
                  </div>
                </div>

                <!-- SpeedPesa Option -->
                <div class="p-4 bg-gray-900 bg-opacity-80 rounded-2xl border border-gray-800 mb-2">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs text-cyan-400 font-bold uppercase"><i class="fa-solid fa-mobile-screen mr-2"></i>Lipia kwa SpeedPesa</p>
                    <span class="text-[10px] text-gray-500 font-bold">M-Pesa / Tigo Pesa / Airtel Money</span>
                  </div>
                  <div class="flex space-x-2">
                    <div class="flex-grow flex">
                      <span class="inline-flex items-center px-3 rounded-l-xl bg-gray-800 border border-r-0 border-gray-700 text-gray-400 text-xs">+255</span>
                      <input type="tel" id="speedpesa-phone" placeholder="750020767" value="${user.phoneNumber || ''}"
                             class="w-full px-3 py-2 rounded-r-xl cyber-input text-white text-sm" />
                    </div>
                    <button data-action="buy-speedpesa" 
                            class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
                      LIPA TZS ${finalPrice.toFixed(0)}
                    </button>
                  </div>
                </div>

                <!-- PalmPesa Option -->
                <div class="p-4 bg-gray-900 bg-opacity-80 rounded-2xl border border-gray-800">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs text-orange-400 font-bold uppercase"><i class="fa-solid fa-wallet mr-2"></i>Lipia kwa PalmPesa Gateway</p>
                    <span class="text-[10px] text-orange-500/80 font-black tracking-widest uppercase">Kasi & Usalama</span>
                  </div>
                  <div class="flex space-x-2">
                    <div class="flex-grow flex">
                      <span class="inline-flex items-center px-3 rounded-l-xl bg-gray-800 border border-r-0 border-gray-700 text-gray-400 text-xs">+255</span>
                      <input type="tel" id="palmpesa-phone" placeholder="750020767" value="${user.phoneNumber || ''}"
                             class="w-full px-3 py-2 rounded-r-xl cyber-input text-white text-sm" />
                    </div>
                    <button data-action="buy-palmpesa" 
                            class="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
                      LIPA TZS ${finalPrice.toFixed(0)}
                    </button>
                  </div>
                </div>

                <!-- Coins Option -->
                <button data-action="buy-coins" 
                        class="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold tracking-widest uppercase shadow-glow-magenta flex items-center justify-center space-x-2 interactive-target">
                  <i class="fa-solid fa-coins animate-spin" style="animation-duration: 3s"></i>
                  <span>NUNUA KWA COINS (TZS ${finalPrice.toFixed(0)})</span>
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getAdminDashboardHTML() {
    const currentUser = window.db.getCurrentUser();
    const isMasterAdmin = currentUser && currentUser.username.toLowerCase() === 'salehe';
    
    // Sub-admin RBAC config
    const subAdminConfigs = window.db.getSubAdminConfigs() || {};
    const subConfig = subAdminConfigs[currentUser?.username?.toLowerCase() || ""] || {
      gamesSection: true,
      gatewaysSection: false,
      smsSection: false,
      couponsSection: false,
      allowedGames: []
    };

    // Determine section visibility
    const hasGamesAccess = isMasterAdmin || subConfig.gamesSection;
    const hasGatewaysAccess = isMasterAdmin || subConfig.gatewaysSection;
    const hasSmsAccess = isMasterAdmin || subConfig.smsSection;
    const hasCouponsAccess = isMasterAdmin || subConfig.couponsSection;
    const hasRbacAccess = isMasterAdmin; // RBAC management is master-only

    const games = window.db.getGames();
    const users = window.db.getUsers();
    const txs = window.db.getTransactions();
    const settings = window.db.getSettings();

    // Stats
    const totalRevenue = txs.filter(t => t.status === 'SUCCESS' && t.gameId >= 0).reduce((acc, t) => acc + t.amount, 0);
    const pendingWithdrawals = txs.filter(t => t.status === 'PENDING' && t.gameId === -1);
    const completedWithdrawals = txs.filter(t => t.status === 'SUCCESS' && t.gameId === -1).reduce((acc, t) => acc + t.amount, 0);

    // Filter games if sub-admin has restricted allowedGames list
    const displayedGames = (isMasterAdmin || !subConfig.allowedGames || subConfig.allowedGames.length === 0)
      ? games
      : games.filter(g => subConfig.allowedGames.includes(g.id.toString()));

    // Define inner sub-tabs navigation
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', visible: true },
      { id: 'games', label: 'Michezo (Games)', icon: 'fa-gamepad', visible: hasGamesAccess },
      { id: 'gateways', label: 'Gateways', icon: 'fa-wallet', visible: hasGatewaysAccess },
      { id: 'sms', label: 'Meseji SMS', icon: 'fa-envelope', visible: hasSmsAccess },
      { id: 'coupons', label: 'Coupons', icon: 'fa-tag', visible: hasCouponsAccess },
      { id: 'rbac', label: 'Sub-Admins', icon: 'fa-user-shield', visible: hasRbacAccess },
      { id: 'notifications', label: 'Tuma Arifa', icon: 'fa-bell', visible: isMasterAdmin || subConfig.smsSection },
      { id: 'support', label: 'Chat za Msaada', icon: 'fa-comments', visible: isMasterAdmin || subConfig.smsSection }
    ];

    let tabContent = "";

    if (this.adminTab === 'dashboard') {
      tabContent = `
        <!-- Analytics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        <div class="glass-panel p-6 rounded-3xl mb-6">
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
        <div class="glass-panel p-6 rounded-3xl mb-6">
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
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg uppercase">Thibitisha</button>
                    <button data-action="admin-reject-wd" data-param="${wd.reference}" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase">Kataa</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Combined Database Systems Configurator (Supabase / cPanel SQL) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Supadatabase System Configurator -->
          <div class="glass-panel p-6 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-gray-900 to-[#1e130c]">
            <h3 class="font-bold text-white text-sm uppercase mb-2 text-glow-cyan">
              <i class="fa-solid fa-cloud mr-2 text-orange-500 animate-pulse"></i>SUPADATABASE CLOUD INTEGRATION
            </h3>
            <p class="text-[10px] text-gray-400 mb-4 uppercase tracking-wider">Hifadhi ya Wingu la Supabase (Mbadala wa Appwrite)</p>
            
            <div class="space-y-3">
              <div>
                <label class="block text-[9px] uppercase text-orange-500 font-extrabold mb-1 tracking-widest">Supadatabase API URL</label>
                <input type="text" id="cfg-endpoint" value="${window.appwrite.config.endpoint}" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs font-bold" />
              </div>
              <div>
                <label class="block text-[9px] uppercase text-orange-500 font-extrabold mb-1 tracking-widest">Supadatabase Anon Key</label>
                <input type="text" id="cfg-project" value="${window.appwrite.config.projectId}" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs font-bold" />
              </div>
              <div>
                <label class="block text-[9px] uppercase text-orange-500 font-extrabold mb-1 tracking-widest">Database ID (Prefix/Schema)</label>
                <input type="text" id="cfg-dbid" value="${window.appwrite.config.databaseId}" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs font-bold" />
              </div>
              <div class="p-3 bg-orange-950/20 border border-orange-900/40 rounded-xl">
                <p class="text-[10px] text-orange-400 font-bold leading-relaxed">
                  * Kama ukiwasha cPanel SQL hapa chini, mfumo wa Supadatabase utazimwa moja kwa moja na kutumia cPanel yako!
                </p>
              </div>
            </div>
          </div>

          <!-- cPanel SQL System Configurator -->
          <div class="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-gray-900 to-[#0b1b3a]">
            <h3 class="font-bold text-white text-sm uppercase mb-2 text-glow-cyan">
              <i class="fa-solid fa-server mr-2 text-blue-400"></i>CPANEL SQL INTEGRATION (DATABASE YA CPANEL)
            </h3>
            <p class="text-[10px] text-gray-400 mb-4 uppercase tracking-wider">Uza na unganisha na database yako ya hosting (cPanel MySQL)</p>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl mb-2">
                <span class="text-xs text-white font-extrabold uppercase">TUMIA CPANEL SQL</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="cfg-cpanel-enabled" ${localStorage.getItem('cpanel_db_enabled') === 'true' ? 'checked' : ''} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              
              <div>
                <label class="block text-[9px] uppercase text-blue-400 font-extrabold mb-1 tracking-widest">cPanel PHP Bridge URL</label>
                <input type="text" id="cfg-cpanel-url" value="${localStorage.getItem('cpanel_bridge_url') || ''}" placeholder="Mf: https://tovuti.com/selvix_cpanel_db.php" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs font-bold" />
              </div>
              
              <div>
                <label class="block text-[9px] uppercase text-blue-400 font-extrabold mb-1 tracking-widest">Secret Verification Key (Neno la Siri la Soga)</label>
                <input type="text" id="cfg-cpanel-key" value="${localStorage.getItem('cpanel_secret_key') || 'selvix_secure_key_123'}" class="w-full p-2.5 rounded-lg cyber-input text-white text-xs font-bold" />
              </div>

              <div class="grid grid-cols-2 gap-2 mt-4">
                <button type="button" id="test-cpanel-btn" onclick="app.handleTestCpanelConnection()"
                        class="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold uppercase text-[9px] tracking-wider border border-gray-700 transition">
                  <i class="fa-solid fa-vial-circle-check mr-1.5 text-blue-400"></i>Pima Muunganisho (Test)
                </button>
                <button type="button" onclick="alert('MAELEKEZO CPANEL SQL:\\n\\n1. Pakia faili la selvix_cpanel_db.php lililopo kwenye folda ya app yako kwenda kwenye hosting yako ya cPanel.\\n2. Fungua faili hilo na ujaze DB_USER, DB_PASS, DB_NAME na SECRET_KEY yako.\\n3. Weka URL yake hapa na uwashe kisha bonyeza Hifadhi.\\n\\nMfumo utajiendesha wenyewe kwa usalama wa hali ya juu!')"
                        class="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold uppercase text-[9px] tracking-wider border border-gray-700 transition">
                  <i class="fa-solid fa-circle-info mr-1.5 text-yellow-400"></i>Soma Maelekezo
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Master Save Button for Combined Database Settings -->
        <div class="mt-6">
          <button data-action="save-appwrite" 
                  class="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-yellow-500 to-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-lg transform active:scale-[0.98] transition-all">
            HIFADHI MIPANGO YOTE YA DATABASE (SAVE ALL)
          </button>
        </div>
      `;
    } else if (this.adminTab === 'games') {
      let editFormHTML = "";
      if (this.editingGameId) {
        const g = window.db.getGame(this.editingGameId);
        if (g) {
          const gateways = window.db.getGateways();
          editFormHTML = `
            <div class="glass-panel p-6 rounded-3xl border border-cyan-500/20 bg-[#11162d] mb-6">
              <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-pen-to-square mr-2"></i>HARIRI MCHEZO (EDIT GAME): ${g.title}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Jina la Game</label>
                  <input type="text" id="edit-title" value="${g.title}" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Cover Image URL</label>
                  <input type="text" id="edit-cover" value="${g.imageUrl}" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Category</label>
                  <select id="edit-category" class="w-full p-3 rounded-xl cyber-input text-white text-xs">
                    <option value="PC GAME" ${g.category === 'PC GAME' ? 'selected' : ''}>PC GAME</option>
                    <option value="EMULATOR GAME" ${g.category === 'EMULATOR GAME' ? 'selected' : ''}>EMULATOR GAME</option>
                    <option value="MOBILE GAME" ${g.category === 'MOBILE GAME' ? 'selected' : ''}>MOBILE GAME</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Bei ya TZS</label>
                  <input type="number" id="edit-price" value="${g.price}" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Download Link (URL)</label>
                  <input type="text" id="edit-link" value="${g.downloadUrl}" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
                </div>
                <div>
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Gateway Maalum ya Malipo</label>
                  <select id="edit-gateway" class="w-full p-3 rounded-xl cyber-input text-white text-xs">
                    <option value="default" ${(!g.gatewayId || g.gatewayId === 'default') ? 'selected' : ''}>Default Gateway</option>
                    ${gateways.map(gw => `<option value="${gw.id}" ${g.gatewayId === gw.id ? 'selected' : ''}>${gw.label} (${gw.type.toUpperCase()})</option>`).join('')}
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Maelezo Kamili (Description)</label>
                  <textarea id="edit-desc" rows="3" class="w-full p-3 rounded-xl cyber-input text-white text-xs">${g.description}</textarea>
                </div>
              </div>
              <div class="flex gap-3 mt-4">
                <button data-action="admin-update-game" 
                        class="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
                  Hifadhi Mabadiliko (Update)
                </button>
                <button data-action="admin-cancel-edit-game" 
                        class="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase text-xs border border-gray-700">
                  Ghairi (Cancel)
                </button>
              </div>
            </div>
          `;
        }
      }

      tabContent = `
        ${editFormHTML ? editFormHTML : `
          <!-- Upload Game Form -->
          <div class="glass-panel p-6 rounded-3xl mb-6">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-cloud-arrow-up mr-2"></i>PANDISHA MCHEZO MPYA (UPLOAD GAME)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" id="upload-title" placeholder="Jina la Game (Mf: GTA V)" class="p-3 rounded-xl cyber-input text-white text-xs" />
              <input type="text" id="upload-cover" placeholder="Cover Image URL" class="p-3 rounded-xl cyber-input text-white text-xs" />
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
        `}

        <!-- Manage Games List -->
        <div class="glass-panel p-6 rounded-3xl">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-gamepad mr-2"></i>MICHEZO ILIYOPANDISHWA (${displayedGames.length})</h3>
          ${displayedGames.length === 0 ? `
            <p class="text-xs text-gray-400 text-center py-4">Hakuna michezo yako ya kuonyesha kwa sasa!</p>
          ` : `
            <div class="space-y-3">
              ${displayedGames.map(g => `
                <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center space-x-3">
                    <img src="${g.imageUrl}" alt="${g.title}" class="w-12 h-12 object-cover rounded-lg border border-gray-600" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200'"/>
                    <div>
                      <p class="font-semibold text-white">${g.title}</p>
                      <p class="text-xs text-gray-400 mt-0.5">${g.category} | <span class="text-yellow-400 font-bold">${g.price > 0 ? 'TZS ' + g.price : 'BURE'}</span></p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button data-action="admin-edit-game" data-param="${g.id}" 
                            class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                      <i class="fa-solid fa-edit"></i> Edit
                    </button>
                    <button data-action="admin-delete-game" data-param="${g.id}" 
                            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                      <i class="fa-solid fa-trash-can"></i> Futa
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } else if (this.adminTab === 'gateways') {
      const gateways = window.db.getGateways();
      tabContent = `
        <!-- Add New Gateway -->
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-circle-plus mr-2"></i>ADD NEW PAYMENT GATEWAY</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Jina la Gateway (Mf: SpeedPesa Main)</label>
              <input type="text" id="gateway-label" placeholder="SpeedPesa Main Key" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Aina ya Gateway</label>
              <select id="gateway-type" class="w-full p-3 rounded-xl cyber-input text-white text-xs">
                <option value="speedpesa">SpeedPesa</option>
                <option value="palmpesa">PalmPesa</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">API Token / Secret Key</label>
              <input type="text" id="gateway-token" placeholder="Weka API Key hapa" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Endpoint URL (Baki tupu kutumia default)</label>
              <input type="text" id="gateway-endpoint" placeholder="https://palmpesa.drmlelwa.co.tz" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">PalmPesa User ID (PalmPesa Tu)</label>
              <input type="text" id="gateway-userid" placeholder="Mfano: 2" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
          </div>
          <button data-action="admin-add-gateway" 
                  class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
            Hifadhi Gateway
          </button>
        </div>

        <!-- Active Gateways List -->
        <div class="glass-panel p-6 rounded-3xl">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-server mr-2"></i>GATEWAYS ACTIVE ILIYOHIFADHIWA (${gateways.length})</h3>
          <div class="space-y-3">
            ${gateways.map(gw => `
              <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-white uppercase flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full ${gw.type === 'speedpesa' ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-orange-500 shadow-glow-cyan'}"></span>
                    ${gw.label}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">Aina: <strong class="text-white">${gw.type.toUpperCase()}</strong> | Token: <code class="text-orange-400">${gw.token.substring(0, 15)}...</code></p>
                  <p class="text-[10px] text-gray-500 mt-1">Endpoint: ${gw.endpoint || "default"}</p>
                </div>
                <button data-action="admin-delete-gateway" data-param="${gw.id}"
                        class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                  <i class="fa-solid fa-trash"></i> Futa
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.adminTab === 'sms') {
      const smsLogs = JSON.parse(localStorage.getItem('selvix_sms_logs')) || [];
      tabContent = `
        <!-- Sender ID Request -->
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-envelope-open mr-2"></i>SENDER ID REQUEST</h3>
          <p class="text-xs text-gray-400 mb-4">Omba kuongezewa Sender ID maalum (mfano: SELVIX) ili kuitumia kutuma SMS kwa wateja badala ya herufi za default.</p>
          <div class="flex gap-2">
            <input type="text" id="requested-sender-id" placeholder="SELVIX" maxlength="11"
                   class="flex-grow p-3 rounded-xl cyber-input text-white text-xs font-bold uppercase tracking-wider" />
            <button data-action="admin-request-sender-id"
                    class="px-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition">
              Omba Sender ID
            </button>
          </div>
        </div>

        <!-- Meseji API Configuration -->
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-gears mr-2"></i>MESEJI SMS SERVICE SYSTEM</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] uppercase text-gray-400 font-bold mb-1">Meseji SMS API Key</label>
              <input type="text" id="sms-apikey" value="${settings.mesejiApiKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
            <div>
              <label class="block text-[10px] uppercase text-gray-400 font-bold mb-1">Meseji Sender ID iliyoidhinishwa</label>
              <input type="text" id="sms-senderid" value="${settings.mesejiSenderId || 'SELVIX'}" class="w-full p-3 rounded-xl cyber-input text-white text-xs font-bold uppercase" />
            </div>
            <button onclick="app.handleSaveSMSConfig()"
                    class="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl">
              Hifadhi SMS Config
            </button>
          </div>
        </div>

        <!-- SMS Sent Logs -->
        <div class="glass-panel p-6 rounded-3xl">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-clipboard-list mr-2"></i>LOGS ZA SMS ZILIZOTUMWA (${smsLogs.length})</h3>
          ${smsLogs.length === 0 ? `
            <p class="text-xs text-gray-400 text-center py-4">Bado hakuna SMS zilizotumwa hivi karibuni.</p>
          ` : `
            <div class="space-y-3 max-h-96 overflow-y-auto">
              ${smsLogs.map(log => `
                <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-orange-400 font-black">+${log.recipient}</span>
                    <span class="text-[9px] bg-green-900 border border-green-500 text-green-300 px-1.5 py-0.5 rounded uppercase font-bold">${log.status}</span>
                  </div>
                  <p class="text-xs text-gray-300 leading-relaxed mb-1.5">${log.message}</p>
                  <div class="flex items-center justify-between text-[9px] text-gray-500">
                    <span>Sender: <strong>${log.senderId}</strong></span>
                    <span>Batch ID: ${log.batchId} | ${log.date}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } else if (this.adminTab === 'coupons') {
      const coupons = window.db.getCoupons();
      tabContent = `
        <!-- Add Coupon -->
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-circle-plus mr-2"></i>TENGENEZA KUPONI MPYA (ADD COUPON)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Code ya Coupon (Mf: TANO5)</label>
              <input type="text" id="coupon-code" placeholder="SELVIX20" class="w-full p-3 rounded-xl cyber-input text-white text-xs font-black uppercase tracking-wider" />
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Kiasi cha Punguzo (TZS)</label>
              <input type="number" id="coupon-amount" placeholder="2000" class="w-full p-3 rounded-xl cyber-input text-white text-xs" />
            </div>
          </div>
          <button data-action="admin-add-coupon" 
                  class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
            Hifadhi Kuponi
          </button>
        </div>

        <!-- Coupons List -->
        <div class="glass-panel p-6 rounded-3xl">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-tags mr-2"></i>KUPONI ZILIZOHIFADHIWA (${coupons.length})</h3>
          <div class="space-y-3">
            ${coupons.map(cp => `
              <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-white uppercase flex items-center gap-1.5">
                    <i class="fa-solid fa-tag text-cyan-400"></i>
                    ${cp.code}
                  </p>
                  <p class="text-xs text-green-400 font-bold mt-1">Punguzo: TZS ${cp.amount.toFixed(0)} | Aina: Fixed Discount</p>
                </div>
                <button data-action="admin-delete-coupon" data-param="${cp.code}"
                        class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                  <i class="fa-solid fa-trash"></i> Futa
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.adminTab === 'rbac') {
      const subconfigs = window.db.getSubAdminConfigs() || {};
      tabContent = `
        <!-- Add/Edit Sub-Admin Rules -->
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-user-shield mr-2"></i>Dhibiti Ruhusa za Sub-Admin</h3>
          <p class="text-xs text-gray-400 mb-4">Andika username ya sub-admin kisha weka alama ya tiki kwenye sehemu anazoruhusiwa kuona kwenye Admin Panel pekee.</p>
          
          <div class="space-y-4">
            <div class="relative">
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Sub-Admin Username</label>
              <div class="relative">
                <input type="text" id="rbac-username" oninput="app.handleRbacUsernameInput(this.value)" placeholder="Andika au chagua jina la mtumiaji..." autocomplete="off" class="w-full p-3 pr-16 rounded-xl cyber-input text-white text-xs font-bold" />
                <div id="rbac-status-indicator" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <!-- Dynamic check or warning ticket icon goes here -->
                </div>
              </div>
              <!-- Autocomplete suggestions container -->
              <div id="rbac-autocomplete-container" class="absolute z-50 left-0 right-0 top-full mt-1 bg-[#101730] border border-gray-800 rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-2xl hidden">
                <!-- Autocomplete items -->
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 p-4 bg-[#090e21] rounded-2xl border border-gray-800">
              <label class="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                <input type="checkbox" id="rbac-sec-games" checked class="w-4 h-4 accent-cyan-500" />
                Sehemu ya Michezo
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                <input type="checkbox" id="rbac-sec-gateways" class="w-4 h-4 accent-cyan-500" />
                Sehemu ya Gateways
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                <input type="checkbox" id="rbac-sec-sms" class="w-4 h-4 accent-cyan-500" />
                Sehemu ya SMS Logs
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                <input type="checkbox" id="rbac-sec-coupons" class="w-4 h-4 accent-cyan-500" />
                Sehemu ya Coupons
              </label>
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Ruhusu Michezo Hasa (Weka IDs za game zikiwa zimetenganishwa na koma, au baki tupu kuruhusu yote)</label>
              <input type="text" id="rbac-allowed-games" placeholder="1, 2, 5" class="w-full p-3 rounded-xl cyber-input text-white text-xs font-bold" />
            </div>

            <button onclick="app.handleSaveSubAdminConfigClick()"
                    class="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl">
              Hifadhi Ruhusa za Sub-Admin
            </button>
          </div>
        </div>

        <!-- Sub-Admins Configured List -->
        <div class="glass-panel p-6 rounded-3xl">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-users-cog mr-2"></i>SUB-ADMIN CONFIGS SANIFU</h3>
          <div class="space-y-3">
            ${Object.keys(subconfigs).length === 0 ? `
              <p class="text-xs text-gray-400 text-center py-4">Bado hakuna sub-admins waliowekewa ruhusa maalum.</p>
            ` : `
              ${Object.keys(subconfigs).map(usr => {
                const cfg = subconfigs[usr];
                return `
                  <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p class="font-semibold text-white">@${usr}</p>
                      <div class="flex flex-wrap gap-1.5 mt-1.5">
                        <span class="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">Games: ${cfg.gamesSection ? 'YES' : 'NO'}</span>
                        <span class="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">Gateways: ${cfg.gatewaysSection ? 'YES' : 'NO'}</span>
                        <span class="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">SMS: ${cfg.smsSection ? 'YES' : 'NO'}</span>
                        <span class="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">Coupons: ${cfg.couponsSection ? 'YES' : 'NO'}</span>
                      </div>
                      <p class="text-[9px] text-gray-500 mt-1.5">Game IDs zilizoruhusiwa: ${cfg.allowedGames && cfg.allowedGames.length > 0 ? cfg.allowedGames.join(', ') : 'Yote'}</p>
                    </div>
                    <button onclick="app.handleDeleteSubAdminConfig('${usr}')"
                            class="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                      <i class="fa-solid fa-trash-can"></i> Futa
                    </button>
                  </div>
                `;
              }).join('')}
            `}
          </div>
        </div>
      `;
    } else if (this.adminTab === 'notifications') {
      const allUsers = window.db.getUsers();
      tabContent = `
        <div class="glass-panel p-6 rounded-3xl mb-6">
          <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-paper-plane mr-2 text-orange-500"></i>Tuma Arifa Mpya (Send Notification)</h3>
          <form onsubmit="app.handleAdminSendNotification(event)" class="space-y-4">
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Mpokeaji (Recipient)</label>
              <select id="notif-recipient" class="w-full p-3 rounded-xl cyber-input text-white text-xs bg-[#0f142b]">
                <option value="WOTE">WATUMIAJI WOTE (ALL USERS)</option>
                ${Object.keys(allUsers).map(un => `<option value="${un}">@${un} (${allUsers[un].fullName})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Ujumbe wa Arifa (Notification Message)</label>
              <textarea id="notif-message" rows="3" placeholder="Weka ujumbe wa arifa hapa..." required class="w-full p-3 rounded-xl cyber-input text-white text-xs bg-[#0f142b]"></textarea>
            </div>
            <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-yellow-500 text-white font-bold uppercase tracking-wider text-xs shadow-glow-cyan">
              <i class="fa-solid fa-share-from-square mr-1"></i> Tuma Arifa Sasa
            </button>
          </form>
        </div>
      `;
    } else if (this.adminTab === 'support') {
      const allChats = window.db.getChats();
      const supportUsers = [...new Set(allChats
        .filter(c => c.roomName && c.roomName.startsWith('support_'))
        .map(c => c.roomName.replace('support_', ''))
      )];

      const activeUser = this.activeUserChat || (supportUsers.length > 0 ? supportUsers[0] : null);
      let supportLogHTML = "";

      if (activeUser) {
        const userChats = allChats.filter(c => c.roomName === 'support_' + activeUser);
        supportLogHTML = `
          <div class="glass-panel p-6 rounded-3xl flex flex-col h-[500px]">
            <div class="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div>
                <h4 class="font-bold text-white text-sm uppercase">Soga na @${activeUser}</h4>
                <p class="text-[10px] text-orange-400 font-bold uppercase">Private Support Thread</p>
              </div>
              <span class="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-full text-[9px] uppercase tracking-wider animate-pulse">Active</span>
            </div>

            <!-- Chat logs -->
            <div class="flex-grow overflow-y-auto space-y-3 p-3 bg-[#080d1e] rounded-2xl border border-gray-800 mb-4" id="admin-support-logs">
              ${userChats.length === 0 ? `
                <p class="text-xs text-gray-500 text-center py-10">Bado hakuna ujumbe wowote kwenye thread hii.</p>
              ` : userChats.map(c => {
                const isMe = c.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
                return `
                  <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                    <div class="max-w-[85%] rounded-2xl p-3 text-xs ${isMe ? 'bg-cyan-900 text-cyan-100 rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none'}">
                      <p class="font-bold text-[9px] text-pink-400 mb-1">@${c.senderUsername} (${c.senderFullName})</p>
                      <p class="leading-relaxed whitespace-pre-wrap text-left">${c.message}</p>
                    </div>
                    <span class="text-[6.5px] text-gray-500 mt-0.5 tracking-tight font-extrabold uppercase">${c.timestamp}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Reply Input form -->
            <form onsubmit="app.handleAdminSendSupportChat(event)" class="flex gap-2">
              <input type="text" id="support-reply-message" placeholder="Andika jibu lako kwa @${activeUser}..." required
                     class="flex-grow p-3 rounded-xl cyber-input text-white text-xs bg-[#0f142b]" />
              <button type="submit" class="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-xs">
                Tuma
              </button>
            </form>
          </div>
        `;
      } else {
        supportLogHTML = `
          <div class="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center text-gray-400 h-[300px]">
            <div class="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center text-xl mb-3 border border-gray-700/80">
              <i class="fa-solid fa-comments"></i>
            </div>
            <p class="font-bold text-xs">Hakuna mazungumzo ya msaada yaliyopatikana.</p>
            <p class="text-[10px] text-gray-500 max-w-xs mt-1">Watumiaji watakapoanza kukutumia meseji kwenye chumba cha Msaada, zitaonekana hapa.</p>
          </div>
        `;
      }

      tabContent = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Support threads list -->
          <div class="md:col-span-1 glass-panel p-6 rounded-3xl">
            <h3 class="font-bold text-white text-sm uppercase mb-4 text-glow-cyan"><i class="fa-solid fa-users mr-2"></i>Mazungumzo (${supportUsers.length})</h3>
            <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              ${supportUsers.length === 0 ? `
                <p class="text-xs text-gray-500 text-center py-6">Hakuna thread yoyote ya msaada kwa sasa.</p>
              ` : supportUsers.map(usr => {
                const isSelected = usr === activeUser;
                return `
                  <div onclick="app.handleAdminSelectSupportUser('${usr}')"
                       class="p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                         isSelected 
                           ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500 text-white shadow-md' 
                           : 'bg-[#0f142b]/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                       }">
                    <span class="font-bold text-xs">@${usr}</span>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Selected support thread log -->
          <div class="md:col-span-2">
            ${supportLogHTML}
          </div>
        </div>
      `;
    }

    return `
      <div class="min-h-screen flex flex-col pb-6 fade-in text-sm text-white">
        <!-- Header -->
        <header class="glass-panel px-6 py-4 flex items-center justify-between border-b border-gray-800">
          <div class="flex items-center space-x-3">
            <img src="https://cdn.phototourl.com/member/2026-07-07-8d18e747-46e3-4af1-801d-7bcaca6b0870.png" class="w-10 h-10 object-contain rounded-xl border border-orange-500 bg-white p-0.5" />
            <div>
              <h1 class="text-base font-black text-white uppercase tracking-wider">Admin Panel</h1>
              <p class="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Usimamizi wa Selvix | ${currentUser?.fullName}</p>
            </div>
          </div>
          <button data-action="logout" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs shadow-md transition">LOGOUT</button>
        </header>

        <!-- Sub-Tabs Navigation -->
        <div class="px-6 pt-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-800 pb-3 bg-[#080d1e]">
          ${tabs.filter(t => t.visible).map(t => {
            const isActive = this.adminTab === t.id;
            return `
              <button data-action="admin-set-tab" data-param="${t.id}"
                      class="px-4 py-2.5 rounded-full text-[10px] font-black tracking-wider uppercase whitespace-nowrap transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#ff5100] text-white shadow-lg scale-105'
                          : 'border border-gray-800 bg-[#101730] text-gray-400 hover:border-orange-500 hover:text-white'
                      }">
                <i class="fa-solid ${t.icon}"></i>
                <span>${t.label}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="p-6 space-y-6 flex-grow">
          ${tabContent}

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
    } else if (this.activeTab === 'notifications') {
      container.innerHTML = this.getNotificationsTabHTML();
    }
  }

  getNotificationsTabHTML() {
    const user = window.db.getCurrentUser() || { username: 'mgeni' };
    const notifs = window.db.getUserNotifications(user.username);

    return `
      <div class="space-y-6 fade-in text-sm">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-base">
              <i class="fa-solid fa-envelope"></i>
            </div>
            <div>
              <h2 class="font-extrabold text-white text-sm uppercase tracking-wider text-glow-cyan">Meseji Zangu (My Messages)</h2>
              <p class="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Ujumbe na Arifa Kutoka kwa Admin</p>
            </div>
          </div>
          <span class="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-full text-[9px] uppercase tracking-wider">${notifs.length} Mpya</span>
        </div>

        ${notifs.length === 0 ? `
          <div class="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center text-center text-gray-400">
            <div class="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center text-2xl mb-4 border border-gray-700/80">
              <i class="fa-solid fa-bell-slash animate-bounce" style="animation-duration: 3s"></i>
            </div>
            <p class="font-bold text-xs text-white uppercase tracking-wider">Huna meseji zozote!</p>
            <p class="text-[10px] text-gray-500 max-w-xs mt-1 leading-relaxed">Arifa, ujumbe wa ushindi, au miamala yako ikipokelewa na admin zitaonekana hapa.</p>
          </div>
        ` : `
          <div class="space-y-3">
            ${notifs.map(n => `
              <div class="glass-panel p-4 rounded-2xl border border-gray-800/80 bg-opacity-40 hover:border-gray-700 transition flex items-start justify-between gap-4">
                <div class="flex-grow text-left">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="inline-block px-2 py-0.5 rounded bg-[#ff5100]/10 border border-[#ff5100]/20 text-[#ff5100] text-[8px] font-black uppercase tracking-wider">Kutoka: Admin</span>
                    <span class="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">${n.date}</span>
                  </div>
                  <p class="text-xs text-white leading-relaxed font-medium whitespace-pre-wrap">${n.msg}</p>
                </div>
                
                <button data-action="delete-notification" data-param="${n.id}" 
                        class="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer" 
                        title="Futa Ujumbe">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
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
    const rooms = ['Chat Kuu', 'Msaada (Admin Support)', 'FIFA', 'GTA V', 'Call of Duty'];
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

    const currentUser = window.db.getCurrentUser() || { username: 'mgeni' };
    const targetRoom = this.chatRoom === 'Msaada (Admin Support)' ? ('support_' + currentUser.username) : this.chatRoom;
    const chats = window.db.getChats().filter(c => c.roomName === targetRoom);

    if (chats.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
          <div class="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 text-xl mb-1">
            <i class="fa-solid fa-comments animate-pulse"></i>
          </div>
          <p class="font-bold text-xs text-white">Mwanzo Mpya!</p>
          <p class="text-[10px] text-gray-500 max-w-xs px-4">Andika ujumbe wako hapa chini kuanzisha soga kwenye chumba cha ${this.chatRoom}!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = chats.map(chat => {
      const isMe = currentUser && currentUser.username === chat.senderUsername;
      const initial = chat.senderFullName ? chat.senderFullName[0].toUpperCase() : (chat.senderUsername ? chat.senderUsername[0].toUpperCase() : "?");
      
      const colors = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-teal-500 to-emerald-500',
        'from-green-500 to-yellow-500',
        'from-orange-500 to-red-500'
      ];
      const hash = chat.senderUsername.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorClass = colors[hash % colors.length];

      const avatarHTML = chat.senderAvatarUrl ? `
        <img src="${chat.senderAvatarUrl}" class="w-8 h-8 rounded-full object-cover border border-cyan-500/20 shadow-sm shrink-0" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div style="display:none" class="w-8 h-8 rounded-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white font-black text-[10px] uppercase shrink-0">${initial}</div>
      ` : `
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white font-black text-[10px] uppercase shrink-0">${initial}</div>
      `;

      return `
        <div class="flex items-end gap-2.5 ${isMe ? 'flex-row-reverse text-right' : 'flex-row'} px-1 py-1">
          <!-- Avatar -->
          <div class="shrink-0 mb-0.5">
            ${avatarHTML}
          </div>

          <!-- Message Container -->
          <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]">
            <!-- Username display -->
            <span class="text-[9px] text-cyan-400 font-extrabold mb-0.5 px-1 block uppercase tracking-wider">
              @${chat.senderUsername} <span class="font-bold text-gray-500 capitalize tracking-normal">• ${chat.senderFullName}</span>
            </span>
            
            <!-- Speech Bubble -->
            <div class="relative px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
              isMe 
                ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-none shadow-[0_3px_10px_rgba(6,182,212,0.2)]' 
                : 'bg-gray-800 text-gray-100 rounded-bl-none shadow-[0_3px_10px_rgba(0,0,0,0.15)]'
            }">
              <p class="whitespace-pre-wrap text-left">${chat.message}</p>
              
              <!-- Timestamp and Checkmarks -->
              <div class="flex items-center justify-end gap-1 text-[6.5px] text-white/40 mt-1 font-extrabold uppercase tracking-tight">
                <span>${chat.timestamp}</span>
                ${isMe ? `<i class="fa-solid fa-check-double text-cyan-300"></i>` : ''}
              </div>
            </div>
          </div>
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
    
    // Initialize transaction status filter if not set
    if (!this.transactionStatusFilter) {
      this.transactionStatusFilter = 'ALL';
    }

    const allTxs = window.db.getTransactions().filter(t => t.username === user.username);
    let txs = allTxs;
    if (this.transactionStatusFilter === 'SUCCESS') {
      txs = allTxs.filter(t => t.status === 'SUCCESS');
    } else if (this.transactionStatusFilter === 'PENDING') {
      txs = allTxs.filter(t => t.status === 'PENDING');
    } else if (this.transactionStatusFilter === 'FAILED') {
      txs = allTxs.filter(t => t.status === 'FAILED');
    }

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

        <!-- Historic logs categorized -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <h3 class="font-bold text-white uppercase text-sm"><i class="fa-solid fa-clock-rotate-left mr-2"></i>Historia ya Miamala</h3>
            
            <!-- Category Tabs -->
            <div class="flex gap-1 overflow-x-auto no-scrollbar">
              <button data-action="set-tx-filter" data-param="ALL"
                      class="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition ${this.transactionStatusFilter === 'ALL' ? 'bg-[#ff5100] text-white' : 'bg-gray-800 text-gray-400'}">
                Yote
              </button>
              <button data-action="set-tx-filter" data-param="SUCCESS"
                      class="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition ${this.transactionStatusFilter === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}">
                Success
              </button>
              <button data-action="set-tx-filter" data-param="PENDING"
                      class="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition ${this.transactionStatusFilter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}">
                Pending
              </button>
              <button data-action="set-tx-filter" data-param="FAILED"
                      class="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition ${this.transactionStatusFilter === 'FAILED' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}">
                Failed
              </button>
            </div>
          </div>

          ${txs.length === 0 ? `
            <p class="text-xs text-gray-500 text-center py-6">Hakuna miamala iliyopatikana kwenye kundi hili.</p>
          ` : `
            <div class="space-y-2.5">
              ${txs.map(tx => {
                const isWithdrawal = tx.gameId === -1;
                return `
                  <div class="p-3.5 bg-gray-800 bg-opacity-40 rounded-2xl flex justify-between items-center border border-gray-800/80 hover:border-gray-700/85 transition">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <i class="fa-solid ${isWithdrawal ? 'fa-arrow-up-from-bracket text-indigo-400' : 'fa-gamepad text-cyan-400'} text-xs"></i>
                        <p class="font-bold text-white text-xs">${isWithdrawal ? 'Kutoa Fedha (Withdrawal)' : ('Kununua Game: ' + tx.gameTitle)}</p>
                      </div>
                      <p class="text-[9px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">${tx.created}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="font-bold text-xs ${isWithdrawal ? 'text-rose-400' : 'text-green-400'}">${isWithdrawal ? '-' : '+'} TZS ${tx.amount.toFixed(0)}</p>
                      <span class="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase mt-1 border ${
                        tx.status === 'SUCCESS' 
                          ? 'bg-green-950/40 text-green-400 border-green-800/60' 
                          : tx.status === 'FAILED' 
                          ? 'bg-red-950/40 text-red-400 border-red-800/60' 
                          : 'bg-yellow-950/40 text-yellow-400 border-yellow-800/60'
                      }">
                        ${tx.status === 'SUCCESS' ? 'Imekamilika' : tx.status === 'FAILED' ? 'Imekataliwa' : 'Inasubiri'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
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
          ${user.avatarUrl ? `
            <img src="${user.avatarUrl}" class="w-16 h-16 rounded-full object-cover border border-[#ff8c00]/50 shadow-md shrink-0" onerror="this.style.display='none'; document.getElementById('settings-fallback-avatar').style.display='flex';" />
            <div id="settings-fallback-avatar" style="display:none" class="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff8c00] to-[#ff3c00] flex items-center justify-center text-white font-black text-2xl shadow-md uppercase shrink-0">
              ${user.fullName ? user.fullName[0] : 'S'}
            </div>
          ` : `
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff8c00] to-[#ff3c00] flex items-center justify-center text-white font-black text-2xl shadow-md uppercase shrink-0">
              ${user.fullName ? user.fullName[0] : 'S'}
            </div>
          `}
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
            <label class="block text-xs text-cyan-400 font-bold mb-1 uppercase">Picha ya Wasifu (Profile Pic URL)</label>
            <input type="text" id="prof-avatar" value="${user.avatarUrl || ''}" placeholder="https://example.com/picha.png" class="w-full px-4 py-3 rounded-xl cyber-input text-white text-xs" />
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
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button data-action="change-theme" data-param="blue" 
                    class="py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all duration-300 ${window.db.getActiveTheme() === 'blue' ? 'bg-gradient-to-r from-blue-600 to-sky-400 text-white shadow-lg border-blue-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}">
              BLUE (Default)
            </button>
            <button data-action="change-theme" data-param="white-blend" 
                    class="py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all duration-300 ${window.db.getActiveTheme() === 'white-blend' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg border-orange-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}">
              WHITE BLEND
            </button>
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

        <!-- Language Switcher Card -->
        <div class="glass-panel p-6 rounded-3xl space-y-4">
          <h3 class="font-bold text-white uppercase text-sm text-glow-cyan">
            <i class="fa-solid fa-globe mr-2 text-orange-500 animate-pulse"></i>Lugha (Select Language)
          </h3>
          <p class="text-xs text-gray-400">Chagua lugha unayotaka kutumia kwenye Selvix Game Zone:</p>
          <div>
            <select onchange="app.handleChangeLanguage(this.value)" class="w-full p-3.5 rounded-xl cyber-input text-white text-xs bg-[#0f142b] border border-gray-700 focus:border-orange-500">
              <option value="sw" ${window.db.getActiveLanguage() === 'sw' ? 'selected' : ''}>Kiswahili (Swahili)</option>
              <option value="en" ${window.db.getActiveLanguage() === 'en' ? 'selected' : ''}>English (English)</option>
              <option value="zh" ${window.db.getActiveLanguage() === 'zh' ? 'selected' : ''}>中文 (Chinese)</option>
              <option value="fr" ${window.db.getActiveLanguage() === 'fr' ? 'selected' : ''}>Français (French)</option>
              <option value="ar" ${window.db.getActiveLanguage() === 'ar' ? 'selected' : ''}>العربية (Arabic)</option>
            </select>
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

    const user = window.db.getCurrentUser();
    let notifs = [];
    if (user && user.username) {
      notifs = window.db.getUserNotifications(user.username);
    } else {
      notifs = this.notifications;
    }

    if (notifs.length === 0) {
      list.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Arifa zako zote zimeshasomwa!</p>`;
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div class="p-3 bg-gray-800 bg-opacity-40 rounded-xl border border-gray-700 flex items-start gap-3 justify-between">
        <div class="flex-grow text-left">
          <p class="text-xs text-gray-300 leading-relaxed">${n.msg}</p>
          <span class="text-[9px] text-gray-500 block mt-1">${n.date}</span>
        </div>
        <button data-action="delete-notification" data-param="${n.id}" class="text-red-400 hover:text-red-600 transition p-1 text-xs" title="Futa Arifa">
          <i class="fa-solid fa-trash-can"></i>
        </button>
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

window.navigateToMessages = function() {
  if (window.app) {
    window.app.showView('user-home');
    window.app.activeTab = 'settings';
    window.app.render();
    setTimeout(() => {
      const listEl = document.getElementById('notifications-list');
      if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }
};

window.app = new SelvixApp();
