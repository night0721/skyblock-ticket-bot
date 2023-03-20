const config = require("../../config");
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  name: "close",
  description: "Close ticket",
  usage: "",
  run: async (client, interaction, args) => {
    if (interaction.channel.parentId != config.ticket_category) return;
    await interaction.deleteReply();
    interaction.channel.send({
      content: `<@${interaction.user.id}>`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close")
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  },
};
