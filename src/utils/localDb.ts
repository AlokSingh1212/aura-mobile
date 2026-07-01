import * as SQLite from "expo-sqlite";

// Open or create the local SQLite database synchronously
let db: SQLite.SQLiteDatabase;
try {
  db = SQLite.openDatabaseSync("aura_local.db");
} catch (err) {
  console.error("Failed to open SQLite database:", err);
}

/**
 * Initializes the database schemas and tables.
 */
export const initDatabase = () => {
  if (!db) return;
  try {
    // 1. Feed items cache table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS feed_items (
        id TEXT PRIMARY KEY,
        url TEXT,
        caption TEXT,
        likesCount INTEGER,
        commentsCount INTEGER,
        userName TEXT,
        userAvatar TEXT,
        createdAt TEXT,
        category TEXT,
        tab TEXT
      );
    `);

    // 2. Shop products cache table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL,
        images TEXT, -- JSON string array
        discount INTEGER,
        description TEXT
      );
    `);

    // 3. Chat messages cache table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        convoId TEXT,
        content TEXT,
        senderId TEXT,
        senderName TEXT,
        createdAt TEXT,
        status TEXT
      );
    `);

    // 4. Offline persistent pending action sync queue table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS pending_actions (
        id TEXT PRIMARY KEY,
        actionType TEXT,
        payload TEXT, -- JSON stringified payload
        createdAt TEXT
      );
    `);

    // 5. Chat conversations cache table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        name TEXT,
        lastMessage TEXT,
        avatar TEXT,
        category TEXT,
        updatedAt TEXT,
        unread INTEGER
      );
    `);

    // 6. Sync pointer tracker table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_pointers (
        key TEXT PRIMARY KEY,
        val INTEGER
      );
    `);

    // 7. Dynamic height layout caches
    db.execSync(`
      CREATE TABLE IF NOT EXISTS layout_caches (
        id TEXT PRIMARY KEY,
        height REAL
      );
    `);
    
    console.log("Local SQLite database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize SQLite schemas:", err);
  }
};

// ==========================================
// FEED ITEMS CACHE OPERATIONS
// ==========================================

export const cacheFeedItems = (items: any[], category: string = "", tab: string = "For You") => {
  if (!db) return;
  try {
    db.execSync("BEGIN TRANSACTION;");
    for (const item of items) {
      db.runSync(`
        INSERT OR REPLACE INTO feed_items 
        (id, url, caption, likesCount, commentsCount, userName, userAvatar, createdAt, category, tab)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
        item.id,
        item.url || "",
        item.caption || "",
        item.likesCount || 0,
        item.comments?.length || 0,
        item.user?.name || "Anonymous",
        item.user?.avatar || "",
        item.createdAt || new Date().toISOString(),
        category,
        tab
      );
    }
    db.execSync("COMMIT;");
  } catch (err) {
    try {
      db.execSync("ROLLBACK;");
    } catch (_) {}
    console.error("Failed to cache feed items in SQLite:", err);
  }
};

export const getLocalFeedItems = (category: string = "", tab: string = "For You"): any[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync(`
      SELECT * FROM feed_items 
      WHERE category = ? AND tab = ? 
      ORDER BY createdAt DESC;
    `, [category, tab]);
    return rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      caption: row.caption,
      likesCount: row.likesCount,
      comments: Array.from({ length: row.commentsCount }), // Mock comments list for layout mapping
      createdAt: row.createdAt,
      user: { name: row.userName, avatar: row.userAvatar }
    }));
  } catch (err) {
    console.error("Failed to read local SQLite feed items:", err);
    return [];
  }
};

// ==========================================
// PRODUCTS CACHE OPERATIONS
// ==========================================

export const cacheProducts = (products: any[]) => {
  if (!db) return;
  try {
    db.execSync("BEGIN TRANSACTION;");
    for (const prod of products) {
      db.runSync(`
        INSERT OR REPLACE INTO products 
        (id, name, price, images, discount, description)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
        prod.id,
        prod.name || "",
        prod.price || 0,
        JSON.stringify(prod.images || []),
        prod.discount || 0,
        prod.description || ""
      );
    }
    db.execSync("COMMIT;");
  } catch (err) {
    try {
      db.execSync("ROLLBACK;");
    } catch (_) {}
    console.error("Failed to cache products in SQLite:", err);
  }
};

export const getLocalProducts = (): any[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync("SELECT * FROM products;");
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      images: JSON.parse(row.images || "[]"),
      discount: row.discount,
      description: row.description
    }));
  } catch (err) {
    console.error("Failed to read local SQLite products:", err);
    return [];
  }
};

// ==========================================
// PERSISTENT PENDING ACTION QUEUE OPERATIONS
// ==========================================

export const addPendingAction = (actionType: string, payload: any) => {
  if (!db) return;
  try {
    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.runSync(`
      INSERT INTO pending_actions (id, actionType, payload, createdAt)
      VALUES (?, ?, ?, ?);
    `, id, actionType, JSON.stringify(payload), new Date().toISOString());
    console.log(`Persistent action queued offline: [${actionType}] ID: ${id}`);
  } catch (err) {
    console.error("Failed to queue offline pending action:", err);
  }
};

