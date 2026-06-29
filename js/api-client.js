// Selvix Game Zone - Custom API Client (Replaces Supabase/Appwrite)

class SelvixAPI {
  constructor() {
    // Configurations (can be updated from Admin Panel Settings)
    // The endpoint points to the hosted cPanel api.php file
    this.config = {
      apiUrl: localStorage.getItem('api_endpoint_url') || 'https://clver.site/api/api'
    };

    this.isActive = !!this.config.apiUrl;
    console.log("API Client initialized: " + this.config.apiUrl);
  }

  updateConfig(newConfig) {
    if (newConfig.url) {
      localStorage.setItem('api_endpoint_url', newConfig.url);
      this.config.apiUrl = newConfig.url;
      this.isActive = true;
      location.reload();
    }
  }

  async _request(action, payload = {}) {
    if (!this.isActive) {
      throw new Error("Local Mode: API haijaunganishwa.");
    }
    payload.action = action;
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Hitilafu imetokea kwenye seva.");
    }
    return data;
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
      const data = await this._request('REGISTER', {
        username,
        email,
        password,
        fullName,
        phoneNumber,
        referredBy
      });
      // Sync with local DB for session
      const userDoc = data.user;
      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Uandikishaji ulifeli kwenye Seva.");
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
      const data = await this._request('LOGIN', {
        username: usernameOrEmail,
        password: password
      });
      const userDoc = data.user;
      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Kuingia kulifeli.");
    }
  }

  async loginWithGoogle() {
    throw new Error("Google Login inahitaji usanidi zaidi kwenye cPanel. Kwa sasa tumia fomu ya kawaida.");
  }

  async logout() {
    window.db.setCurrentUser(null);
  }

  // --- SpeedPesa Payment Integration via Custom Backend ---
  async callPaymentFunction(endpointName, payload) {
    // endpointName is ignored since we route all actions via api.php
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
          if (mockObj.polls > 2) mockObj.status = 'SUCCESS';
          return { success: true, status: mockObj.status };
        }
        return { success: true, status: 'SUCCESS' };
      }
      return { success: true, message: "Simulated response", data: {} };
    }
    
    try {
      const data = await this._request(payload.action, payload);
      return data;
    } catch (err) {
      throw new Error(err.message || "Failed to trigger SpeedPesa function.");
    }
  }

  // --- Full Database Sync ---
  async syncState(requesterUsername) {
    if (!this.isActive) return null;
    try {
      const res = await this._request('GET_FULL_STATE', { requester_username: requesterUsername });
      return res.data;
    } catch (e) {
      console.warn("Sync failed: ", e);
      return null;
    }
  }

  async syncMutation(type, data) {
    if (!this.isActive) return;
    try {
      await this._request('SYNC_MUTATION', { type, data });
    } catch (e) {
      console.warn("Mutation sync failed: ", e);
    }
  }

  async updateSettings(speedPesaApiKey) {

    if (!this.isActive) {
      // Local Mode Fallback
      return { success: true };
    }
    try {
      const data = await this._request('UPDATE_SETTINGS', {
        speedpesa_api_key: speedPesaApiKey
      });
      return data;
    } catch (err) {
      throw new Error(err.message || "Hitilafu imetokea wakati wa kuhifadhi settings kwenye Seva.");
    }
  }
}

// We map it to window.appwrite or window.api so we don't have to rewrite the entire app.js
window.api = new SelvixAPI();
window.appwrite = window.api; // Fallback mapping for older references
