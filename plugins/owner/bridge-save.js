exports.run = {
  usage: ["bridgesave", "savemappings"],
  category: "owner",
  async: async (m, { client, Func }) => {
    try {
      if (!global.telegramBridge) {
        return client.reply(m.chat, Func.texted("bold", "❌ Telegram bridge not initialized"), m)
      }

      await global.telegramBridge.saveMappingsToDb()

      const mappingCounts = {
        chats: global.telegramBridge.chatMappings.size,
        users: global.telegramBridge.userMappings.size,
        contacts: global.telegramBridge.contactMappings.size,
        filters: global.telegramBridge.filters.size,
      }

      client.reply(
        m.chat,
        Func.texted(
          "bold",
          `✅ Bridge mappings saved to database!\n\n` +
            `💬 Chats: ${mappingCounts.chats}\n` +
            `👥 Users: ${mappingCounts.users}\n` +
            `📞 Contacts: ${mappingCounts.contacts}\n` +
            `🛑 Filters: ${mappingCounts.filters}`,
        ),
        m,
      )
    } catch (error) {
      console.log("❌ Bridge save error:", error)
      client.reply(m.chat, Func.texted("bold", `❌ Failed to save mappings: ${error.message}`), m)
    }
  },
  owner: true,
  cache: true,
  location: __filename,
}
