const CUTEBOARD_EMOTE = '🌺';
const STARBOARD_EMOTE = '⭐';
const GENERIC_STAR_OBJ = {
  messageId: null,
  stars: 0
};
const CUTE = [ 69, CUTEBOARD_EMOTE, 0xf49898 ];
const EMOTES = [
  [ 0, '⭐', 0xffffff ],
  [ 5, '🌟', 0xffffaa ],
  [ 10, '💫', 0xffff66 ],
  [ 20, '✨', 0xffff00 ]
];

module.exports = class Starboard {
  constructor (bot, mongo, config) {
    this.mongo = mongo;
    this.config = config;
    this.bot = bot;

    bot.on('messageReactionAdd', async (msg, emoji, user) => this.process(msg, emoji, user));
    bot.on('messageReactionRemove', async (msg, emoji, user) => this.process(msg, emoji, user));
    bot.on('messageReactionRemoveAll', (msg) => {
      this.updateStarCount(msg, 0);
    });
  }

  async process (msg, emoji, user) {
    if (!msg.author) {
      msg = await this.bot.getMessage(msg.channel.id, msg.id);
    }

    if (emoji.name === STARBOARD_EMOTE && this._isProcessable(msg, user)) {
      const reactions = await this.bot.getMessageReaction(msg.channel.id, msg.id, STARBOARD_EMOTE);
      this.updateStarCount(msg, reactions.filter(u => u.id !== msg.author.id).length);
    }

    if (emoji.name === CUTEBOARD_EMOTE && this._isProcessable(msg, user, true)) {
      const reactions = await this.bot.getMessageReaction(msg.channel.id, msg.id, CUTEBOARD_EMOTE);
      this.updateStarCount(msg, reactions.filter(u => u.id !== msg.author.id).length, true);
    }
  }

  async updateStarCount (msg, count, cute) {
    const channel = cute ? this.config.discord.boat.cuteboard : this.config.discord.boat.starboard;
    const entry = await this.mongo.findOne({ _id: msg.id }) || {
      ...GENERIC_STAR_OBJ,
      cute
    };
    entry.stars = count;

    if (entry.stars < 1) {
      if (entry.messageId) {
        this.mongo.deleteOne({ _id: msg.id });
        this.bot.deleteMessage(channel, entry.messageId);
      }
      return;
    }

    if (!entry.messageId) {
      const starMsg = await this.bot.createMessage(channel, this._buildStarMessage(entry.stars, msg, cute));
      entry.messageId = starMsg.id;
    } else {
      this.bot.editMessage(channel, entry.messageId, this._buildStarMessage(entry.stars, msg, cute));
    }

    this.mongo.updateOne(
      { _id: msg.id },
      { $set: { ...entry } },
      { upsert: true }
    );
  }

  _isProcessable (msg, stargazer, cute) {
    const channel = cute ? this.config.discord.boat.cuteboard : this.config.discord.boat.starboard;
    return !msg.channel.nsfw &&
      msg.author.id !== stargazer.id &&
      msg.channel.id !== channel &&
      !(msg.content.length === 0 && msg.attachments.length === 0 && (!msg.embeds[0] || msg.embeds[0].type !== 'image'));
  }

  _buildStarMessage (stars, msg, cute) {
    const [ , star, color ] = cute ? CUTE : EMOTES.filter(e => e[0] < stars).pop();
    return {
      content: `${star} **${stars}** - <#${msg.channel.id}>`,
      embed: {
        color,
        author: {
          name: `${msg.author.username}#${msg.author.discriminator}`,
          icon_url: msg.author.avatarURL
        },
        description: msg.content,
        image: this._resolveAttachment(msg),
        fields: [
          {
            name: 'Jump to message',
            value: `[Click here](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`
          }
        ]
      }
    };
  }

  _resolveAttachment (msg) {
    if (msg.attachments.length > 0 && msg.attachments[0].width) {
      return msg.attachments[0];
    } else if (msg.embeds.length > 0 && msg.embeds[0].type === 'image') {
      return msg.embeds[0].image || msg.embeds[0].thumbnail;
    }

    return null;
  }
};
