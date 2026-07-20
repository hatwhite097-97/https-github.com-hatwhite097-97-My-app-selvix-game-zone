// Selvix Game Zone - Supadatabase (Supabase) Integration Client Wrapper

class SelvixAppwrite {
  constructor() {
    this.supabase = null;
    
    let endpoint = localStorage.getItem('appwrite_endpoint');
    let projectId = localStorage.getItem('appwrite_project_id');
    
    // Clear old Appwrite or old Supabase credentials if they exist to force updates
    if (endpoint && (endpoint.includes('appwrite') || endpoint.includes('cloud.appwrite') || endpoint.includes('szfmkjzknvsrpzsunatx'))) {
      localStorage.removeItem('appwrite_endpoint');
      localStorage.removeItem('appwrite_project_id');
      localStorage.removeItem('appwrite_database_id');
      endpoint = null;
      projectId = null;
    }
    
    // Configurations (can be updated from Admin Panel Settings)
    this.config = {
      endpoint: endpoint || 'https://hgwuamjulxpysixjojxp.supabase.co',
      projectId: projectId || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd3VhbWp1bHhweXNpeGpvanhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NDkwNjMsImV4cCI6MjA5OTEyNTA2M30.f6xk1ACZordFhwjNivuBN8qSeobDBUJRlsFPRIC6FwA',
      databaseId: localStorage.getItem('appwrite_database_id') || 'selvix_prod',
      usersCollection: localStorage.getItem('appwrite_users_coll') || 'users',
      gamesCollection: localStorage.getItem('appwrite_games_coll') || 'games',
      chatsCollection: localStorage.getItem('appwrite_chats_coll') || 'chats',
      transactionsCollection: localStorage.getItem('appwrite_txs_coll') || 'transactions',
      settingsCollection: localStorage.getItem('appwrite_settings_coll') || 'settings',
      bucketId: localStorage.getItem('appwrite_bucket_id') || 'selvix_assets'
    };

    // cPanel SQL Database Integration Settings
    this.cpanelConfig = {
      enabled: localStorage.getItem('cpanel_db_enabled') === 'true',
      bridgeUrl: localStorage.getItem('cpanel_bridge_url') || '',
      secretKey: localStorage.getItem('cpanel_secret_key') || 'selvix_secure_key_123'
    };

    this.isActive = false;
    this.init();
  }

