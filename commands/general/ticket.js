const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Permissions,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  name: "ticket",
  description: "Create a ticket",
  run: async (client, interaction, args) => {
    if (
      !interaction.member.permissions.has([
        PermissionsBitField.Flags.ManageGuild,
      ])
    )
      return interaction.followUp({
        content: "You don't have enough permission",
      });
    await interaction.deleteReply();
    interaction.channel.send({
      embeds: [
        new EmbedBuilder({
          title: "Ticket",
          description:
            "Please create a ticket using the dropdown menu below\n\n{❓} Support\n\n{💰} Buy Coins\n\n{🤑} Sell Coins\n\n{👤} Buy Account\n\n{👥} Sell Account\n\n{🩸} Account Carries",
          timestamp: new Date(),
          color: 0x02023a,
          footer: { text: client.user.username },
        }),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("tickettype")
            .setPlaceholder("Nothing selected")
            .addOptions(
              {
                label: "Support",
                emoji: "❓",
                description: "Find support",
                value: "support",
              },
              {
                label: "Buy Coins",
                emoji: "💰",
                description: "Buy coins",
                value: "buycoins",
              },
              {
                label: "Sell Coins",
                emoji: "🤑",
                description: "Sell coins",
                value: "sellcoins",
              },
              {
                label: "Buy Account",
                emoji: "👤",
                description: "Buy an account",
                value: "buyaccount",
              },
              {
                label: "Sell Account",
                emoji: "👥",
                description: "Sell an account",
                value: "sellaccount",
              },
              {
                label: "Account Carries",
                emoji: "🩸",
                description: "Get an account carried",
                value: "accountcarries",
              }
            )
        ),
      ],
    });
  },
};
