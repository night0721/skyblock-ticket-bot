const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "vouch",
  description: "Vouch someone",
  usage: "[User] [Reason]",
  options: [
    {
      type: 6,
      name: "user",
      description: "The user you want to vouch",
      required: true,
    },
    {
      type: 3,
      name: "reason",
      description: "The reason for vouching",
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const user = interaction.options.getUser("user");
    interaction.followUp({
      content: "Vouch sent!",
    });
    interaction.guild.channels.cache
      .get(require("../../config").vouch_channel)
      .send({
        embeds: [
          new EmbedBuilder({
            title: "Vouch",
            color: 0x00ff7f,
            description: `<@${user.id}> has been vouched for **${args[1]}** by <@${interaction.user.id}>`,
            timestamp: new Date(),
            footer: { text: client.user.username },
          }),
        ],
      });
  },
};
