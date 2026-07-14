// Selvix Game Zone - Supadatabase (Supabase) Integration Client Wrapper

class SelvixAppwrite {
  constructor() {
    this.supabase = null;
    
    // Configurations (can be updated from Admin Panel Settings)
    this.config = {
      endpoint: localStorage.getItem('appwrite_endpoint') || 'https://szfmkjzknvsrpzsunatx.supabase.co',
      projectId: localStorage.getItem('appwrite_project_id') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Zm1ranprbnZzcnB6c3VuYXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY4NDMsImV4cCI6MjA5OTAwMjg0M30.px5v-1zXl2mvfbZhumjEzXS5eIYfNpPw9M5CN5G_6EQ',
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

    if (this.isActive) {
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

  async callPaymentFunction(endpointName, payload) {
    // Simulated payment processes integrated with database
    return { success: true, message: "Malipo yamesimbwa na Supadatabase Cloud", data: { reference: "SP-" + Date.now() } };
  }
}

window.appwrite = new SelvixAppwrite();
