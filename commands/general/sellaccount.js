const {
  EmbedBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  MessageCollector,
} = require("discord.js");
const fetch = require("node-fetch");
const { getNetworth } = require("skyhelper-networth");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  name: "sellaccount",
  description: "Sell your account",
  usage: "[Type] [Price] [Description]",
  options: [
    {
      type: 4,
      name: "price",
      description: "The price of the account",
      required: true,
    },
    {
      type: 3,
      name: "ign",
      description: "The IGN of the account",
      required: true,
    },
    {
      type: 3,
      name: "paymentmethods",
      description: "The payment methods you accept",
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const dat = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${args[1]}`
    ).then(res => res.json());
    const uuid = dat.id;
    const data = await fetch(
      `https://api.hypixel.net/skyblock/profiles?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
    ).then(res => res.json());
    const skycrypt = await fetch(
      `https://sky.shiiyu.moe/api/v2/profile/${args[1]}`
    ).then(res => res.json());
    console.log(skycrypt);
    if (skycrypt.error) {
      return interaction.followUp({
        content:
          skycrypt.error.length > 1024
            ? skycrypt.error.slice(0, 1021) + "..."
            : skycrypt.error,
      });
    }
    var profile_index = 0;
    var profiles = Object.keys(skycrypt.profiles);
    interaction.deleteReply();
    if (profiles.length > 1) {
      var pros = [];
      var builder = new ActionRowBuilder();
      for (let i = 0; i < profiles.length; i++) {
        pros.push(skycrypt.profiles[profiles[i]].cute_name);
        builder.addComponents(
          new ButtonBuilder()
            .setCustomId(skycrypt.profiles[profiles[i]].cute_name)
            .setLabel(skycrypt.profiles[profiles[i]].cute_name)
            .setStyle(ButtonStyle.Primary)
        );
      }
      let msg = await interaction.channel.send({
        content:
          "Multiple Profiles Found! Please choose one of the following profiles:\n" +
          pros.join(", "),
        components: [builder],
      });
      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });

      collector.on("collect", async i => {
        if (i.user.id === interaction.user.id) {
          profile_index = pros.indexOf(i.customId);
          const profile = data.profiles[profile_index];
          const networth = await getNetworth(
            profile.members[uuid],
            profile.banking?.balance
          );
          msg.delete();
          collector.stop();
          send(
            profile_index,
            skycrypt,
            profiles,
            args,
            networth,
            interaction,
            client
          );
        }
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          interaction.channel.send({
            content: "No response after 30 seconds, operation canceled.",
          });
        }
      });
    } else {
      const profile = data.profiles[0];
      const networth = await getNetworth(
        profile.members[uuid],
        profile.banking?.balance
      );
      send(
        profile_index,
        skycrypt,
        profiles,
        args,
        networth,
        interaction,
        client
      );
    }
  },
};

function convert(coins) {
  if (coins >= 1000000000) {
    return (coins / 1000000000).toFixed(2) + "B";
  } else if (coins >= 1000000) {
    return (coins / 1000000).toFixed(2) + "M";
  } else if (coins >= 1000) {
    return (coins / 1000).toFixed(2) + "K";
  } else {
    return coins;
  }
}
function send(ind, skycrypt, profiles, args, networth, i, client) {
  const skyblock_data = skycrypt.profiles[profiles[ind]].data;
  const skill_average = skyblock_data.average_level.toFixed(1);
  const weight = skyblock_data.weight.senither.overall;
  const catacombs_level = skyblock_data.dungeons.catacombs.level.level;
  const sb_level = skyblock_data.skyblock_level.level;
  let slayer_string = "";
  for (var slayer of Object.keys(skyblock_data.slayers)) {
    slayer_string += `${skyblock_data.slayers[slayer].level.currentLevel} / `;
  }
  slayer_string = slayer_string.slice(0, -2);
  const hotm_level = skyblock_data.mining.core.tier.level;
  const mithril = skyblock_data.mining.core.powder.mithril.total;
  const gemstone = skyblock_data.mining.core.powder.gemstone.total;
  let hotm =
    "<:hotm:1085647151251595354> Heart of the Mountain: " +
    hotm_level +
    "\n<:mithril:1085647119718822010> Mithril Powder: " +
    convert(mithril) +
    "\n<:gemstone:1085647119718822010> Gemstone Powder: " +
    convert(gemstone);
  i.channel.send({
    embeds: [
      new EmbedBuilder({
        title: "Account Information",
        color: 0x02023a,
        fields: [
          {
            name: "<:skillaverage:1085647159795384370> Skill Average",
            value: skill_average,
            inline: true,
          },
          {
            name: "<:cata:1085647158528704585> Catacombs",
            value: catacombs_level,
            inline: true,
          },
          {
            name: "<:weight:1085647156188287129> Weight",
            value: Math.round(weight),
            inline: true,
          },
          {
            name: "<:Level:1085647162140016700> Skyblock Level",
            value: sb_level,
            inline: true,
          },
          {
            name: "<:Slayer:1085647154716086382> Slayer",
            value: slayer_string,
            inline: true,
          },
          {
            name: "<:networth:1085647152635723856> Networth",
            value: convert(networth.networth),
            inline: true,
          },
          {
            name: "<:mining:1085657907607113870> HOTM",
            value: hotm,
            inline: true,
          },
          {
            name: "Price and Payment Methods",
            value: args[0] + ", " + args[2],
            inline: false,
          },
        ],
        timestamp: new Date(),
        footer: { text: client.user.username },
      }),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buybutton")
          .setLabel("Buy")
          .setEmoji("💰")
          .setStyle(ButtonStyle.Primary)
      ),
    ],
  });
}
