/*
 * Copyright (c) 2018-2020 aetheryx & Bowser65
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const config = require('../../config.json')

const INFO_STR = `You can read all of the server rules in <#${config.discord.ids.messageRules[0]}>.`
const USAGE_STR = `Usage: ${config.discord.prefix}rule <rule id>`

module.exports = async function (msg, args) {
  if (args.length === 0) {
    return msg.channel.createMessage(`${USAGE_STR}\n\n${INFO_STR}`)
  }

  const id = parseInt(args[0])
  const rules = await msg.channel.guild.channels.get(config.discord.ids.messageRules[0]).getMessage(config.discord.ids.messageRules[1])
  const match = rules.content.match(new RegExp(`\\[0?${id}] ([^\\d]*)`))
  if (!match) {
    return msg.channel.createMessage(`This rule doesn't exist.\n${USAGE_STR}\n\n${INFO_STR}`)
  }

  const rule = match[1].split('\n').map(s => s.trim()).join(' ')
    .replace(/\[#[^a-z0-9-_]?([a-z0-9-_]+)\]/ig, (og, name) => {
      const channel = msg.channel.guild.channels.find(c => c.name === name)
      return channel ? `<#${channel.id}>` : og
    })
  msg.channel.createMessage(`**Rule #${id}**: ${rule.slice(0, rule.length - 2)}\n\n${INFO_STR}`)
}
