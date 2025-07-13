exports.run = {
  usage: ["testbridge"],
  category: "owner",
  async: async (m, { client, Func }) => {
    try {
      if (!global.telegramBridge) {
        return client.reply(m.chat, Func.texted("bold", "❌ Telegram bridge not initialized"), m)
      }

      // Test message
      const testMessage = {
        key: {
          remoteJid: m.chat,
          participant: m.sender,
          fromMe: false,
          id: "TEST_" + Date.now(),
        },
        message: {
          conversation: "🧪 Test message from WhatsApp bridge",
        },
      }

      console.log("🧪 Testing bridge with message:", testMessage)
      await global.telegramBridge.syncMessage(testMessage, "🧪 Test message from WhatsApp bridge")

      client.reply(m.chat, Func.texted("bold", "✅ Test message sent to Telegram bridge"), m)
    } catch (error) {
      console.log("❌ Bridge test error:", error)
      client.reply(m.chat, Func.texted("bold", `❌ Bridge test failed: ${error.message}`), m)
    }
  },
  owner: true,
  cache: true,
  location: __filename,
}
