// Selvix Game Zone Local Database Engine (Room-like LocalStorage Persistence)

const DEFAULT_GAMES = [
  {
    id: 1,
    title: "WINLATOR",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600",
    category: "PC GAME",
    isPaid: false,
    price: 0.0,
    downloadUrl: "https://github.com/winlator/winlator/releases/download/v6.1.0/Winlator_6.1.apk",
    description: "Winlator ni emulator bora ya Android inayokuruhusu kucheza michezo ya PC ya Windows (kama GTA V, Skyrim n.k) kwenye kifaa chako cha mkononi ikiwa na uwezo mkubwa wa graphic."
  },
  {
    id: 2,
    title: "TOMB RAIDER 3",
    imageUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600",
    category: "EMULATOR GAME",
    isPaid: true,
    price: 2500.0,
    downloadUrl: "https://example.com/games/tomb_raider3_emu.zip",
    description: "Cheza mchezo wa asili na wa kusisimua wa Tomb Raider III kwenye emulator yako ya simu. Pambana na maadui, tatua mafumbo, na gundua siri za kale kote duniani."
  },
  {
    id: 3,
    title: "GTA IV",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600",
    category: "PC GAME",
    isPaid: false,
    price: 0.0,
    downloadUrl: "https://example.com/games/gta4_pc.zip",
    description: "Grand Theft Auto IV ni mchezo wa ulimwengu wazi uliotengenezwa na Rockstar Games unaofanyika katika jiji kuu la Liberty City. Shuhudia visa vya Niko Bellic katika azma yake ya kuishi maisha bora."
  },
  {
    id: 4,
    title: "CALL OF DUTY: STRIKE TEAM",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
    category: "MOBILE GAME",
    isPaid: false,
    price: 0.0,
    downloadUrl: "https://example.com/games/cod_strike_team.apk",
    description: "Call of Duty: Strike Team inaleta uzoefu mpya kabisa wa Call of Duty vya 3D kwa vifaa vya simu za mkononi, ukiunganisha mtazamo wa kwanza wa shooter (FPS) na mtazamo wa tatu wa tactical."
  }
];

const DEFAULT_CHATS = [
  { id: 1, senderUsername: "sanex09", senderFullName: "Sane Joseph", message: "Oya wadau, emulator ya Winlator inafanya kazi vizuri sana kwenye Android 13!", isSocial: true, timestamp: new Date(Date.now() - 3600000).toLocaleString() },
  { id: 2, senderUsername: "juma_mkuu", senderFullName: "Juma Juma Abdallah", message: "Nimenunua Tomb Raider 3 sasa hivi, malipo ya SpeedPesa yapo fasta sana, asante selvix!", isSocial: true, timestamp: new Date(Date.now() - 1800000).toLocaleString() }
];

const DEFAULT_SETTINGS = {
  isReferralActive: true,
  isWithdrawalActive: true,
  isSocialChatClosed: false,
  isAdminChatClosed: false,
  speedPesaApiKey: ""
};

class SelvixDatabase {
  constructor() {
    this.init();
    // Fire background sync if api is available
    setTimeout(() => this.syncRemote(), 50);
  }

