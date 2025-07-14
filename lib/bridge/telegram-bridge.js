const TelegramBot = require("node-telegram-bot-api")
const TelegramCommands = require("./telegram-commands")
const logger = require("../system/logger")

class TelegramBridge {
  constructor(whatsappClient, database) {
    this.whatsappClient = whatsappClient
    this.database = database
    this.telegramBot = null
    this.commands = null
    this.authenticatedUsers = new Set()

    // Initialize mappings as Maps for better performance
    this.chatMappings = new Map()
    this.userMappings = new Map()
    this.contactMappings = new Map()
    this.filters = new Set()

    this.config = {
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        password: process.env.TELEGRAM_PASSWORD || "neoxr123",
        enabled: true,
      },
    }

    this.messageQueue = []
    this.isProcessingQueue = false
  }

  async initialize() {
    if (!this.config.telegram.botToken || !this.config.telegram.chatId) {
      throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables")
    }

    try {
      // Initialize Telegram bot
      this.telegramBot = new TelegramBot(this.config.telegram.botToken, { polling: true })
      this.commands = new TelegramCommands(this)

      // Load existing mappings from database
      await this.loadMappingsFromDb()

      // Set up event handlers
      this.setupTelegramHandlers()

      // Register bot commands
      await this.commands.registerBotCommands()

      // Removed initial contact sync from here.
      // It will now be triggered from client.js after WhatsApp connection is 'open'.
      // await this.syncContacts() 

      logger.info("✅ Telegram bridge initialized successfully")
      return true
    } catch (error) {
      logger.error("❌ Failed to initialize Telegram bridge:", error)
      throw error
    }
  }

  async loadMappingsFromDb() {
    try {
      if (global.db?.bridge) {
        const bridge = global.db.bridge

        // Load chat mappings
        if (bridge.chatMappings && typeof bridge.chatMappings === "object") {
          this.chatMappings = new Map(Object.entries(bridge.chatMappings))
        }

        // Load user mappings
        if (bridge.userMappings && typeof bridge.userMappings === "object") {
          this.userMappings = new Map(Object.entries(bridge.userMappings))
        }

        // Load contact mappings
        if (bridge.contactMappings && typeof bridge.contactMappings === "object") {
          this.contactMappings = new Map(Object.entries(bridge.contactMappings))
        }

        // Load filters
        if (bridge.filters && Array.isArray(bridge.filters)) {
          this.filters = new Set(bridge.filters)
        }

        logger.info(
          `📂 Loaded mappings - Chats: ${this.chatMappings.size}, Users: ${this.userMappings.size}, Contacts: ${this.contactMappings.size}, Filters: ${this.filters.size}`,
        )
      }
    } catch (error) {
      logger.error("❌ Error loading mappings from database:", error)
    }
  }

  async saveMappingsToDb() {
    try {
      if (!global.db.bridge) {
        global.db.bridge = {
          chatMappings: {},
          userMappings: {},
          contactMappings: {},
          filters: [],
        }
      }

      // Convert Maps to Objects for database storage
      global.db.bridge.chatMappings = Object.fromEntries(this.chatMappings)
      global.db.bridge.userMappings = Object.fromEntries(this.userMappings)
      global.db.bridge.contactMappings = Object.fromEntries(this.contactMappings)
      global.db.bridge.filters = Array.from(this.filters)

      // Save to database
      if (this.database?.save) {
        await this.database.save(global.db)
      }

      logger.info("💾 Bridge mappings saved to database")
    } catch (error) {
      logger.error("❌ Error saving mappings to database:", error)
    }
  }

  async syncContacts() {
    try {
      logger.info("🔄 Starting contact synchronization...")

      // Clear existing contact mappings
      this.contactMappings.clear()

      // Method 1: Get contacts from WhatsApp store
      if (this.whatsappClient?.store?.contacts) {
        const storeContacts = this.whatsappClient.store.contacts
        for (const [jid, contact] of Object.entries(storeContacts)) {
          if (jid.endsWith("@s.whatsapp.net") && contact.name) {
            const phoneNumber = jid.replace("@s.whatsapp.net", "")
            this.contactMappings.set(phoneNumber, contact.name)
          }
        }
        logger.info(`📱 Synced ${this.contactMappings.size} contacts from WhatsApp store`)
      }

      // Method 2: Get contacts from database users
      if (global.db?.users && Array.isArray(global.db.users)) {
        let dbContactCount = 0
        for (const user of global.db.users) {
          if (user.jid && user.name && user.jid.endsWith("@s.whatsapp.net")) {
            const phoneNumber = user.jid.replace("@s.whatsapp.net", "")
            if (!this.contactMappings.has(phoneNumber)) {
              this.contactMappings.set(phoneNumber, user.name)
              dbContactCount++
            }
          }
        }
        logger.info(`📊 Added ${dbContactCount} additional contacts from database`)
      }

      // Method 3: Get contacts from group participants
      try {
        const groups = await this.whatsappClient.groupFetchAllParticipating()
        let groupContactCount = 0
        
        for (const [groupJid, groupData] of Object.entries(groups)) {
          if (groupData.participants) {
            for (const participant of groupData.participants) {
              const jid = participant.id
              if (jid.endsWith("@s.whatsapp.net")) {
                const phoneNumber = jid.replace("@s.whatsapp.net", "")
                
                // Try to get name from participant data or use phone number
                let name = participant.name || phoneNumber
                
                // Try to get better name from store if available
                if (this.whatsappClient?.store?.contacts?.[jid]?.name) {
                  name = this.whatsappClient.store.contacts[jid].name
                }
                
                if (!this.contactMappings.has(phoneNumber)) {
                  this.contactMappings.set(phoneNumber, name)
                  groupContactCount++
                }
              }
            }
          }
        }
        logger.info(`👥 Added ${groupContactCount} contacts from group participants`)
      } catch (error) {
        logger.warn("⚠️ Could not fetch group participants for contact sync:", error.message)
      }

      // Method 4: Try to get contacts using WhatsApp's contact list (if available)
      try {
        if (this.whatsappClient.getContacts) {
          const waContacts = await this.whatsappClient.getContacts()
          let waContactCount = 0
          
          for (const contact of waContacts) {
            if (contact.id && contact.id.endsWith("@s.whatsapp.net")) {
              const phoneNumber = contact.id.replace("@s.whatsapp.net", "")
              const name = contact.name || contact.notify || phoneNumber
              
              if (!this.contactMappings.has(phoneNumber)) {
                this.contactMappings.set(phoneNumber, name)
                waContactCount++
              }
            }
            }
          logger.info(`📞 Added ${waContactCount} contacts from WhatsApp contact list`)
        }
      } catch (error) {
        logger.warn("⚠️ Could not fetch WhatsApp contacts:", error.message)
      }

      // Save the updated mappings
      await this.saveMappingsToDb()

      logger.info(`✅ Contact sync completed - Total contacts: ${this.contactMappings.size}`)
      return this.contactMappings.size
    } catch (error) {
      logger.error("❌ Error during contact synchronization:", error)
      throw error
    }
  }

  setupTelegramHandlers() {
    // Handle incoming messages
    this.telegramBot.on("message", async (msg) => {
      try {
        // Handle commands
        if (msg.text && msg.text.startsWith("/")) {
          await this.commands.handleCommand(msg)
          return
        }

        // Handle replies to WhatsApp messages
        if (msg.reply_to_message && this.isUserAuthenticated(msg.from.id)) {
          await this.handleTelegramReply(msg)
          return
        }

        // Handle regular messages from authenticated users
        if (this.isUserAuthenticated(msg.from.id) && msg.text) {
          // You can implement direct message sending logic here if needed
        }
      } catch (error) {
        logger.error("❌ Error handling Telegram message:", error)
      }
    })

    // Handle callback queries (inline keyboard buttons)
    this.telegramBot.on("callback_query", async (query) => {
      try {
        await this.telegramBot.answerCallbackQuery(query.id)
        // Handle callback query logic here if needed
      } catch (error) {
        logger.error("❌ Error handling callback query:", error)
      }
    })

    // Handle errors
    this.telegramBot.on("error", (error) => {
      logger.error("❌ Telegram bot error:", error)
    })

    // Handle polling errors
    this.telegramBot.on("polling_error", (error) => {
      logger.error("❌ Telegram polling error:", error)
    })
  }

  async setupWhatsAppHandlers() {
    // This method can be called to set up additional WhatsApp event handlers if needed
    logger.info("🔗 WhatsApp handlers set up for bridge")
  }

  async handleTelegramReply(msg) {
    try {
      const replyText = msg.reply_to_message.text
      if (!replyText) return

      // Extract WhatsApp JID from the reply message
      const jidMatch = replyText.match(/From: (.+@(?:s\.whatsapp\.net|g\.us))/)
      if (!jidMatch) return

      const targetJid = jidMatch[1]
      const messageText = msg.text

      // Send message to WhatsApp
      await this.whatsappClient.sendMessage(targetJid, { text: messageText })

      // Confirm to Telegram user
      await this.telegramBot.sendMessage(msg.chat.id, `✅ Message sent to WhatsApp`, {
        reply_to_message_id: msg.message_id,
      })
    } catch (error) {
      logger.error("❌ Error handling Telegram reply:", error)
      await this.telegramBot.sendMessage(msg.chat.id, `❌ Failed to send message: ${error.message}`)
    }
  }

  async syncMessage(whatsappMessage, messageBody) {
    if (!this.config.telegram.enabled || !this.telegramBot) return

    try {
      // Add to queue for processing
      this.messageQueue.push({ whatsappMessage, messageBody })
      
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        await this.processMessageQueue()
      }
    } catch (error) {
      logger.error("❌ Error syncing message:", error)
    }
  }

  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return

    this.isProcessingQueue = true

    try {
      while (this.messageQueue.length > 0) {
        const { whatsappMessage, messageBody } = this.messageQueue.shift()
        await this.processSingleMessage(whatsappMessage, messageBody)
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      logger.error("❌ Error processing message queue:", error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  async processSingleMessage(whatsappMessage, messageBody) {
    try {
      const senderJid = whatsappMessage.key?.participant || whatsappMessage.key?.remoteJid
      const chatJid = whatsappMessage.key?.remoteJid

      if (!senderJid || !chatJid) return

      // Check filters
      if (messageBody && this.shouldFilterMessage(messageBody)) {
        return
      }

      // Get sender info
      const senderPhone = senderJid.replace("@s.whatsapp.net", "")
      const senderName = this.contactMappings.get(senderPhone) || senderPhone

      // Format message for Telegram
      let telegramMessage = `📱 *WhatsApp Message*\n\n`
      telegramMessage += `👤 From: ${senderName} (${senderPhone})\n`
      
      if (chatJid.endsWith("@g.us")) {
        // Group message
        const groupName = await this.getGroupName(chatJid)
        telegramMessage += `👥 Group: ${groupName}\n`
      }
      
      telegramMessage += `💬 Message: ${messageBody || "[Media/Other]"}\n`
      telegramMessage += `🆔 JID: ${senderJid}`

      // Send to Telegram
      await this.telegramBot.sendMessage(this.config.telegram.chatId, telegramMessage, {
        parse_mode: "Markdown",
      })

    } catch (error) {
      logger.error("❌ Error processing single message:", error)
    }
  }

  async getGroupName(groupJid) {
    try {
      if (this.whatsappClient?.store?.chats?.[groupJid]?.name) {
        return this.whatsappClient.store.chats[groupJid].name
      }
      
      const groupMetadata = await this.whatsappClient.groupMetadata(groupJid)
      return groupMetadata?.subject || "Unknown Group"
    } catch (error) {
      return "Unknown Group"
    }
  }

  shouldFilterMessage(messageBody) {
    if (!messageBody || this.filters.size === 0) return false
    
    const lowerMessage = messageBody.toLowerCase()
    for (const filter of this.filters) {
      if (lowerMessage.startsWith(filter.toLowerCase())) {
        return true
      }
    }
    return false
  }

  async sendStartMessage() {
    try {
      const message = 
        `🤖 *Neoxr WhatsApp-Telegram Bridge Started*\n\n` +
        `✅ Bridge initialized successfully\n` +
        `📱 WhatsApp: Connected\n` +
        `💬 Contacts: ${this.contactMappings.size}\n` +
        `🛑 Filters: ${this.filters.size}\n\n` +
        `Use /password to authenticate and access commands.`

      await this.telegramBot.sendMessage(this.config.telegram.chatId, message, {
        parse_mode: "Markdown",
      })
    } catch (error) {
      logger.error("❌ Error sending start message:", error)
    }
  }

  // Authentication methods
  authenticateUser(userId, password) {
    if (password === this.config.telegram.password) {
      this.authenticatedUsers.add(userId)
      return true
    }
    return false
  }

  isUserAuthenticated(userId) {
    return this.authenticatedUsers.has(userId)
  }

  // Filter management
  async addFilter(word) {
    this.filters.add(word.toLowerCase())
    await this.saveMappingsToDb()
  }

  async clearFilters() {
    this.filters.clear()
    await this.saveMappingsToDb()
  }

  // Utility methods
  getContactName(phoneNumber) {
    return this.contactMappings.get(phoneNumber) || phoneNumber
  }

  async updateTopicNames() {
    // This method can be implemented if you want to update Telegram topic names
    // based on WhatsApp contact names
    logger.info("📝 Topic names update completed")
  }
}

module.exports = TelegramBridge 
