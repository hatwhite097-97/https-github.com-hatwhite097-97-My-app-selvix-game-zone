// Selvix Game Zone - Appwrite Integration Client

class SelvixAppwrite {
  constructor() {
    this.client = null;
    this.account = null;
    this.databases = null;
    this.storage = null;
    this.functions = null;
    
    // Configurations (can be updated from Admin Panel Settings)
    this.config = {
      endpoint: localStorage.getItem('appwrite_endpoint') || 'https://cloud.appwrite.io/v1',
      projectId: localStorage.getItem('appwrite_project_id') || '',
      databaseId: localStorage.getItem('appwrite_database_id') || 'selvix_db',
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

  init() {
    if (this.config.projectId && window.Appwrite) {
      try {
        const { Client, Account, Databases, Storage, Functions } = window.Appwrite;
        this.client = new Client()
          .setEndpoint(this.config.endpoint)
          .setProject(this.config.projectId);
        
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
        this.storage = new Storage(this.client);
        this.functions = new Functions(this.client);
        this.isActive = true;
        console.log("Appwrite client initialized successfully connected to Project: " + this.config.projectId);
      } catch (err) {
        console.error("Failed to initialize Appwrite client: ", err);
        this.isActive = false;
      }
    } else {
      console.log("Appwrite is NOT configured or CDN not loaded. Running in high-performance Local Offline Mode.");
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
    if (!this.isActive) {
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
      await this.account.create(userId, email, password, fullName);
      
      const userDoc = {
        username: userId,
        fullName: fullName,
        phoneNumber: phoneNumber,
        isAdmin: false,
        isBlockedFromChatting: false,
        pointsBalance: 0.0,
        streakCount: 0,
        lastRewardClaimedDate: "",
        referredBy: referredBy,
        createdDate: new Date().toISOString()
      };

      await this.databases.createDocument(
        this.config.databaseId,
        this.config.usersCollection,
        userId,
        userDoc
      );

      await this.account.createEmailSession(email, password);
      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Uandikishaji ulifeli Appwrite.");
    }
  }

  async login(usernameOrEmail, password) {
    if (!this.isActive) {
      const user = window.db.getUser(usernameOrEmail);
      if (!user) throw new Error("Mtumiaji huyu hayupo au hajasajiliwa.");
      if (user.password !== password) throw new Error("Neno la siri si sahihi.");
      window.db.setCurrentUser(user);
      return user;
    }

    try {
      let session;
      if (usernameOrEmail.includes('@')) {
        session = await this.account.createEmailSession(usernameOrEmail, password);
      } else {
        session = await this.account.createEmailSession(usernameOrEmail + '@selvix.com', password);
      }
      
      const userId = session.userId;
      const userDoc = await this.databases.getDocument(
        this.config.databaseId,
        this.config.usersCollection,
        userId
      );
      
      window.db.setCurrentUser(userDoc);
      return userDoc;
    } catch (err) {
      throw new Error(err.message || "Kuingia kulifeli Appwrite.");
    }
  }

  async loginWithGoogle() {
    if (!this.isActive) {
      throw new Error("Appwrite haijaunganishwa bado.");
    }
    const redirectUrl = window.location.href.split('?')[0].split('#')[0];
    return this.account.createOAuth2Session('google', redirectUrl, redirectUrl);
  }

  async logout() {
    window.db.setCurrentUser(null);
    if (!this.isActive) return;
    try {
      await this.account.deleteSession('current');
    } catch (err) {
      console.warn("Appwrite logout warning:", err);
    }
  }

  async callPaymentFunction(endpointName, payload) {
    if (!this.isActive) {
      return { success: true, message: "Simulated response", data: { reference: "SP-" + Date.now() } };
    }
    try {
      const execution = await this.functions.createExecution(
        endpointName,
        JSON.stringify(payload)
      );
      return JSON.parse(execution.response);
    } catch (err) {
      throw new Error(err.message || "Failed to trigger SpeedPesa function.");
    }
  }
}

window.appwrite = new SelvixAppwrite();