  init() {
    if (!localStorage.getItem('selvix_games')) {
      localStorage.setItem('selvix_games', JSON.stringify(DEFAULT_GAMES));
    }
    if (!localStorage.getItem('selvix_chats')) {
      localStorage.setItem('selvix_chats', JSON.stringify(DEFAULT_CHATS));
    }
    if (!localStorage.getItem('selvix_settings')) {
      localStorage.setItem('selvix_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('selvix_users')) {
      // Create admin user by default
      const defaultUsers = {
        "salehe admin": {
          username: "salehe admin",
          fullName: "Salehe Admin Owner",
          phoneNumber: "0750020767",
          password: "5454#",
          isAdmin: true,
          isBlockedFromChatting: false,
          pointsBalance: 50000.0,
          streakCount: 0,
          lastRewardClaimedDate: "",
          referredBy: "",
          createdDate: new Date().toLocaleString()
        }
      };
      localStorage.setItem('selvix_users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('selvix_transactions')) {
      localStorage.setItem('selvix_transactions', JSON.stringify([]));
    }
  }

  async syncRemote() {
    if (!window.api) return;
    const current = this.getCurrentUser();
    const serverState = await window.api.syncState(current ? current.username : null);
    
    if (serverState) {
      // Overwrite local state with fresh server state
      if (serverState.games && serverState.games.length > 0) {
        // Map backend snake_case to frontend camelCase for Games
        const parsedGames = serverState.games.map(g => ({
          id: parseInt(g.id),
          title: g.title,
          imageUrl: g.image_url,
          category: g.category,
          isPaid: g.is_paid == 1,
          price: parseFloat(g.price),
          downloadUrl: g.download_url,
          description: g.description
        }));
        localStorage.setItem('selvix_games', JSON.stringify(parsedGames));
      }

      if (serverState.chats && serverState.chats.length > 0) {
        const parsedChats = serverState.chats.map(c => ({
          id: parseInt(c.id),
          senderUsername: c.sender_username,
          senderFullName: c.sender_full_name,
          message: c.message,
          isSocial: c.is_social == 1,
          timestamp: new Date(c.created_at).toLocaleString()
        }));
        localStorage.setItem('selvix_chats', JSON.stringify(parsedChats));
      }

      if (serverState.settings) {
        const set = serverState.settings;
        localStorage.setItem('selvix_settings', JSON.stringify({
          isReferralActive: set.is_referral_active == 1,
          isWithdrawalActive: set.is_withdrawal_active == 1,
          isSocialChatClosed: set.is_social_chat_closed == 1,
          isAdminChatClosed: set.is_admin_chat_closed == 1,
          speedPesaApiKey: set.speedpesa_api_key
        }));
      }

      if (serverState.users && serverState.users.length > 0) {
        const userMap = {};
        serverState.users.forEach(u => {
          userMap[u.username.toLowerCase()] = {
            username: u.username,
            fullName: u.full_name,
            phoneNumber: u.phone_number,
            isAdmin: u.is_admin == 1,
            isBlockedFromChatting: u.is_blocked_from_chatting == 1,
            pointsBalance: parseFloat(u.points_balance),
            streakCount: parseInt(u.streak_count),
            lastRewardClaimedDate: u.last_reward_claimed_date,
            referredBy: u.referred_by
          };
        });
        localStorage.setItem('selvix_users', JSON.stringify(userMap));
        
        if (current && userMap[current.username.toLowerCase()]) {
            this.setCurrentUser(userMap[current.username.toLowerCase()]);
        }
      }

      if (serverState.transactions && serverState.transactions.length > 0) {
        const txs = serverState.transactions.map(t => ({
          reference: t.reference,
          status: t.status,
          amount: parseFloat(t.amount),
          username: t.username,
          gameId: t.game_id,
          created: new Date(t.created_at).toLocaleString()
        }));
        localStorage.setItem('selvix_transactions', JSON.stringify(txs));
      }
    }
  }

  // --- Users ---
  getUsers() {
    return JSON.parse(localStorage.getItem('selvix_users')) || {};
  }

  getUser(username) {
    const users = this.getUsers();
    return users[username.trim().toLowerCase()] || null;
  }

  saveUser(user) {
    const users = this.getUsers();
    users[user.username.trim().toLowerCase()] = user;
    localStorage.setItem('selvix_users', JSON.stringify(users));
    if (window.api) window.api.syncMutation('update_user', user);
  }

  updateUser(user) {
    this.saveUser(user);
    const current = this.getCurrentUser();
    if (current && current.username.toLowerCase() === user.username.toLowerCase()) {
      this.setCurrentUser(user);
    }
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('selvix_current_user')) || null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('selvix_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('selvix_current_user');
    }
  }

  // --- Games ---
  getGames() {
    return JSON.parse(localStorage.getItem('selvix_games')) || [];
  }

  getGame(id) {
    return this.getGames().find(g => g.id === parseInt(id)) || null;
  }

  insertGame(game) {
    const games = this.getGames();
    game.id = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
    games.push(game);
    localStorage.setItem('selvix_games', JSON.stringify(games));
    if (window.api) window.api.syncMutation('insert_game', game);
    return game;
  }

  deleteGame(id) {
    let games = this.getGames();
    games = games.filter(g => g.id !== parseInt(id));
    localStorage.setItem('selvix_games', JSON.stringify(games));
    if (window.api) window.api.syncMutation('delete_game', { id });
  }

  // --- Chats ---
  getChats() {
    return JSON.parse(localStorage.getItem('selvix_chats')) || [];
  }

  insertChatMessage(chat) {
    const chats = this.getChats();
    chat.id = chats.length > 0 ? Math.max(...chats.map(c => c.id)) + 1 : 1;
    chat.timestamp = new Date().toLocaleString();
    chats.push(chat);
    localStorage.setItem('selvix_chats', JSON.stringify(chats));
    if (window.api) window.api.syncMutation('insert_chat', chat);
    return chat;
  }

  deleteChatMessage(id) {
    let chats = this.getChats();
    chats = chats.filter(c => c.id !== parseInt(id));
    localStorage.setItem('selvix_chats', JSON.stringify(chats));
    if (window.api) window.api.syncMutation('delete_chat', { id });
  }

  // --- Settings ---
  getSettings() {
    return JSON.parse(localStorage.getItem('selvix_settings')) || DEFAULT_SETTINGS;
  }

  saveSettings(settings) {
    localStorage.setItem('selvix_settings', JSON.stringify(settings));
    if (window.api) window.api.syncMutation('update_settings', settings);
  }

  getActiveTheme() {
    return localStorage.getItem('selvix_theme') || 'orange';
  }

  setActiveTheme(theme) {
    localStorage.setItem('selvix_theme', theme);
  }

  // --- Transactions ---
  getTransactions() {
    return JSON.parse(localStorage.getItem('selvix_transactions')) || [];
  }

  insertTransaction(tx) {
    const txs = this.getTransactions();
    tx.created = new Date().toLocaleString();
    txs.push(tx);
    localStorage.setItem('selvix_transactions', JSON.stringify(txs));
    if (window.api) window.api.syncMutation('insert_transaction', tx);
    return tx;
  }

  updateTransactionStatus(reference, status) {
    const txs = this.getTransactions();
    const tx = txs.find(t => t.reference === reference);
    if (tx) {
      tx.status = status;
      localStorage.setItem('selvix_transactions', JSON.stringify(txs));
      if (window.api) window.api.syncMutation('update_transaction', { reference, status });
    }
  }

  getTransaction(reference) {
    return this.getTransactions().find(t => t.reference === reference) || null;
  }
}

window.db = new SelvixDatabase();
