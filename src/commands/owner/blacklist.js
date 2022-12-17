const Command = require("../../structures/Command");
const { WebhookClient, MessageEmbed } = require("discord.js");
const config = require("../../../config.json");
const webhookClient = new WebhookClient({
  url: config.webhooks.blacklist,
});
const Blacklist = require("../../database/schemas/blacklist");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "blacklist",
      aliases: ["bl"],
      description: "Adds a user to the blacklist.",
      category: "Owner",
      usage: ["<user> <reason>"],
      ownerOnly: true,
    });
  }

  async run(message, args) {
    const match = message.content.match(/\d{18}/);
    let member;
    try {
      member = match
        ? message.mentions.members.first() ||
          message.guild.members.fetch(args[1])
        : null;
    } catch {
      return message.channel.sendCustom(`Provide me with a user`);
    }

    let guild = this.client.guilds.cache.get(args[1]);
    let reason = args.slice(2).join(" ") || "Not Specified";

    if (args.length < 1)
      return message.channel.sendCustom(
        `Please provide me with a user or guild blacklist [{prefix} blacklist <user | guild> <actual user or guild>. Example: {prefix} blacklist user @user]`
      );
    if (args.length < 2)
      return message.channel.sendCustom(`Provide me with a user`);

    if (!member)
      return message.channel.sendCustom(`Provide me with a valid user`);

    if (args[0] === "user") {
      await Blacklist.findOne(
        {
          discordId: member.id,
        },
        (err, user) => {
          if (!user) {
            const blacklist = new Blacklist({
              discordId: member.id,
              length: null,
              type: "user",
              isBlacklisted: true,
              reason,
            });
            blacklist.save();
          } else {
            user.updateOne({
              type: "user",
              isBlacklisted: true,
              reason,
              length: null,
            });
          }
        }
      );

      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: `User added to the blacklist! `,
          description: `${member.user.tag} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addField("Status", "Added to the blacklist.")
        .addField("User", `${member.user.tag} (${member.id})`)
        .addField("Responsible", `${message.author} (${message.author.id})`)
        .addField("Reason", `${reason}`);

      return webhookClient.sendCustom({
        username: "Pogy",
        avatarURL: `https://v2.pogy.xyz/logo.png`,
        embeds: [embed],
      });
    }

    // guild blacklist
    if (args[0] === "guild") {
      await Blacklist.findOne(
        {
          guildId: guild,
        },
        (err, server) => {
          if (!server) {
            const blacklist = new Blacklist({
              guildId: guild.id,
              length: null,
              type: "guild",
              isBlacklisted: true,
              reason,
            });
            blacklist.save();
          } else {
            server.updateOne({
              type: "guild",
              isBlacklisted: true,
              reason,
              length: null,
            });
          }
        }
      );

      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: "Server added to the blacklist!",
          description: `${guild.name} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addField("Status", "Added to the blacklist.")
        .addField("Server", `${guild.name} (${guild.id})`)
        .addField("Responsible", `${message.author} (${message.author.id})`)
        .addField("Reason", reason);

      return webhookClient.sendCustom({
        username: "Pogy Blacklists",
        avatarURL: `https://v2.pogy.xyz/logo.png`,
        embeds: [embed],
      });
    }
  }
};
