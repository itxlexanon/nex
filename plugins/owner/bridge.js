exports.run = {
  usage: ["bridge", "tgbridge"],
  use: "on / off / status / sync",
  category: "owner",
  async: async (m, { client, args, isPrefix, command, Func }) => {
    try {
      if (!global.telegramBridge) {
        return client.reply(
          m.chat,
          Func.texted(
            "bold",
            "🚩 Telegram bridge is not initialized. Please configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env file.",
          ),
          m,
        )
      }

      if (!args || !args[0]) {
        const status = global.telegramBridge.config.telegram.enabled ? "ON" : "OFF"
        return client.reply(
          m.chat,
          `🚩 *Current bridge status* : [ ${status} ]\n\nUsage:\n• ${isPrefix + command} on/off - Enable/disable bridge\n• ${isPrefix + command} status - Show bridge status\n• ${isPrefix + command} sync - Sync contacts`,
          m,
        )
      }

      const option = args[0].toLowerCase()

      switch (option) {
        case "on":
          global.telegramBridge.config.telegram.enabled = true
          client.reply(m.chat, Func.texted("bold", "🚩 Telegram bridge enabled successfully."), m)
          break

        case "off":
          global.telegramBridge.config.telegram.enabled = false
          client.reply(m.chat, Func.texted("bold", "🚩 Telegram bridge disabled successfully."), m)
          break

        case "status":
          const bridge = global.telegramBridge
          const statusText =
            `🔗 *Telegram Bridge Status*\n\n` +
            `📱 Status: ${bridge.config.telegram.enabled ? "✅ Enabled" : "❌ Disabled"}\n` +
            `🤖 Bot: ${bridge.telegramBot ? "✅ Connected" : "❌ Disconnected"}\n` +
            `💬 Mapped Chats: ${bridge.chatMappings.size}\n` +
            `👥 Users: ${bridge.userMappings.size}\n` +
            `📞 Contacts: ${bridge.contactMappings.size}\n` +
            `🛑 Filters: ${bridge.filters.size}`
          client.reply(m.chat, statusText, m)
          break

        case "sync":
          client.reply(m.chat, Func.texted("bold", "🔄 Syncing contacts with Telegram..."), m)
          try {
            const contactCount = await global.telegramBridge.syncContacts()
            await global.telegramBridge.updateTopicNames()
            await global.telegramBridge.saveMappingsToDb()
            client.reply(
              m.chat,
              Func.texted("bold", `✅ Contact sync completed!\n\n📞 Total contacts: ${contactCount}\n💾 Mappings saved to database`),
              m,
            )
          } catch (error) {
            client.reply(m.chat, Func.texted("bold", `❌ Failed to sync contacts: ${error.message}`), m)
          }
          break

        default:
          client.reply(m.chat, Func.texted("bold", "🚩 Invalid option. Use: on, off, status, or sync"), m)
      }
    } catch (e) {
      client.reply(m.chat, Func.jsonFormat(e), m)
    }
  },
  owner: true,
  cache: true,
  location: __filename,
}
