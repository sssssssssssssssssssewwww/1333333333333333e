const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const Premium = require("../../database/schemas/GuildPremium");
const moment = require("moment");
const config = require("../../../config.json");
const discord = require("discord.js");
const webhookClient = new discord.WebhookClient({
  url: config.webhooks.premium,
});
let uniqid = require("uniqid");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "redeem",
      description: `Redeem a Premium code!`,
      category: "Utility",
      cooldown: 3,
      userPermission: ["MANAGE_GUILD"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    let code = args[0];

    if (!code)
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setColor("RED")
            .setDescription(
              `${message.client.emoji.fail} Please Specify a code to redeem`
            ),
        ],
      });

    if (guildDB.isPremium === "true") {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setColor("RED")
            .setDescription(
              `${message.client.emoji.fail} the current guild is already premium`
            ),
        ],
      });
    }

    const premium = await Premium.findOne({
      code: code,
    });

    if (premium) {
      const expires = moment(Number(premium.expiresAt)).format(
        "dddd, MMMM Do YYYY HH:mm:ss"
      );

      guildDB.isPremium = "true";
      guildDB.premium.redeemedBy.id = message.author.id;
      guildDB.premium.redeemedBy.tag = message.author.tag;
      guildDB.premium.redeemedAt = Date.now();
      guildDB.premium.expiresAt = premium.expiresAt;
      guildDB.premium.plan = premium.plan;

      await guildDB.save().catch(() => {});

      await premium.deleteOne().catch(() => {});

      let ID = uniqid(undefined, `-${code}`);
      const date = require("date-and-time");
      const now = new Date();
      let DDate = date.format(now, "YYYY/MM/DD HH:mm:ss");

      try {
        await message.author.send({
          embeds: [
            new discord.MessageEmbed()
              .setDescription(
                `**Premium Subscription**\n\nYou've recently redeemed a code in **${message.guild.name}** and here is your receipt:\n\n **Receipt ID:** ${ID}\n**Redeem Date:** ${DDate}\n**Guild Name:** ${message.guild.name}\n**Guild ID:** ${message.guild.id}`
              )
              .setColor(message.guild.me.displayHexColor)
              .setFooter({ text: message.guild.name }),
          ],
        });
      } catch (err) {
        console.log(err);
        message.channel.sendCustom({
          embeds: [
            new discord.MessageEmbed()
              .setDescription(
                `**Congratulations!**\n\n**${message.guild.name}** Is now a premium guild! Thanks a ton!\n\nIf you have any questions please contact me [here](${config.discord})\n\n**Could not send your Receipt via dms so here it is:**\n**Receipt ID:** ${ID}\n**Redeem Date:** ${DDate}\n**Guild Name:** ${message.guild.name}\n**Guild ID:** ${message.guild.id}\n\n**Please make sure to keep this information safe, you might need it if you ever wanna refund / transfer servers.**\n\n**Expires At:** ${expires}`
              )
              .setColor(message.guild.me.displayHexColor)
              .setFooter({ text: message.guild.name }),
          ],
        });

        return;
      }

      message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setDescription(
              `**Congratulations!**\n\n**${message.guild.name}** Is now a premium guild! Thanks a ton!\n\nIf you have any questions please contact me [here](${config.discord})\n**your receipt has been sent via dms**\n\n**Expires At:** ${expires}`
            )
            .setColor(message.guild.me.displayHexColor)
            .setFooter({ text: message.guild.name }),
        ],
      });

      const embedPremium = new discord.MessageEmbed()
        .setDescription(
          `**Premium Subscription**\n\n**${message.author.tag}** Redeemed a code in **${message.guild.name}**\n\n **Receipt ID:** ${ID}\n**Redeem Date:** ${DDate}\n**Guild Name:** ${message.guild.name}\n**Guild ID:** ${message.guild.id}\n**Redeemer Tag:** ${message.author.tag}\n**Redeemer ID:** ${message.author.id}\n\n**Expires At:** ${expires}`
        )
        .setColor(message.guild.me.displayHexColor);

      webhookClient.sendCustom({
        username: "Pogy Premium",
        avatarURL: `https://v2.pogy.xyz/logo.png`,
        embeds: [embedPremium],
      });
    } else {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setColor("RED")
            .setDescription(
              `${message.client.emoji.fail} I could not the following Code.`
            ),
        ],
      });
    }
  }
};
