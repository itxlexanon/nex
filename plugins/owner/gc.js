exports.run = {
  usage: ["gc"],
  use: "number option",
  category: "owner",
  async: async (m, { client, args, isPrefix, command, Func }) => {
    try {
      // Check if replying to gcopt message
      if (
        m.quoted &&
        m.quoted.text &&
        m.quoted.text.match(/gcopt/g) &&
        m.quoted.sender === client.decodeJid(client.user.id)
      ) {
        if (!args || !args[0]) {
          return m.reply(
            Func.example(isPrefix, command, "1 open\n\nReply to group list message with number and option in order."),
          )
        }

        if (isNaN(args[0])) {
          return m.reply(Func.example(isPrefix, command, "1 open\n\nFirst argument must be a number."))
        }

        // Extract group JID from quoted message
        const groupIndex = Number.parseInt(args[0]) - 1
        const quotedText = m.quoted.text
        const groupLines = quotedText.split("\n").filter((line) => line.includes("💳"))

        if (groupIndex < 0 || groupIndex >= groupLines.length) {
          return m.reply(
            Func.texted("bold", "🚩 Invalid group number. Please check the group data list and enter a valid number."),
          )
        }

        // Extract group JID from the selected line
        const selectedLine = groupLines[groupIndex]
        const jidMatch = selectedLine.match(/💳\*\s*:\s*(.+?)@g\.us/)
        if (!jidMatch) {
          return m.reply(Func.texted("bold", "🚩 Could not extract group JID from the selected line."))
        }

        const groupJid = jidMatch[1] + "@g.us"
        const option = args[1] ? args[1].toLowerCase() : null

        // Find group in database
        const groupData = global.db.groups.find((g) => g.jid === groupJid)
        if (!groupData) {
          return m.reply(Func.texted("bold", "🚩 Group data does not exist in database."))
        }

        // Get group metadata
        let groupMeta
        try {
          groupMeta = await client.groupMetadata(groupJid)
        } catch (error) {
          return m.reply(Func.texted("bold", "🚩 Failed to get group metadata."))
        }

        const groupName = groupMeta.subject
        const isAdmin = await client.groupAdmin(groupJid)
        const isBotAdmin = isAdmin.includes(client.user.id.split(":")[0] + "@s.whatsapp.net")

        // Handle different options
        if (!option) {
          // Show group info
          const memberCount = groupMeta.participants.length
          const expiredStatus = groupData.stay
            ? "FOREVER"
            : groupData.expired > new Date() * 1
              ? "ACTIVE"
              : Func.timeReverse(groupData.expired - new Date() * 1)

          let groupInfo = `乂  *G R O U P  I N F O*\n\n`
          groupInfo += `	◦  *Name* : ${groupName}\n`
          groupInfo += `	◦  *Members* : ${memberCount}\n`
          groupInfo += `	◦  *Expired* : ${expiredStatus}\n`
          groupInfo += `	◦  *Status* : ${groupData.mute ? "MUTED" : "ACTIVE"}\n`
          groupInfo += `	◦  *Bot Admin* : ${isBotAdmin ? "√" : "×"}\n\n`
          groupInfo += `*Options:*\n`
          groupInfo += `• open - Open group\n`
          groupInfo += `• close - Close group\n`
          groupInfo += `• mute - Mute group\n`
          groupInfo += `• unmute - Unmute group\n`
          groupInfo += `• link - Get invite link\n`
          groupInfo += `• leave - Leave group\n`
          groupInfo += `• reset - Reset group settings\n`
          groupInfo += `• 1d/3d/7d/30d - Set duration`

          return client.sendMessageModify(m.chat, groupInfo + "\n\n" + global.footer, m, {
            largeThumb: true,
            thumbnail: await Func.fetchBuffer("./media/image/default.jpg"),
          })
        }

        // Execute commands based on option
        switch (option) {
          case "open":
            if (!isBotAdmin) {
              return m.reply(Func.texted("bold", `🚩 Can't open ${groupName} group because the bot is not an admin.`))
            }
            await client.groupSettingUpdate(groupJid, "not_announcement")
            m.reply(Func.texted("bold", `🚩 ${groupName} group has been opened.`))
            break

          case "close":
            if (!isBotAdmin) {
              return m.reply(Func.texted("bold", `🚩 Can't close ${groupName} group because the bot is not an admin.`))
            }
            await client.groupSettingUpdate(groupJid, "announcement")
            m.reply(Func.texted("bold", `🚩 ${groupName} group has been closed.`))
            break

          case "mute":
            groupData.mute = true
            m.reply(Func.texted("bold", `🚩 Successfully muted bot in ${groupName} group.`))
            break

          case "unmute":
            groupData.mute = false
            m.reply(Func.texted("bold", `🚩 Successfully unmuted bot in ${groupName} group.`))
            break

          case "link":
            if (!isBotAdmin) {
              return m.reply(
                Func.texted("bold", `🚩 Can't get ${groupName} group link because the bot is not an admin.`),
              )
            }
            const inviteCode = await client.groupInviteCode(groupJid)
            m.reply(`🚩 ${groupName} Group Link:\nhttps://chat.whatsapp.com/${inviteCode}`)
            break

          case "leave":
            await client.reply(groupJid, `🚩 Good Bye Everyone! Visit: ${global.db.setting.link}`, null, {
              mentions: groupMeta.participants.map((p) => p.id),
            })
            setTimeout(async () => {
              await client.groupLeave(groupJid)
              groupData.expired = 0
              groupData.stay = false
              m.reply(Func.texted("bold", `🚩 Successfully left ${groupName} group.`))
            }, 2000)
            break

          case "reset":
            groupData.expired = 0
            groupData.stay = true
            m.reply(
              Func.texted(
                "bold",
                `🚩 Successfully reset bot configuration to default and set to stay forever in ${groupName} group.`,
              ),
            )
            break

          default:
            // Check if it's a duration (1d, 3d, 7d, 30d)
            if (["1d", "3d", "7d", "30d"].includes(option)) {
              const now = new Date() * 1
              const days = Number.parseInt(option.replace("d", ""))
              const duration = 86400000 * days // milliseconds per day * days

              groupData.expired += groupData.expired === 0 ? now + duration : duration
              groupData.stay = false

              m.reply(
                Func.texted(
                  "bold",
                  `🚩 Bot duration is successfully extended for ${days} day${days > 1 ? "s" : ""} in ${groupName} group.`,
                ),
              )
            } else {
              return m.reply(explain(isPrefix, command))
            }
        }
      } else {
        return m.reply(explain(isPrefix, command))
      }
    } catch (error) {
      console.log(error)
      m.reply(Func.jsonFormat(error))
    }
  },
  owner: true,
  cache: true,
  location: __filename,
}

const explain = (prefix, command) => {
  return `乂  *G R O U P  M O D E R A T I O N*

*1.* ${prefix + command} <no> <option>
   Reply to group list message with number and option.

*Available Options:*
• open - Open group (allow all members to send messages)
• close - Close group (only admins can send messages)  
• mute - Mute bot in the group
• unmute - Unmute bot in the group
• link - Get group invite link
• leave - Leave the group
• reset - Reset group settings to default
• 1d/3d/7d/30d - Set bot duration in the group

*Example:* ${prefix + command} 1 open

*Note:* Make sure you reply to a message containing group list to use this command properly.`
}
