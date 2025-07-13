const { models } = require("./models")
const Init = require("./init")
const init = new Init()

module.exports = (m, env) => {
  // Initialize or update user data
  let user = global.db.users.find((v) => v.jid == m.sender)
  if (!user) {
    user = init.getModel(models.users)
    global.db.users.push(user)
  }
  init.execute(user, models.users, {
    name: m.pushName,
    limit: env.limit,
  })

  // Initialize or update group data
  if (m.isGroup) {
    let group = global.db.groups.find((v) => v.jid == m.chat)
    if (!group) {
      group = init.getModel(models.groups)
      global.db.groups.push(group)
    }
    init.execute(group, models.groups)
  }

  // Initialize or update chat data
  let chat = global.db.chats.find((v) => v.jid == m.chat)
  if (!chat) {
    chat = init.getModel(models.chats)
    global.db.chats.push(chat)
  }
  init.execute(chat, models.chats)

  // Initialize or update setting data
  const setting = global.db.setting
  if (!setting || Object.keys(setting).length === 0) {
    global.db.setting = init.getModel(models.setting)
  } else {
    init.execute(setting, models.setting)
  }

  // REMOVED: Telegram Bridge specific initialization from schema.js
  // The global.db.bridge object is initialized once in client.js
  // and managed exclusively by the TelegramBridge class.
}
