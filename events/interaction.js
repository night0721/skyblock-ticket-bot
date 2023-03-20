const client = require("../");
const {
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const id = require("../id.json");
const config = require("../config");
const dotenv = require("dotenv");
dotenv.config();
let closing = false;
client.on("interactionCreate", async interaction => {
  if (interaction.isCommand()) {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});
    const cmd = client.slashCommands.get(interaction.commandName);
    if (!cmd) return;
    const args = [];
    for (const option of interaction.options.data) {
      if (option.type === "SUB_COMMAND_GROUP") {
        if (option.name) args.push(option.name);
        option.options?.forEach(x => {
          if (x.type === 1) {
            if (x.name) args.push(x.name);
            x.options?.forEach(y => {
              if (y.value) args.push(y.value);
            });
          } else if (x.value) {
            args.push(x.value);
          }
          if (x.value) args.push(x.value);
        });
      }
      if (option.type === "SUB_COMMAND") {
        if (option.name) args.push(option.name);
        option.options?.forEach(x => {
          if (x.value) args.push(x.value);
        });
      } else if (option.value) {
        args.push(option.value);
      }
    }
    interaction.member = interaction.guild.members.cache.get(
      interaction.user.id
    );
    if (process.env.SERVER_ID !== interaction.guild.id)
      return interaction.followUp({ content: "No" });
    cmd.run(client, interaction, args).catch(e => sendE(e, interaction));
  }
  if (interaction.isButton()) {
    if (process.env.SERVER_ID !== interaction.guild.id)
      return interaction.followUp({ content: "No" });
    if (interaction.customId == "buybutton") {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
      createChannel(interaction, "buyaccount", interaction.user.username);
      interaction.followUp({ content: "Ticket created!", ephemeral: true });
    } else if (interaction.customId == "closewithreason") {
      const modal = new ModalBuilder()
        .setCustomId("closemodal")
        .setTitle("Close");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setMaxLength(1024)
            .setMinLength(1)
            .setPlaceholder('Reason for closing the ticket, e.g. "Resolved"')
            .setRequired(true)
            .setCustomId("closereason")
            .setLabel("REASON")
            .setStyle(TextInputStyle.Paragraph)
        )
      );
      await interaction.showModal(modal);
    } else if (interaction.customId == "close") {
      closing = true;
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
      interaction.followUp({
        embeds: [
          new EmbedBuilder({
            title: "Close Confimration",
            description: "Please confirm that you want to close this ticket",
            color: 0x02023a,
            timestamp: new Date(),
            footer: { text: client.user.username },
          }),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("closeconfirm")
              .setLabel("Close")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("✔")
          ),
        ],
      });
    } else if (interaction.customId == "closeconfirm") {
      if (closing) {
        close(interaction, "No reason provided");
        interaction.channel.delete();
        closing = false;
      }
    }
  }
  if (interaction.isStringSelectMenu()) {
    if (process.env.SERVER_ID !== interaction.guild.id)
      return interaction.followUp({ content: "No" });
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    await createChannel(
      interaction,
      interaction.values[0],
      interaction.user.username
    );
    interaction.followUp({ content: "Ticket created!", ephemeral: true });
  }
  if (interaction.isModalSubmit()) {
    if (process.env.SERVER_ID !== interaction.guild.id)
      return interaction.followUp({ content: "No" });
    if (interaction.customId == "closemodal") {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
      close(interaction, interaction.fields.getTextInputValue("closereason"));
      interaction.channel.delete();
    }
  }
});
function close(interaction, reason) {
  var embed = new EmbedBuilder({
    title: "Ticket closed",
    fields: [
      {
        name: "Ticket ID",
        value: interaction.channel.name.split("-")[2],
        inline: true,
      },
      {
        name: "Opened By",
        value: interaction.channel.topic
          ? `<@${interaction.channel.topic}>`
          : "Unknown",
        inline: true,
      },
      {
        name: "Closed by",
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
      {
        name: "Open Time",
        value: `<t:${Date.parse(interaction.channel.createdAt) / 1000}:f>`,
        inline: true,
      },
      {
        name: "Reason",
        value: reason,
        inline: false,
      },
    ],
    timestamp: new Date(),
    color: 0x02023a,
    footer: { text: client.user.username },
  });
  interaction.guild.channels.cache.get(config.transcript_channel).send({
    embeds: [embed],
    files: [
      new AttachmentBuilder(
        "./transcripts/" + interaction.channel.name.split("-")[2] + ".txt",
        { name: interaction.channel.name.split("-")[2] + ".txt" }
      ),
    ],
  });
  try {
    interaction.user.send({
      embeds: [embed],
      files: [
        new AttachmentBuilder(
          "./transcripts/" + interaction.channel.name.split("-")[2] + ".txt",
          { name: interaction.channel.name.split("-")[2] + ".txt" }
        ),
      ],
    });
  } catch (e) {
    console.log("Can't send transcript to user");
  }
}
async function createChannel(interaction, reason, name) {
  var channel = await interaction.guild.channels.create({
    name: "ticket-" + reason + "-" + id.id,
    type: ChannelType.GuildText,
    parent: config.ticket_category,
    permissionOverwrites: [
      {
        id: "1082026290065965106",
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: "1081991548734033943",
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: "1082026291047432202",
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: interaction.guild.roles.everyone,
        deny: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
      },
    ],
  });
  writeJson();
  var str = "";
  if (reason == "support") str = "Support";
  else if (reason == "buycoins") str = "Buy coins";
  else if (reason == "sellcoins") str = "Sell coins";
  else if (reason == "buyaccount") str = "Buy an account";
  else if (reason == "sellaccount") str = "Sell an account";
  else if (reason == "accountcarries") str = "Account carry";
  else if (reason == "conversion") str = "Conversion";
  else if (reason == "nitroservice") str = "Nitro service";
  interaction.guild.channels.cache
    .get(channel.id)
    .setTopic(interaction.user.id);
  interaction.guild.channels.cache.get(channel.id).send({
    content: `<@${interaction.user.id}>`,
    embeds: [
      new EmbedBuilder({
        title: "Opened a ticket!",
        description: `Reason: ${str}`,
        color: 0x02023a,
        timestamp: new Date(),
        footer: { text: client.user.username },
      }),
    ],
    components: [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("close")
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("closewithreason")
            .setLabel("Close With Reason")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        ),
    ],
  });
}
function sendE(e, i) {
  i.channel.send({
    embeds: [
      new EmbedBuilder({
        title: "Command Error",
        description: `\`\`\`yaml\n${e.stack}\`\`\``,
        timestamp: new Date(),
        color: 0x02023a,
        footer: { text: client.user.username },
      }),
    ],
  });
}

function writeJson() {
  id.id++;
  fs.writeFile("./id.json", JSON.stringify(id), err => {
    if (err) {
      console.log(err);
    }
  });
}
client.on("messageCreate", async message => {
  if (message.channel.parentId != config.ticket_category) return;
  var transcript = `./transcripts/${message.channel.name.split("-")[2]}.txt`;
  if (!fs.existsSync(transcript)) {
    fs.writeFile(transcript, "", function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }
  fs.appendFile(
    transcript,
    `[${new Date(Date.parse(message.createdAt)).toLocaleString()}] [${
      message.author.tag
    }]: ${message.content ? message.content : ""}\n`,
    function (err) {
      if (err) {
        return console.log(err);
      }
    }
  );
});