export const getPendingActions = (): any[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync("SELECT * FROM pending_actions ORDER BY createdAt ASC;");
    return rows.map((row: any) => ({
      id: row.id,
      actionType: row.actionType,
      payload: JSON.parse(row.payload || "{}"),
      createdAt: row.createdAt
    }));
  } catch (err) {
    console.error("Failed to query offline actions queue:", err);
    return [];
  }
};

export const deletePendingAction = (id: string) => {
  if (!db) return;
  try {
    db.runSync("DELETE FROM pending_actions WHERE id = ?;", id);
    console.log(`Action resolved and removed from offline queue: ${id}`);
  } catch (err) {
    console.error(`Failed to remove pending action: ${id}`, err);
  }
};

// ==========================================
// CHAT MESSAGES CACHE OPERATIONS
// ==========================================

export const cacheMessages = (messages: any[]) => {
  if (!db) return;
  try {
    db.execSync("BEGIN TRANSACTION;");
    for (const msg of messages) {
      db.runSync(`
        INSERT OR REPLACE INTO messages 
        (id, convoId, content, senderId, senderName, createdAt, status)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
        msg.id,
        msg.conversationId || msg.convoId || "",
        msg.content || "",
        msg.senderId || "",
        msg.senderName || "",
        msg.createdAt || new Date().toISOString(),
        msg.status || "sent"
      );
    }
    db.execSync("COMMIT;");
  } catch (err) {
    try {
      db.execSync("ROLLBACK;");
    } catch (_) {}
    console.error("Failed to cache chat messages in SQLite:", err);
  }
};

export const getLocalMessages = (convoId: string): any[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync(`
      SELECT * FROM messages 
      WHERE convoId = ? 
      ORDER BY createdAt ASC;
    `, [convoId]);
    return rows.map((row: any) => ({
      id: row.id,
      conversationId: row.convoId,
      content: row.content,
      senderId: row.senderId,
      senderName: row.senderName,
      createdAt: row.createdAt,
      status: row.status || "sent"
    }));
  } catch (err) {
    console.error(`Failed to read local SQLite messages for convo ${convoId}:`, err);
    return [];
  }
};

// ==========================================
// CHAT CONVERSATIONS CACHE OPERATIONS
// ==========================================

export const cacheConversations = (conversations: any[]) => {
  if (!db) return;
  try {
    db.execSync("BEGIN TRANSACTION;");
    for (const c of conversations) {
      db.runSync(`
        INSERT OR REPLACE INTO conversations 
        (id, name, lastMessage, avatar, category, updatedAt, unread)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
        c.id,
        c.name || "Chat Room",
        c.lastMessage || c.message || "",
        c.avatar || "",
        c.category || "Primary",
        c.updatedAt || new Date().toISOString(),
        c.unread ? 1 : 0
      );
      
      // Also cache its embedded messages if they exist!
      if (c.messages && Array.isArray(c.messages)) {
        for (const msg of c.messages) {
          db.runSync(`
            INSERT OR REPLACE INTO messages 
            (id, convoId, content, senderId, senderName, createdAt, status)
            VALUES (?, ?, ?, ?, ?, ?, ?);
          `,
            msg.id,
            c.id,
            msg.content || "",
            msg.senderId || "",
            msg.senderName || "",
            msg.createdAt || new Date().toISOString(),
            msg.status || "sent"
          );
        }
      }
    }
    db.execSync("COMMIT;");
  } catch (err) {
    try {
      db.execSync("ROLLBACK;");
    } catch (_) {}
    console.error("Failed to cache conversations in SQLite:", err);
  }
};

export const getLocalConversations = (): any[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync("SELECT * FROM conversations ORDER BY updatedAt DESC;");
    return rows.map((row: any) => {
      // Get all local messages for this conversation
      const messages = getLocalMessages(row.id);
      return {
        id: row.id,
        name: row.name,
        lastMessage: row.lastMessage,
        message: row.lastMessage, // compatibility fallback
        avatar: row.avatar,
        category: row.category,
        updatedAt: row.updatedAt,
        unread: row.unread === 1,
        messages
      };
    });
  } catch (err) {
    console.error("Failed to read local SQLite conversations:", err);
    return [];
  }
};

// ==========================================
// SYNC POINTERS OPERATIONS
// ==========================================

export const getSyncPointer = (key: string): number => {
  if (!db) return 0;
  try {
    const row: any = db.getFirstSync("SELECT val FROM sync_pointers WHERE key = ?;", [key]);
    return row ? row.val : 0;
  } catch (err) {
    console.warn("Failed to get sync pointer:", err);
    return 0;
  }
};

export const setSyncPointer = (key: string, val: number) => {
  if (!db) return;
  try {
    db.runSync("INSERT OR REPLACE INTO sync_pointers (key, val) VALUES (?, ?);", [key, val]);
  } catch (err) {
    console.error("Failed to update sync pointer:", err);
  }
};

// ==========================================
// LAYOUT CACHES OPERATIONS
// ==========================================

export const getCachedLayoutHeight = (id: string): number | null => {
  if (!db) return null;
  try {
    const row: any = db.getFirstSync("SELECT height FROM layout_caches WHERE id = ?;", [id]);
    return row ? row.height : null;
  } catch {
    return null;
  }
};

export const cacheLayoutHeight = (id: string, height: number) => {
  if (!db) return;
  try {
    db.runSync("INSERT OR REPLACE INTO layout_caches (id, height) VALUES (?, ?);", [id, height]);
  } catch {}
};
