exports.run = {
  usage: ["bridgestatus"],
  category: "owner",
  async: async (m, { client, Func }) => {
    try {
      let statusText = "🔗 *Telegram Bridge Status*\n\n"

      if (!global.telegramBridge) {
        statusText += "❌ Bridge: Not initialized\n"
        statusText += "💡 Check environment variables and restart bot"
      } else {
        const bridge = global.telegramBridge
        statusText += `✅ Bridge: Initialized\n`
        statusText += `📱 Enabled: ${bridge.config?.telegram?.enabled ? "✅ Yes" : "❌ No"}\n`
        statusText += `🤖 Bot: ${bridge.telegramBot ? "✅ Connected" : "❌ Disconnected"}\n`
        statusText += `💬 Chats: ${bridge.chatMappings?.size || 0}\n`
        statusText += `👥 Users: ${bridge.userMappings?.size || 0}\n`
        statusText += `📞 Contacts: ${bridge.contactMappings?.size || 0}\n`
        statusText += `🛑 Filters: ${bridge.filters?.size || 0}\n`
        statusText += `🆔 Chat ID: ${bridge.config?.telegram?.chatId || "Not set"}\n`
        statusText += `🔑 Bot Token: ${bridge.config?.telegram?.botToken ? "✅ Set" : "❌ Not set"}`
      }

      client.reply(m.chat, statusText, m)
    } catch (error) {
      client.reply(m.chat, Func.texted("bold", `❌ Error: ${error.message}`), m)
    }
  },
  owner: true,
  cache: true,
  location: __filename,
}
