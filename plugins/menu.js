const { Component } = require('@neoxr/wb')
const { Version } = new Component
const fs = require('fs')

exports.run = {
   usage: ['menu', 'help', 'command'],
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      setting,
      users,
      plugins,
      env,
      Func
   }) => {
      try {
         client.menu = client.menu ? client.menu : {}
         const id = m.chat
         const local_size = fs.existsSync('./' + env.database + '.json') ? await Func.getSize(fs.statSync('./' + env.database + '.json').size) : ''
         const library = JSON.parse(require('fs').readFileSync('./package.json', 'utf-8'))
         const message = setting.msg.replace('+tag', `@${m.sender.replace(/@.+/g, '')}`).replace('+name', m.pushName).replace('+greeting', Func.greeting()).replace('+db', (process.env.DATABASE_URL ? /mongo/.test(process.env.DATABASE_URL) ? 'Mongo' : /postgre/.test(process.env.DATABASE_URL) ? 'Postgres' : 'N/A' : `Local (${local_size})`)).replace('+module', Version).replace('+version', (library.dependencies.bails ? library.dependencies.bails : library.dependencies['@adiwajshing/baileys'] ? '@adiwajshing/baileys' : library.dependencies.baileys).replace('^', '').replace('~', ''))
         const style = setting.style
         if (style === 1) {
            let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage)
            let cmd = Object.fromEntries(filter)
            let category = []
            for (let name in cmd) {
               let obj = cmd[name].run
               if (!cmd) continue
               if (!obj.category || setting.hidden.includes(obj.category)) continue
               if (Object.keys(category).includes(obj.category)) category[obj.category].push(obj)
               else {
                  category[obj.category] = []
                  category[obj.category].push(obj)
               }
            }
            const keys = Object.keys(category).sort()
            let print = message
            print += '\n' + String.fromCharCode(8206).repeat(4001)
            for (let k of keys) {
               print += '\n\n乂  *' + k.toUpperCase().split('').map(v => v).join(' ') + '*\n\n'
               let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == k.toLowerCase())
               let usage = Object.keys(Object.fromEntries(cmd))
               if (usage.length == 0) return
               let commands = []
               cmd.map(([_, v]) => {
                  switch (v.run.usage.constructor.name) {
                     case 'Array':
                        v.run.usage.map(x => commands.push({
                           usage: x,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        }))
                        break
                     case 'String':
                        commands.push({
                           usage: v.run.usage,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        })
                  }
               })
               print += commands.sort((a, b) => a.usage.localeCompare(b.usage)).map(v => `	◦  ${isPrefix + v.usage} ${v.use}`).join('\n')
            }
            client.sendMessageModify(m.chat, Func.Styles(print) + '\n\n' + global.footer, m, {
               ads: false,
               largeThumb: true,
               thumbnail: Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
               url: setting.link
            })
         } else if (style === 2) {
            let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage)
            let cmd = Object.fromEntries(filter)
            let category = []
            for (let name in cmd) {
               let obj = cmd[name].run
               if (!cmd) continue
               if (!obj.category || setting.hidden.includes(obj.category)) continue
               if (Object.keys(category).includes(obj.category)) category[obj.category].push(obj)
               else {
                  category[obj.category] = []
                  category[obj.category].push(obj)
               }
            }
            const keys = Object.keys(category).sort()
            let print = message
            print += '\n' + String.fromCharCode(8206).repeat(4001)
            for (let k of keys) {
               print += '\n\n –  *' + k.toUpperCase().split('').map(v => v).join(' ') + '*\n\n'
               let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == k.toLowerCase())
               let usage = Object.keys(Object.fromEntries(cmd))
               if (usage.length == 0) return
               let commands = []
               cmd.map(([_, v]) => {
                  switch (v.run.usage.constructor.name) {
                     case 'Array':
                        v.run.usage.map(x => commands.push({
                           usage: x,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        }))
                        break
                     case 'String':
                        commands.push({
                           usage: v.run.usage,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        })
                  }
               })
               print += commands.sort((a, b) => a.usage.localeCompare(b.usage)).map((v, i) => {
                  if (i == 0) {
                     return `┌  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else if (i == commands.sort((a, b) => a.usage.localeCompare(b.usage)).length - 1) {
                     return `└  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else {
                     return `│  ◦  ${isPrefix + v.usage} ${v.use}`
                  }
               }).join('\n')
            }
            client.sendMessageModify(m.chat, Func.Styles(print) + '\n\n' + global.footer, m, {
               ads: false,
               largeThumb: true,
               thumbnail: Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
               url: setting.link
            })
         } else if (style === 3) {
            let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage)
            let cmd = Object.fromEntries(filter)
            let category = []
            for (let name in cmd) {
               let obj = cmd[name].run
               if (!cmd) continue
               if (!obj.category || setting.hidden.includes(obj.category)) continue
               if (Object.keys(category).includes(obj.category)) category[obj.category].push(obj)
               else {
                  category[obj.category] = []
                  category[obj.category].push(obj)
               }
            }
            const keys = Object.keys(category).sort()
            let print = message
            print += '\n' + String.fromCharCode(8206).repeat(4001)
            for (let k of keys) {
               print += '\n\n –  *' + k.toUpperCase().split('').map(v => v).join(' ') + '*\n\n'
               let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == k.toLowerCase())
               let usage = Object.keys(Object.fromEntries(cmd))
               if (usage.length == 0) return
               let commands = []
               cmd.map(([_, v]) => {
                  switch (v.run.usage.constructor.name) {
                     case 'Array':
                        v.run.usage.map(x => commands.push({
                           usage: x,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        }))
                        break
                     case 'String':
                        commands.push({
                           usage: v.run.usage,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        })
                  }
               })
               print += commands.sort((a, b) => a.usage.localeCompare(b.usage)).map((v, i) => {
                  if (i == 0) {
                     return `┌  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else if (i == commands.sort((a, b) => a.usage.localeCompare(b.usage)).length - 1) {
                     return `└  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else {
                     return `│  ◦  ${isPrefix + v.usage} ${v.use}`
                  }
               }).join('\n')
            }
            client.sendMessageModify(m.chat, print + '\n\n' + global.footer, m, {
               ads: false,
               largeThumb: true,
               thumbnail: Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
               url: setting.link
            })
         } else if (style === 4) {
            if (text) {
               let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == text.trim().toLowerCase() && !setting.hidden.includes(v.run.category.toLowerCase()))
               let usage = Object.keys(Object.fromEntries(cmd))
               if (usage.length == 0) return
               let commands = []
               cmd.map(([_, v]) => {
                  switch (v.run.usage.constructor.name) {
                     case 'Array':
                        v.run.usage.map(x => commands.push({
                           usage: x,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        }))
                        break
                     case 'String':
                        commands.push({
                           usage: v.run.usage,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        })
                  }
               })
               let print = commands.sort((a, b) => a.usage.localeCompare(b.usage)).map((v, i) => {
                  if (i == 0) {
                     return `┌  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else if (i == commands.sort((a, b) => a.usage.localeCompare(b.usage)).length - 1) {
                     return `└  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else {
                     return `│  ◦  ${isPrefix + v.usage} ${v.use}`
                  }
               }).join('\n')
               m.reply(print)
            } else {
               let print = message
               print += '\n' + String.fromCharCode(8206).repeat(4001) + '\n'
               let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage)
               let cmd = Object.fromEntries(filter)
               let category = []
               for (let name in cmd) {
                  let obj = cmd[name].run
                  if (!cmd) continue
                  if (!obj.category || setting.hidden.includes(obj.category)) continue
                  if (Object.keys(category).includes(obj.category)) category[obj.category].push(obj)
                  else {
                     category[obj.category] = []
                     category[obj.category].push(obj)
                  }
               }
               const keys = Object.keys(category).sort()
               print += keys.sort((a, b) => a.localeCompare(b)).map((v, i) => {
                  if (i == 0) {
                     return `┌  ◦  ${isPrefix + command} ${v}`
                  } else if (i == keys.sort((a, b) => a.localeCompare(b)).length - 1) {
                     return `└  ◦  ${isPrefix + command} ${v}`
                  } else {
                     return `│  ◦  ${isPrefix + command} ${v}`
                  }
               }).join('\n')
               client.sendMessageModify(m.chat, print + '\n\n' + global.footer, m, {
                  ads: false,
                  largeThumb: true,
                  thumbnail: Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64'),
                  url: setting.link
               })
            }
         } else if (style === 5) {
            if (text) {
               let cmd = Object.entries(plugins).filter(([_, v]) => v.run.usage && v.run.category == text.trim().toLowerCase() && !setting.hidden.includes(v.run.category.toLowerCase()))
               let usage = Object.keys(Object.fromEntries(cmd))
               if (usage.length == 0) return
               let commands = []
               cmd.map(([_, v]) => {
                  switch (v.run.usage.constructor.name) {
                     case 'Array':
                        v.run.usage.map(x => commands.push({
                           usage: x,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        }))
                        break
                     case 'String':
                        commands.push({
                           usage: v.run.usage,
                           use: v.run.use ? Func.texted('bold', v.run.use) : ''
                        })
                  }
               })
               let print = commands.sort((a, b) => a.usage.localeCompare(b.usage)).map((v, i) => {
                  if (i == 0) {
                     return `┌  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else if (i == commands.sort((a, b) => a.usage.localeCompare(b.usage)).length - 1) {
                     return `└  ◦  ${isPrefix + v.usage} ${v.use}`
                  } else {
                     return `│  ◦  ${isPrefix + v.usage} ${v.use}`
                  }
               }).join('\n')
               m.reply(Func.Styles(print))
            } else {
               let print = message
               // print += '\n' + String.fromCharCode(8206).repeat(4001) + '\n'
               let filter = Object.entries(plugins).filter(([_, obj]) => obj.run.usage)
               let cmd = Object.fromEntries(filter)
               let category = []
               for (let name in cmd) {
                  let obj = cmd[name].run
                  if (!cmd) continue
                  if (!obj.category || setting.hidden.includes(obj.category)) continue
                  if (Object.keys(category).includes(obj.category)) category[obj.category].push(obj)
                  else {
                     category[obj.category] = []
                     category[obj.category].push(obj)
                  }
               }
               const keys = Object.keys(category).sort()
               let sections = []
               const label = {
                  highlight_label: 'Many Used'
               }
               keys.sort((a, b) => a.localeCompare(b)).map((v, i) => sections.push({
                  ...(/download|conver|util/.test(v) ? label : {}),
                  rows: [{
                     title: Func.ucword(v),
                     description: `There are ${Func.arrayJoin(Object.entries(plugins).filter(([_, x]) => x.run.usage && x.run.category == v.trim().toLowerCase() && !setting.hidden.includes(x.run.category.toLowerCase())).map(([_, x]) => x.run.usage)).length} commands`,
                     id: `${isPrefix + command} ${v}`
                  }]
               }))
               const buttons = [{
                  name: 'single_select',
                  buttonParamsJson: JSON.stringify({
                     title: 'Tap Here!',
                     sections
                  })
               }]
               client.sendIAMessage(m.chat, buttons, m, {
                  header: '',
                  content: print,
                  footer: global.footer,
                  media: Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')
               })
            }
         }
      } catch (e) {
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}
