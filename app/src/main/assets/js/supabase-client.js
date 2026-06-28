// Selvix Game Zone - Supabase Integration Client

class SelvixSupabase {
  constructor() {
    this.client = null;
    
    // Configurations (can be updated from Admin Panel Settings)
    this.config = {
      supabaseUrl: localStorage.getItem('supabase_url') || '',
      supabaseKey: localStorage.getItem('supabase_anon_key') || ''
    };

    this.isActive = false;
    this.init();
  }

  init() {
    if (this.config.supabaseUrl && this.config.supabaseKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(
          this.config.supabaseUrl,
          this.config.supabaseKey
        );
        this.isActive = true;
        console.log("Supabase client initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize Supabase client: ", err);
        this.isActive = false;
      }
    } else {
      console.log("Supabase is NOT configured or CDN not loaded. Running in high-performance Local Offline Mode.");
      this.isActive = false;
    }
  }

  updateConfig(newConfig) {
    Object.keys(newConfig).forEach(key => {
      localStorage.setItem('supabase_' + key, newConfig[key]);
    });
    location.reload();
  }

  // --- Auth & Users ---
  async register(username, email, password, fullName, phoneNumber, referredBy) {
    if (!this.isActive) {
      // Local Mode Fallback
      const existing = window.db.getUser(username);
      if (existing) throw new Error("Username tayari inatumika!");

      const newUser = {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password,
        isAdmin: false,
        isBlockedFromChatting: false,
        pointsBalance: 0.0,
        streakCount: 0,
        lastRewardClaimedDate: "",
        referredBy: referredBy.toLowerCase().trim(),
        createdDate: new Date().toLocaleString()
      };

      window.db.saveUser(newUser);
      window.db.setCurrentUser(newUser);
      return newUser;
    }

    try {
      const userId = username.toLowerCase().trim();
      
      // 1. Create Supabase Auth Account
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email: email,
        password: password
      });

      if (authError) throw authError;

      // 2. Create User Document in Database
      const userDoc = {
        id: authData.user.id,
        username: userId,
        full_name: fullName,
        phone_number: phoneNumber,
        is_admin: false,
        is_blocked_from_chatting: false,
        points_balance: 0.0,
        streak_count: 0,
        last_reward_claimed_date: null,
        referred_by: referredBy
      };

      const { error: dbError } = await this.client
        .from('users')
        .insert([userDoc]);

      if (dbError) throw dbError;

      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Uandikishaji ulifeli Supabase.");
    }
  }

  async login(usernameOrEmail, password) {
    if (!this.isActive) {
      // Local Mode Fallback
      const user = window.db.getUser(usernameOrEmail);
      if (!user) throw new Error("Mtumiaji huyu hayupo au hajasajiliwa.");
      if (user.password !== password) throw new Error("Neno la siri si sahihi.");
      window.db.setCurrentUser(user);
      return user;
    }

    try {
      let emailToUse = usernameOrEmail;
      if (!usernameOrEmail.includes('@')) {
        emailToUse = usernameOrEmail + '@selvix.com';
      }
      
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
        email: emailToUse,
        password: password
      });

      if (authError) throw authError;
      
      // Fetch User Document
      const { data: userDoc, error: dbError } = await this.client
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (dbError) throw dbError;

      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Kuingia kulifeli Supabase.");
    }
  }

  async loginWithGoogle() {
    if (!this.isActive) {
      throw new Error("Supabase haijaunganishwa bado.");
    }
    const redirectUrl = window.location.href.split('?')[0].split('#')[0];
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
  }

  async logout() {
    window.db.setCurrentUser(null);
    if (!this.isActive) return;
    try {
      await this.client.auth.signOut();
    } catch (err) {
      console.warn("Supabase logout warning:", err);
    }
  }

  // --- Supabase Edge Functions & SpeedPesa Payment ---
  async callPaymentFunction(endpointName, payload) {
    if (!this.isActive) {
      // Simulated Payment Process for Local Mode
      if (payload.action === 'REQUEST_PAYMENT') {
        window.mockPayments = window.mockPayments || {};
        window.mockPayments[payload.reference] = { polls: 0, status: 'PENDING' };
        return { success: true, message: "Simulated request", data: { reference: payload.reference } };
      } else if (payload.action === 'CHECK_STATUS') {
        window.mockPayments = window.mockPayments || {};
        const mockObj = window.mockPayments[payload.reference];
        if (mockObj) {
          mockObj.polls++;
          // Simulate user taking 6 seconds to enter PIN
          if (mockObj.polls > 2) mockObj.status = 'SUCCESS';
          return { success: true, status: mockObj.status };
        }
        return { success: true, status: 'SUCCESS' }; // fallback
      }
      return { success: true, message: "Simulated response", data: {} };
    }
    try {
      // Calls Supabase Edge Function that handles SpeedPesa API integrations
      const { data, error } = await this.client.functions.invoke(endpointName, {
        body: payload
      });
      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(err.message || "Failed to trigger SpeedPesa function.");
    }
  }
}

// Replace window.appwrite with window.supabaseClient to differentiate, or just keep the same name for ease of replacement.
// Here we map it to window.appwrite so we don't have to rewrite the entire app.js
window.appwrite = new SelvixSupabase();
