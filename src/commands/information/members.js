const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const ReactionMenu = require("../../data/ReactionMenu.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "members",
      description: "Check all members of a certain role! or maybe all!",
      category: "Information",
      usage: "all | role name | @role",
      cooldown: 3,
      botPermission: ["ADD_REACTIONS"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    let prefix = guildDB.prefix;

    let role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(
        (rl) => rl.name.toLowerCase() === args.slice(0).join(" ").toLowerCase()
      ) ||
      message.guild.roles.cache.find(
        (rl) => rl.name.toUpperCase() === args.slice(0).join(" ").toUpperCase()
      );

    let embedValid = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setDescription(`${language.members2.replace(/{prefix}/g, `${prefix}`)}`)
      .setFooter({ text: "https://pogy.xyz/" })
      .setColor(message.guild.me.displayHexColor);

    if (!args[0]) return message.channel.sendCustom(embedValid);

    if (args[0].toLowerCase() === "everyone" || args[0].toLowerCase() === "all")
      role = message.guild.roles.everyone;

    if (!role) return message.channel.sendCustom(embedValid);
    const memberRole = role;

    const members = message.guild.members.cache
      .filter((m) => {
        if (m.roles.cache.find((r) => r === memberRole)) return true;
      })
      .sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
      .map(
        (m) =>
          `${m.user.tag} - ${m.joinedAt.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
      );

    const embed = new MessageEmbed()
      .setTitle(
        `${capitalize(memberRole.name)} ${language.list} [${members.length}]`
      )
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    const interval = 25;
    if (members.length === 0)
      message.channel.sendCustom(
        embed.setDescription(
          `${language.members1.replace(
            "{cap}",
            `${capitalize(memberRole.name)}`
          )}`
        )
      );
    else if (members.length <= interval) {
      const range = members.length == 1 ? "[1]" : `[1 - ${members.length}]`;
      message.channel.sendCustom(
        embed
          .setTitle(`${capitalize(memberRole.name)} ${language.list} ${range}`)
          .setDescription(members.join("\n"))
      );

      // Reaction Menu
    } else {
      embed
        .setTitle(`${capitalize(memberRole.name)} ${language.list}`)
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });

      new ReactionMenu(
        message.client,
        message.channel,
        message.member,
        embed,
        members,
        interval
      );
    }
  }
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
