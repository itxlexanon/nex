exports.run = {
  usage: ["join"],
  use: "group link",
  category: "owner",
  async: async (m, { client, args, isPrefix, command, Func }) => {
    try {
      if (!args || !args[0]) {
        return client.reply(m.chat, Func.example(isPrefix, command, "https://chat.whatsapp.com/codeInvite"), m)
      }
      const link = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
      const [_, code] = args[0].match(link) || []
      if (!code) return client.reply(m.chat, global.status.invalid, m)
      const id = await client.groupAcceptInvite(code)
      if (!id.endsWith("g.us")) {
        return client.reply(m.chat, Func.texted("bold", `🚩 Sorry i can't join to this group :(`), m)
      }
      const member = await (await client.groupMetadata(id)).participants.map((v) => v.id)
      return client.reply(m.chat, `🚩 Joined!`, m)
    } catch {
      return client.reply(m.chat, Func.texted("bold", `🚩 Sorry i can't join to this group :(`), m)
    }
  },
  owner: true,
}
