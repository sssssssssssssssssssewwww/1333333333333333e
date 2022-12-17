const discord = require("discord.js");
const ticketSchema = require("../../database/models/tickets.js");
const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "claim",
      description: "Claim a ticket to assist the user.",
      aliases: [],
      cooldown: 3,
      usage: " ",
      category: "Tickets",
    });
  }

  async run(message) {
    const client = message.client;

    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    await ticketSchema.findOne(
      {
        guildID: message.guild.id,
      },
      async (err, db) => {
        if (!db) return;

        let ticketRole = message.guild.roles.cache.get(db.supportRoleID);

        if (!message.member.roles.cache.has(ticketRole.id))
          return message.channel.sendCustom({
            embeds: [
              new discord.MessageEmbed()
                .setColor(client.color.red)
                .setDescription(
                  language.claimNotHaveRole.replace(
                    "{roleName}",
                    ticketRole.name
                  )
                ),
            ],
          });

        if (!message.channel.name.startsWith("ticket-"))
          return message.channel.sendCustom({
            embeds: [
              new discord.MessageEmbed()
                .setColor(client.color.red)
                .setDescription(language.claimNotValidChannel),
            ],
          });

        message.channel.permissionOverwrites
          .edit(message.author, {
            VIEW_CHANNEL: true,
          })
          .catch(() => {
            message.channel.sendCustom({
              embeds: [
                new discord.MessageEmbed()
                  .setColor(client.color.red)
                  .setDescription(language.unclaimDontHavePerms),
              ],
            });
          });
        message.channel.permissionOverwrites
          .edit(ticketRole.id, {
            VIEW_CHANNEL: false,
          })
          .catch(() => {
            message.channel.sendCustom({
              embeds: [
                new discord.MessageEmbed()
                  .setColor(client.color.red)
                  .setDescription(language.unclaimDontHavePerms),
              ],
            });
          });

        let pogy = message.guild.me;
        let everyone = message.guild.roles.everyone;

        message.channel.permissionOverwrites
          .edit(pogy, {
            VIEW_CHANNEL: true,

            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
            ATTACH_FILES: true,
          })
          .catch(() => {
            message.channel.sendCustom({
              embeds: [
                new discord.MessageEmbed()
                  .setColor(client.color.red)
                  .setDescription(language.unclaimDontHavePerms),
              ],
            });
          });
        message.channel.permissionOverwrites
          .edit(everyone, { VIEW_CHANNEL: false })
          .catch(() => {
            message.channel.sendCustom({
              embeds: [
                new discord.MessageEmbed()
                  .setColor(client.color.red)
                  .setDescription(language.unclaimDontHavePerms),
              ],
            });
          });

        message.channel.sendCustom({
          embeds: [
            new discord.MessageEmbed()
              .setColor(client.color.green)
              .setDescription(
                language.claimSuccess.replace(
                  "{userName}",
                  message.author.username
                )
              ),
          ],
        });
      }
    );
  }
};
