exports.run = {
  usage: ["bc", "bcgc"],
  use: "text or reply media",
  category: "owner",
  async: async (m, { client, text, command, setting, Func }) => {
    try {
      const chatJid = global.db.chats.filter((v) => v.jid && v.jid.endsWith(".net")).map((v) => v.jid)
      const groupJid = Object.entries(await client.groupFetchAllParticipating()).map((entry) => entry[1])
      const id = command == "bc" ? chatJid : groupJid
      if (!id?.length) return client.reply(m.chat, Func.texted("bold", `🚩 Error, ID does not exist.`), m)
      const group = command == "bcgc"
      const q = m.quoted ? m.quoted : m
      const mime = (q.msg || q).mimetype || ""
      client.sendReact(m.chat, "🕒", m.key)

      if (/image\/(webp)/.test(mime)) {
        client.sendReact(m.chat, "🕒", m.key)
        for (const jid of id) {
          await Func.delay(1500)
          const member = group ? client.lidParser(jid?.participants)?.map((v) => v.id) : []
          const media = await q.download()
          await client.sendSticker(group ? jid.id : jid, media, null, {
            packname: setting.sk_pack,
            author: setting.sk_author,
            mentions: command == "bcgc" ? member : [],
          })
        }
        return client.reply(
          m.chat,
          Func.texted(
            "bold",
            `🚩 Successfully send broadcast message to ${id.length} ${command == "bc" ? "chats" : "groups"}`,
          ),
          m,
        )
      }

      if (/video|image\/(jpe?g|png)/.test(mime)) {
        client.sendReact(m.chat, "🕒", m.key)
        for (const jid of id) {
          await Func.delay(1500)
          const member = group ? client.lidParser(jid?.participants)?.map((v) => v.id) : []
          const media = await q.download()
          await client.sendFile(
            group ? jid.id : jid,
            media,
            "",
            q?.text ? "乂  *B R O A D C A S T*\n\n" + q.text : text || "",
            null,
            { netral: true },
            command == "bcgc" ? { contextInfo: { mentionedJid: member } } : {},
          )
        }
        return client.reply(
          m.chat,
          Func.texted(
            "bold",
            `🚩 Successfully send broadcast message to ${id.length} ${command == "bc" ? "chats" : "groups"}`,
          ),
          m,
        )
      }

      if (/audio/.test(mime)) {
        client.sendReact(m.chat, "🕒", m.key)
        for (const jid of id) {
          await Func.delay(1500)
          const member = group ? client.lidParser(jid?.participants)?.map((v) => v.id) : []
          const media = await q.download()
          await client.sendFile(
            group ? jid.id : jid,
            media,
            "",
            "",
            null,
            { netral: true },
            command == "bcgc" ? { ptt: q.ptt, contextInfo: { mentionedJid: member } } : {},
          )
        }
        return client.reply(
          m.chat,
          Func.texted(
            "bold",
            `🚩 Successfully send broadcast message to ${id.length} ${command == "bc" ? "chats" : "groups"}`,
          ),
          m,
        )
      }

      if (text) {
        client.sendReact(m.chat, "🕒", m.key)
        for (const jid of id) {
          await Func.delay(1500)
          const member = group ? client.lidParser(jid?.participants)?.map((v) => v.id) : []
          await client.sendMessageModify(group ? jid.id : jid, text, null, {
            netral: true,
            title: global.botname,
            thumbnail: await Func.fetchBuffer("https://telegra.ph/file/aa76cce9a61dc6f91f55a.jpg"),
            largeThumb: true,
            url: setting.link,
            mentions: command == "bcgc" ? member : [],
          })
        }
        return client.reply(
          m.chat,
          Func.texted(
            "bold",
            `🚩 Successfully send broadcast message to ${id.length} ${command == "bc" ? "chats" : "groups"}`,
          ),
          m,
        )
      }

      client.reply(
        m.chat,
        Func.texted("bold", `🚩 Use this command with text or by replying to an image, video or audio.`),
        m,
      )
    } catch (e) {
      client.reply(m.chat, Func.jsonFormat(e), m)
    }
  },
  owner: true,
}
