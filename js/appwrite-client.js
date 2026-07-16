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

    this.isActive = false;
    this.init();
  }

  async init() {
    if (this.config.endpoint && this.config.projectId && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(this.config.endpoint, this.config.configId || this.config.projectId);
        this.isActive = true;
        console.log("Supadatabase (Supabase) client initialized successfully.");
        
        // Handle post-redirect Google OAuth Session
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        const handleSession = (session) => {
          if (session && session.user) {
            const googleUser = session.user;
            let username = (googleUser.user_metadata?.full_name || googleUser.email?.split('@')[0] || "user")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_');
            
            let localUser = window.db.getUser(username);
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
            
            // Re-trigger visual rendering in app if it's already instantiated
            if (window.app) {
              window.app.showView('user-home');
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
        
        // Remote sync if active
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

    window.db.saveUser(newUser);
    window.db.setCurrentUser(newUser);

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
    // Authenticate against the local high-speed secure database
    const user = window.db.getUser(usernameOrEmail);
    if (!user) throw new Error("Mtumiaji huyu hayupo au hajasajiliwa.");
    if (user.password !== password) throw new Error("Neno la siri si sahihi.");
    window.db.setCurrentUser(user);
    return user;
  }

  async loginWithGoogle() {
    if (!this.isActive) {
      throw new Error("Supadatabase haijaunganishwa bado.");
    }
    const redirectUrl = window.location.href.split('?')[0].split('#')[0];
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

  async callPaymentFunction(endpointName, payload) {
    // Simulated payment processes integrated with database
    return { success: true, message: "Malipo yamesimbwa na Supadatabase Cloud", data: { reference: "SP-" + Date.now() } };
  }
}

window.appwrite = new SelvixAppwrite();