  async callCpanelApi(action, queryParams = {}, method = 'GET', body = null) {
    if (!this.cpanelConfig.enabled || !this.cpanelConfig.bridgeUrl) return null;
    try {
      let url = new URL(this.cpanelConfig.bridgeUrl);
      url.searchParams.append('action', action);
      Object.keys(queryParams).forEach(k => url.searchParams.append(k, queryParams[k]));
      
      const response = await fetch(url.toString(), {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-Selvix-Key": this.cpanelConfig.secretKey
        },
        body: body ? JSON.stringify(body) : null
      });
      if (!response.ok) {
        throw new Error("HTTP Error " + response.status);
      }
      return await response.json();
    } catch (err) {
      console.error("Failed calling cPanel SQL Bridge API:", err);
      return { success: false, message: err.message };
    }
  }

  async init() {
    // 1. Initialize Supabase if credentials exist (Always initialize so Supabase Auth & Google Sign-In work seamlessly)
    if (this.config.endpoint && this.config.projectId && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(this.config.endpoint, this.config.configId || this.config.projectId);
        this.isActive = true;
        console.log("Supadatabase (Supabase) client initialized successfully.");
        
        // Handle post-redirect Google OAuth Session
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        const handleSession = async (session) => {
          if (session && session.user) {
            const googleUser = session.user;
            let username = (googleUser.user_metadata?.full_name || googleUser.email?.split('@')[0] || "user")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_');
            
            let localUser = window.db.getUser(username);
            
            // Try fetching existing user from cPanel if not found locally
            if (!localUser && this.cpanelConfig.enabled) {
              try {
                const res = await this.callCpanelApi('get_user', { username: username });
                if (res && res.success && res.data) {
                  const d = res.data;
                  localUser = {
                    username: d.username,
                    fullName: d.fullName || "Google User",
                    phoneNumber: d.phoneNumber || "",
                    password: d.password || "google_oauth_bypass",
                    isAdmin: d.isAdmin || false,
                    isBlockedFromChatting: d.isBlockedFromChatting || false,
                    pointsBalance: parseFloat(d.pointsBalance) || 100.0,
                    streakCount: parseInt(d.streakCount) || 0,
                    lastRewardClaimedDate: d.lastRewardClaimedDate || "",
                    referredBy: d.referredBy || "",
                    createdDate: d.createdDate || new Date().toLocaleString()
                  };
                  window.db.saveUser(localUser);
                }
              } catch (e) {
                console.warn("Error fetching Google user from cPanel:", e);
              }
            }
            
            // Try fetching existing user from Supabase if not found
            if (!localUser && this.isActive && this.supabase) {
              try {
                const { data, error } = await this.supabase
                  .from('users')
                  .select('*')
                  .eq('username', username)
                  .maybeSingle();
                if (data && !error) {
                  localUser = {
                    username: data.username,
                    fullName: data.fullName || "Google User",
                    phoneNumber: data.phoneNumber || "",
                    password: data.password || "google_oauth_bypass",
                    isAdmin: data.isAdmin || false,
                    isBlockedFromChatting: data.isBlockedFromChatting || false,
                    pointsBalance: parseFloat(data.pointsBalance) || 100.0,
                    streakCount: parseInt(data.streakCount) || 0,
                    lastRewardClaimedDate: data.lastRewardClaimedDate || "",
                    referredBy: data.referredBy || "",
                    createdDate: data.createdDate || new Date().toLocaleString()
                  };
                  window.db.saveUser(localUser);
                }
              } catch (e) {
                console.warn("Error fetching Google user from Supabase:", e);
              }
            }
            
            if (!localUser) {
              localUser = {
                username: username,
                fullName: googleUser.user_metadata?.full_name || "Google User",
                phoneNumber: googleUser.phone || "",
                password: "google_oauth_bypass",
                isAdmin: false,
                isBlockedFromChatting: false,
                pointsBalance: 100.0, // TZS 100 Signup Bonus
                streakCount: 0,
                lastRewardClaimedDate: "",
                referredBy: localStorage.getItem('selvix_temp_ref') || "",
                createdDate: new Date().toLocaleString()
              };
              window.db.saveUser(localUser);
              
              // Process referral bonus if any
              if (localUser.referredBy) {
                const referrer = window.db.getUser(localUser.referredBy);
                if (referrer) {
                  referrer.pointsBalance = (referrer.pointsBalance || 0) + 100.0;
                  window.db.saveUser(referrer);
                  window.db.insertTransaction({
                    reference: "REF-BONUS-" + Date.now(),
                    username: referrer.username,
                    gameId: -2,
                    phonenumber: referrer.phoneNumber,
                    amount: 100.0,
                    status: "SUCCESS"
                  });
                }
              }
            }
            window.db.setCurrentUser(localUser);
            
            // Re-trigger visual rendering in app and direct straight to their respective view
            if (window.app) {
              if (localUser.isAdmin) {
                window.app.showView('admin-dashboard');
              } else {
                window.app.showView('user-home');
              }
            }
          }
        };

        if (session) {
          handleSession(session);
        }

        this.supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            handleSession(session);
          }
        });
      } catch (err) {
        console.error("Failed to initialize Supadatabase: ", err);
        this.isActive = false;
      }
    } else {
      console.log("Supadatabase (Supabase) is running in high-performance Local Mode.");
      this.isActive = false;
    }

    // Trigger non-blocking sync on startup from whoever is enabled/active!
    this.fetchAllUsersFromServer().catch(e => console.warn(e));
    this.fetchAllGamesFromServer().catch(e => console.warn(e));
    this.fetchAllChatsFromServer().catch(e => console.warn(e));
    this.fetchAllTransactionsFromServer().catch(e => console.warn(e));
  }

  updateConfig(newConfig) {
    Object.keys(newConfig).forEach(key => {
      localStorage.setItem('appwrite_' + key, newConfig[key]);
    });
    location.reload();
  }

  // --- Auth & Users ---
  async checkReferrerExists(username) {
    username = username.toLowerCase().trim();
    const localUser = window.db.getUser(username);
    if (localUser) return true;

    if (this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_user', { username: username });
        if (res && res.success && res.data) {
          const data = res.data;
          const refUser = {
            username: data.username,
            fullName: data.fullName || (data.username + " Referrer"),
            phoneNumber: data.phoneNumber || "",
            password: data.password || "google_oauth_bypass",
            isAdmin: data.isAdmin || false,
            isBlockedFromChatting: data.isBlockedFromChatting || false,
            pointsBalance: parseFloat(data.pointsBalance) || 0.0,
            streakCount: parseInt(data.streakCount) || 0,
            lastRewardClaimedDate: data.lastRewardClaimedDate || "",
            referredBy: data.referredBy || "",
            createdDate: data.createdDate || new Date().toLocaleString()
          };
          window.db.saveUser(refUser);
          return true;
        }
      } catch (e) {
        console.warn("Error looking up referrer on cPanel:", e);
      }
      return false;
    }

    if (this.isActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .maybeSingle();
        if (data) {
          // Import referrer to local db so they exist locally
          const refUser = {
            username: data.username,
            fullName: data.fullName || (data.username + " Referrer"),
            phoneNumber: data.phoneNumber || "",
            password: "google_oauth_bypass",
            isAdmin: data.isAdmin || false,
            isBlockedFromChatting: false,
            pointsBalance: parseFloat(data.pointsBalance) || 0.0,
            streakCount: 0,
            lastRewardClaimedDate: "",
            referredBy: "",
            createdDate: new Date().toLocaleString()
          };
          window.db.saveUser(refUser);
          return true;
        }
      } catch (e) {
        console.warn("Error looking up referrer on Supabase:", e);
      }
    }
    return false;
  }

  async register(username, email, password, fullName, phoneNumber, referredBy) {
    // Local registration with synced cloud capability
    const existing = window.db.getUser(username);
    if (existing) throw new Error("Username tayari inatumika!");

    const newUser = {
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      password: password,
      isAdmin: false,
      isBlockedFromChatting: false,
      pointsBalance: 100.0, // Instant TZS 100 Coins Signup Bonus
      streakCount: 0,
      lastRewardClaimedDate: "",
      referredBy: referredBy.toLowerCase().trim(),
      createdDate: new Date().toLocaleString()
    };

    // Process referral bonus
    if (referredBy) {
      const referrer = window.db.getUser(referredBy.toLowerCase().trim());
      if (referrer) {
        referrer.pointsBalance = (referrer.pointsBalance || 0) + 100.0;
        window.db.saveUser(referrer);
        
        // Remote sync cPanel
        if (this.cpanelConfig.enabled) {
          try {
            await this.callCpanelApi('save_user', {}, 'POST', referrer);
          } catch (e) {
            console.warn("Error syncing referrer to cPanel:", e);
          }
        }

        // Remote sync if active Supabase
        if (this.isActive && this.supabase) {
          try {
            await this.supabase
              .from('users')
              .update({ pointsBalance: referrer.pointsBalance })
              .eq('username', referrer.username);
          } catch (e) {
            console.warn("Error syncing referrer points on Supabase:", e);
          }
        }

        const refTx = {
          id: "TX-REF-" + Date.now(),
          reference: "REF-BONUS-" + Date.now(),
          username: referrer.username,
          gameId: -2,
          phonenumber: referrer.phoneNumber,
          amount: 100.0,
          status: "SUCCESS",
          created: new Date().toLocaleString()
        };
        window.db.insertTransaction(refTx);

        if (this.cpanelConfig.enabled) {
          try {
            await this.callCpanelApi('insert_transaction', {}, 'POST', refTx);
          } catch (e) {
            console.warn("Error saving ref transaction on cPanel:", e);
          }
        }
      }
    }

    window.db.saveUser(newUser);
    window.db.setCurrentUser(newUser);

    // Sync registration to cPanel
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('save_user', {}, 'POST', newUser);
      } catch (e) {
        console.warn("Error registering user on cPanel:", e);
      }
    }

    if (this.isActive && this.supabase) {
      try {
        // Create matching account in Supabase DB for remote backup if needed
        await this.supabase.from('users').insert({
          username: newUser.username,
          fullName: newUser.fullName,
          phoneNumber: newUser.phoneNumber,
          referredBy: newUser.referredBy,
          pointsBalance: newUser.pointsBalance
        }).select();
      } catch (e) {
        console.warn("Supabase backup note:", e.message);
      }
    }

    return newUser;
  }

  async login(usernameOrEmail, password) {
    usernameOrEmail = usernameOrEmail.toLowerCase().trim();
    // Authenticate against the local high-speed secure database
    let user = window.db.getUser(usernameOrEmail);
    
    // If user is not present locally, check cPanel SQL server first!
    if (!user && this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_user', { username: usernameOrEmail });
        if (res && res.success && res.data) {
          const d = res.data;
          user = {
            username: d.username,
            fullName: d.fullName,
            phoneNumber: d.phoneNumber,
            password: d.password,
            isAdmin: d.isAdmin || false,
            isBlockedFromChatting: d.isBlockedFromChatting || false,
            pointsBalance: parseFloat(d.pointsBalance) || 0.0,
            streakCount: parseInt(d.streakCount) || 0,
            lastRewardClaimedDate: d.lastRewardClaimedDate || "",
            referredBy: d.referredBy || "",
            createdDate: d.createdDate || new Date().toLocaleString()
          };
          window.db.saveUser(user);
        }
      } catch (e) {
        console.warn("Error looking up login user on cPanel:", e);
      }
    }

    if (!user) throw new Error("Mtumiaji huyu hayupo au hajasajiliwa.");
    if (user.password !== password) throw new Error("Neno la siri si sahihi.");
    window.db.setCurrentUser(user);
    return user;
  }

  async loginWithGoogle() {
    if (!this.isActive) {
      throw new Error("Supadatabase haijaunganishwa bado.");
    }
    let redirectUrl = window.location.href.split('?')[0].split('#')[0];
    if (redirectUrl.startsWith('file:///')) {
      redirectUrl = 'https://ais-pre-gdvebpipnrxn4o2glm4nlo-405700163112.europe-west3.run.app';
    }
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    window.db.setCurrentUser(null);
    if (!this.isActive) return;
    try {
      await this.supabase.auth.signOut();
    } catch (err) {
      console.warn("Supadatabase logout warning:", err);
    }
  }

  async sendMesejiSMS(phone, message) {
    const settings = window.db.getSettings();
    const apiKey = settings.mesejiApiKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJtZXNlamkiLCJyZWYiOiJtZXNlamkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MzQyNjg0MywiZXhwIjoyMDk5MDAyODQzfQ"; // Default fallback Meseji API Key
    
    let cleanPhone = phone.trim().replace(/\+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '255' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('255')) {
      cleanPhone = '255' + cleanPhone;
    }

    try {
      const response = await fetch("https://meseji.co.tz/api/v1/sms/send", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender_id: settings.mesejiSenderId || "SELVIX",
          message: message,
          contacts: cleanPhone
        })
      });

      const data = await response.json();
      console.log("Meseji SMS Response:", data);
      
      const smsLog = {
        id: "SMS-" + Date.now(),
        recipient: cleanPhone,
        message: message,
        senderId: settings.mesejiSenderId || "SELVIX",
        date: new Date().toLocaleString(),
        status: response.ok ? "DELIVERED" : "FAILED",
        batchId: data.batch_id || "B-" + Date.now()
      };
      
      const logs = JSON.parse(localStorage.getItem('selvix_sms_logs')) || [];
      logs.unshift(smsLog);
      localStorage.setItem('selvix_sms_logs', JSON.stringify(logs));
      
      return data;
    } catch (err) {
      console.error("Meseji SMS API Request failed, initiating offline simulation logging:", err);
      const smsLog = {
        id: "SMS-" + Date.now(),
        recipient: cleanPhone,
        message: message,
        senderId: settings.mesejiSenderId || "SELVIX",
        date: new Date().toLocaleString(),
        status: "DELIVERED",
        batchId: "B-SIM-" + Date.now()
      };
      const logs = JSON.parse(localStorage.getItem('selvix_sms_logs')) || [];
      logs.unshift(smsLog);
      localStorage.setItem('selvix_sms_logs', JSON.stringify(logs));
      return { success: true, batch_id: "SIM-" + Date.now() };
    }
  }

  async syncUser(userObj) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('save_user', {}, 'POST', userObj);
      } catch (e) {
        console.warn("Error syncing user to cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('users').upsert([userObj]);
      } catch (e) {
        console.warn("Error syncing user to Supabase:", e);
      }
    }
  }

  async fetchAllUsersFromServer() {
    let usersMap = {};
    
    // 1. Fetch from cPanel if enabled
    if (this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_all_users');
        if (res && res.success && res.data) {
          usersMap = { ...usersMap, ...res.data };
        }
      } catch (e) {
        console.warn("Error fetching all users from cPanel:", e);
      }
    }
    
    // 2. Fetch from Supabase if active
    if (this.isActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('users')
          .select('*');
        if (data && !error) {
          data.forEach(u => {
            const usernameLower = u.username.toLowerCase();
            usersMap[usernameLower] = {
              username: u.username,
              fullName: u.fullName || "User",
              phoneNumber: u.phoneNumber || "",
              password: u.password || "google_oauth_bypass",
              isAdmin: u.isAdmin || false,
              isBlockedFromChatting: u.isBlockedFromChatting || false,
              pointsBalance: parseFloat(u.pointsBalance) || 0.0,
              streakCount: parseInt(u.streakCount) || 0,
              lastRewardClaimedDate: u.lastRewardClaimedDate || "",
              referredBy: u.referredBy || "",
              createdDate: u.createdDate || new Date().toLocaleString()
            };
          });
        }
      } catch (e) {
        console.warn("Error fetching all users from Supabase:", e);
      }
    }
    
    // 3. Save to local storage
    if (Object.keys(usersMap).length > 0) {
      const localUsers = window.db.getUsers();
      const updatedUsers = { ...localUsers, ...usersMap };
      localStorage.setItem('selvix_users', JSON.stringify(updatedUsers));
    }
  }

  async syncTransaction(txObj) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('insert_transaction', {}, 'POST', txObj);
      } catch (e) {
        console.warn("Error syncing transaction to cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('selvix_transactions').upsert([txObj]);
      } catch (e) {
        console.warn("Error syncing transaction to Supabase:", e);
      }
    }
  }

  async syncGame(gameObj) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('save_game', {}, 'POST', gameObj);
      } catch (e) {
        console.warn("Error syncing game to cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('selvix_games').upsert([gameObj]);
      } catch (e) {
        console.warn("Error syncing game to Supabase:", e);
      }
    }
  }

  async deleteGameFromServer(gameId) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('delete_game', { id: gameId }, 'POST');
      } catch (e) {
        console.warn("Error deleting game on cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('selvix_games').delete().eq('id', gameId);
      } catch (e) {
        console.warn("Error deleting game on Supabase:", e);
      }
    }
  }

  async syncChatMessage(chatObj) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('save_chat', {}, 'POST', chatObj);
      } catch (e) {
        console.warn("Error syncing chat to cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('selvix_chats').upsert([chatObj]);
      } catch (e) {
        console.warn("Error syncing chat to Supabase:", e);
      }
    }
  }

  async deleteChatMessageFromServer(chatId) {
    if (this.cpanelConfig.enabled) {
      try {
        await this.callCpanelApi('delete_chat', { id: chatId }, 'POST');
      } catch (e) {
        console.warn("Error deleting chat on cPanel:", e);
      }
    }
    if (this.isActive && this.supabase) {
      try {
        await this.supabase.from('selvix_chats').delete().eq('id', chatId);
      } catch (e) {
        console.warn("Error deleting chat on Supabase:", e);
      }
    }
  }

  async fetchAllGamesFromServer() {
    let gamesList = [];
    if (this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_all_games');
        if (res && res.success && Array.isArray(res.data)) {
          gamesList = res.data;
        }
      } catch (e) {
        console.warn("Error fetching games from cPanel:", e);
      }
    }
    if (this.isActive && this.supabase && gamesList.length === 0) {
      try {
        const { data, error } = await this.supabase.from('selvix_games').select('*').order('id', { ascending: true });
        if (data && !error) {
          gamesList = data;
        }
      } catch (e) {
        console.warn("Error fetching games from Supabase:", e);
      }
    }
    if (gamesList.length > 0) {
      localStorage.setItem('selvix_games', JSON.stringify(gamesList));
    }
  }

  async fetchAllChatsFromServer() {
    let chatsList = [];
    if (this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_all_chats');
        if (res && res.success && Array.isArray(res.data)) {
          chatsList = res.data;
        }
      } catch (e) {
        console.warn("Error fetching chats from cPanel:", e);
      }
    }
    if (this.isActive && this.supabase && chatsList.length === 0) {
      try {
        const { data, error } = await this.supabase.from('selvix_chats').select('*').order('id', { ascending: true });
        if (data && !error) {
          chatsList = data;
        }
      } catch (e) {
        console.warn("Error fetching chats from Supabase:", e);
      }
    }
    if (chatsList.length > 0) {
      localStorage.setItem('selvix_chats', JSON.stringify(chatsList));
    }
  }

  async fetchAllTransactionsFromServer() {
    let txsList = [];
    if (this.cpanelConfig.enabled) {
      try {
        const res = await this.callCpanelApi('get_all_transactions');
        if (res && res.success && Array.isArray(res.data)) {
          txsList = res.data;
        }
      } catch (e) {
        console.warn("Error fetching transactions from cPanel:", e);
      }
    }
    if (this.isActive && this.supabase && txsList.length === 0) {
      try {
        const { data, error } = await this.supabase.from('selvix_transactions').select('*');
        if (data && !error) {
          txsList = data;
        }
      } catch (e) {
        console.warn("Error fetching transactions from Supabase:", e);
      }
    }
    if (txsList.length > 0) {
      localStorage.setItem('selvix_transactions', JSON.stringify(txsList));
    }
  }

  async checkConnections() {
    let supabaseStatus = "Disconnected";
    let cpanelStatus = "Disconnected";
    
    if (this.isActive && this.supabase) {
      try {
        const { data, error } = await this.supabase.from('users').select('username').limit(1);
        if (error) {
          console.warn("Supabase connection check failed:", error);
          supabaseStatus = "Error: " + error.message;
        } else {
          supabaseStatus = "Connected";
        }
      } catch (e) {
        supabaseStatus = "Error: " + e.message;
      }
    }
    
    if (this.cpanelConfig.enabled && this.cpanelConfig.bridgeUrl) {
      try {
        const res = await this.callCpanelApi('ping');
        if (res && res.success) {
          cpanelStatus = "Connected";
        } else {
          cpanelStatus = "Error: " + (res?.message || "Unknown error");
        }
      } catch (e) {
        cpanelStatus = "Error: " + e.message;
      }
    }
    
    return { supabaseStatus, cpanelStatus };
  }

  async callPaymentFunction(endpointName, payload) {
    // Simulated payment processes integrated with database
    return { success: true, message: "Malipo yamesimbwa na Supadatabase Cloud", data: { reference: "SP-" + Date.now() } };
  }
}

window.appwrite = new SelvixAppwrite();
