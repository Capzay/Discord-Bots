const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  RoleManager,
  Collection,
  REST,
  Routes,
  Events,
  Partials,
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { title } = require("process");
const cron = require("node-cron");
const path = require("path");
const app = express();
const port = 3000;
const { get_delete, get_ids, get_scrim, get_kds } = require("./functions");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Create a Collection (map) to store command data
client.commands = new Collection();

// Read command files from the commands directory
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data);
}

let global_ids = get_ids();
// Register the commands with Discord
const rest = new REST({ version: "10" }).setToken(global_ids["token"]);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    let global_ids = get_ids();
    await rest.put(
      Routes.applicationGuildCommands(
        global_ids["client_id"],
        global_ids["guild_id"]
      ),
      {
        body: commands,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// When the client is ready, run this code (only once)
client.once("ready", async () => {
  console.log("Ready!");
});

cron.schedule("0 0 1 * *", () => {
  kds = get_kds();
  for (let player in kds) {
    async function sendMsg(client, newEmbed) {
      let global_ids = get_ids();
      const channel = await client.channels.fetch(global_ids["monthly_kds"]);
      const guild = await client.guilds.fetch(global_ids["guild_id"]);
      await channel.send({ embeds: [newEmbed] });
    }

    if (player === "Na") {
      continue;
    } else {
      let Maps = JSON.stringify(kds[player]["Maps"]);
      let Kills = JSON.stringify(kds[player]["Kills"]);
      let Deaths = JSON.stringify(kds[player]["Deaths"]);
      let Assists = JSON.stringify(kds[player]["Assists"]);
      let KD = Kills / Deaths;
      let KM = Kills / Maps;
      let DM = Deaths / Maps;
      KD = KD.toFixed(2);
      KM = KM.toFixed(2);
      DM = DM.toFixed(2);

      const newEmbed = new EmbedBuilder()
        .setTitle(`Monthly stats for: ${player}`)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          { name: `Maps`, value: Maps, inline: false },
          { name: `Kills`, value: Kills, inline: false },
          { name: `Deaths`, value: Deaths, inline: false },
          { name: `Assists`, value: Assists, inline: false },
          { name: `K/D`, value: KD, inline: false },
          { name: `K/M`, value: KM, inline: false },
          { name: `D/M`, value: DM, inline: false }
        );
      sendMsg(client, newEmbed);
      kds[player]["Maps"] = 0;
      kds[player]["Kills"] = 0;
      kds[player]["Deaths"] = 0;
      kds[player]["Assists"] = 0;

      let updatedData = JSON.stringify(kds, null, 2);
      fs.writeFileSync("player-stats.json", updatedData);
    }
  }
});

// Schedule a task to run every Sunday at 12:24 PM
cron.schedule("5 18 * * 1", async () => {
  // Fetch API example to make a GET request
  let global_ids = get_ids();

  try {
    // Fetch data from the API
    const response = await fetch(
      "https://api.vrmasterleague.com/Teams/7pDCrMNVqvvPxF-MoPKUgA2/Matches/Upcoming"
    );

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Parse the response as JSON
    const data = await response.json();

    // Assuming the response is an array, get the first item
    const firstItem = data[0];

    // Access the 'homeTeam' property
    const week = firstItem.week;
    const homeTeam = firstItem.homeTeam;
    const homeTeamName = homeTeam.teamName;
    const homeTeamLogo = homeTeam.teamLogo;

    const awayTeam = firstItem.awayTeam;
    const awayTeamName = awayTeam.teamName;
    const awayTeamLogo = awayTeam.teamLogo;

    const embed = new EmbedBuilder()
      .setTitle(`VRML WEEK: ${week}`)
      .setColor(0x0099ff) // You can also use other color formats like "#0099ff"
      .setThumbnail("https://vrmasterleague.com" + awayTeamLogo); // URL to the thumbnail image
    embed.addFields(
      { name: "Home", value: homeTeamName, inline: false },
      { name: "Away", value: awayTeamName, inline: false }
    );

    const channel = await client.channels.fetch(
      global_ids["upcomming_matches"]
    );

    await channel.send({ embeds: [embed] });

    // Fetch the role by its ID
    const guild = client.guilds.cache.get(global_ids["guild_id"]);
    const role = guild.roles.cache.get(global_ids["team_role_id"]);
    await channel.send(`<@&${role.id}>`);
  } catch (error) {
    // Handle any errors that occur during fetch or processing
    console.error("There was a problem with the fetch operation:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (command) {
      try {
        await interaction.deferReply({ ephemeral: true });
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    async function Can(key, scrimjsonData) {
      let Cant = scrimjsonData[key]["Cant"];

      if (Cant[interaction.user.username] === interaction.user.id) {
        delete Cant[interaction.user.username];
      }

      let Unsure = scrimjsonData[key]["Unsure"];
      if (Unsure[interaction.user.username] === interaction.user.id) {
        delete Unsure[interaction.user.username];
      }

      let Sub = scrimjsonData[key]["Sub"];
      if (Sub[interaction.user.username] === interaction.user.id) {
        delete Sub[interaction.user.username];
      }

      scrimjsonData[key]["Can"][interaction.user.username] =
        interaction.user.id;

      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);

      const Can_data = scrimjsonData[key]["Can"];
      const Can_ids = Object.values(Can_data);
      const Cant_data = scrimjsonData[key]["Cant"];
      const Cant_ids = Object.values(Cant_data);
      const Unsure_data = scrimjsonData[key]["Unsure"];
      const Unsure_ids = Object.values(Unsure_data);
      const Sub_data = scrimjsonData[key]["Sub"];
      const Sub_ids = Object.values(Sub_data);

      let global_ids = get_ids();

      const channel = interaction.channel;
      const old_message = await channel.messages.fetch(global_ids[key]);

      // Get the existing embed
      const oldEmbed = old_message.embeds[0];
      let Can_Text = "";
      let Cant_Text = "";
      let Unsure_Text = "";
      let Sub_Text = "";

      if (Can_ids.length == 0) {
        Can_Text = "No signups yet";
      } else {
        for (const ids of Can_ids) {
          Can_Text = Can_Text + `<@${ids}>` + "\n";
        }
      }

      if (Cant_ids.length == 0) {
        Cant_Text = "No signups yet";
      } else {
        for (const ids of Cant_ids) {
          Cant_Text = Cant_Text + `<@${ids}>` + "\n";
        }
      }

      if (Unsure_ids.length == 0) {
        Unsure_Text = "No signups yet";
      } else {
        for (const ids of Unsure_ids) {
          Unsure_Text = Unsure_Text + `<@${ids}>` + "\n";
        }
      }

      if (Sub_ids.length == 0) {
        Sub_Text = "No signups yet";
      } else {
        for (const ids of Sub_ids) {
          Sub_Text = Sub_Text + `<@${ids}>` + "\n";
        }
      }

      const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          {
            name: `Can (${CanKeyCount}/5)`,
            value: Can_Text,
            inline: false,
          },
          { name: `Sub`, value: Sub_Text, inline: false },
          { name: `Cant`, value: Cant_Text, inline: false },
          { name: `Unsure`, value: Unsure_Text, inline: false }
        );
      await old_message.edit({ embeds: [newEmbed] });

      await interaction.reply({
        content: "You are a main!",
        ephemeral: true,
      });
    }

    async function Sub(key, scrimjsonData) {
      let Can = scrimjsonData[key]["Can"];

      if (Can[interaction.user.username] === interaction.user.id) {
        delete Can[interaction.user.username];
      }

      let Unsure = scrimjsonData[key]["Unsure"];
      if (Unsure[interaction.user.username] === interaction.user.id) {
        delete Unsure[interaction.user.username];
      }

      let Cant = scrimjsonData[key]["Cant"];
      if (Cant[interaction.user.username] === interaction.user.id) {
        delete Cant[interaction.user.username];
      }

      scrimjsonData[key]["Sub"][interaction.user.username] =
        interaction.user.id;

      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);

      const Can_data = scrimjsonData[key]["Can"];
      const Can_ids = Object.values(Can_data);
      const Cant_data = scrimjsonData[key]["Cant"];
      const Cant_ids = Object.values(Cant_data);
      const Unsure_data = scrimjsonData[key]["Unsure"];
      const Unsure_ids = Object.values(Unsure_data);
      const Sub_data = scrimjsonData[key]["Sub"];
      const Sub_ids = Object.values(Sub_data);

      let global_ids = get_ids();

      const channel = interaction.channel;
      const old_message = await channel.messages.fetch(global_ids[key]);

      // Get the existing embed
      const oldEmbed = old_message.embeds[0];
      let Can_Text = "";
      let Cant_Text = "";
      let Unsure_Text = "";
      let Sub_Text = "";

      if (Can_ids.length == 0) {
        Can_Text = "No signups yet";
      } else {
        for (const ids of Can_ids) {
          Can_Text = Can_Text + `<@${ids}>` + "\n";
        }
      }

      if (Cant_ids.length == 0) {
        Cant_Text = "No signups yet";
      } else {
        for (const ids of Cant_ids) {
          Cant_Text = Cant_Text + `<@${ids}>` + "\n";
        }
      }

      if (Unsure_ids.length == 0) {
        Unsure_Text = "No signups yet";
      } else {
        for (const ids of Unsure_ids) {
          Unsure_Text = Unsure_Text + `<@${ids}>` + "\n";
        }
      }

      if (Sub_ids.length == 0) {
        Sub_Text = "No signups yet";
      } else {
        for (const ids of Sub_ids) {
          Sub_Text = Sub_Text + `<@${ids}>` + "\n";
        }
      }

      const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          {
            name: `Can (${CanKeyCount}/5)`,
            value: Can_Text,
            inline: false,
          },
          { name: `Sub`, value: Sub_Text, inline: false },
          { name: `Cant`, value: Cant_Text, inline: false },
          { name: `Unsure`, value: Unsure_Text, inline: false }
        );
      await old_message.edit({ embeds: [newEmbed] });

      await interaction.reply({
        content: "You are a sub!",
        ephemeral: true,
      });
    }

    async function Cant(key, scrimjsonData) {
      let Can = scrimjsonData[key]["Can"];

      if (Can[interaction.user.username] === interaction.user.id) {
        delete Can[interaction.user.username];
      }

      let Unsure = scrimjsonData[key]["Unsure"];
      if (Unsure[interaction.user.username] === interaction.user.id) {
        delete Unsure[interaction.user.username];
      }

      let Sub = scrimjsonData[key]["Sub"];
      if (Sub[interaction.user.username] === interaction.user.id) {
        delete Sub[interaction.user.username];
      }

      scrimjsonData[key]["Cant"][interaction.user.username] =
        interaction.user.id;

      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);

      const Can_data = scrimjsonData[key]["Can"];
      const Can_ids = Object.values(Can_data);
      const Cant_data = scrimjsonData[key]["Cant"];
      const Cant_ids = Object.values(Cant_data);
      const Unsure_data = scrimjsonData[key]["Unsure"];
      const Unsure_ids = Object.values(Unsure_data);
      const Sub_data = scrimjsonData[key]["Sub"];
      const Sub_ids = Object.values(Sub_data);

      let global_ids = get_ids();

      const channel = interaction.channel;
      const old_message = await channel.messages.fetch(global_ids[key]);

      // Get the existing embed
      const oldEmbed = old_message.embeds[0];
      let Can_Text = "";
      let Cant_Text = "";
      let Unsure_Text = "";
      let Sub_Text = "";

      if (Can_ids.length == 0) {
        Can_Text = "No signups yet";
      } else {
        for (const ids of Can_ids) {
          Can_Text = Can_Text + `<@${ids}>` + "\n";
        }
      }

      if (Cant_ids.length == 0) {
        Cant_Text = "No signups yet";
      } else {
        for (const ids of Cant_ids) {
          Cant_Text = Cant_Text + `<@${ids}>` + "\n";
        }
      }

      if (Unsure_ids.length == 0) {
        Unsure_Text = "No signups yet";
      } else {
        for (const ids of Unsure_ids) {
          Unsure_Text = Unsure_Text + `<@${ids}>` + "\n";
        }
      }

      if (Sub_ids.length == 0) {
        Sub_Text = "No signups yet";
      } else {
        for (const ids of Sub_ids) {
          Sub_Text = Sub_Text + `<@${ids}>` + "\n";
        }
      }

      const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          {
            name: `Can (${CanKeyCount}/5)`,
            value: Can_Text,
            inline: false,
          },
          { name: `Sub`, value: Sub_Text, inline: false },
          { name: `Cant`, value: Cant_Text, inline: false },
          { name: `Unsure`, value: Unsure_Text, inline: false }
        );
      await old_message.edit({ embeds: [newEmbed] });

      await interaction.reply({
        content: "You cant!",
        ephemeral: true,
      });
    }

    async function Unsure(key, scrimjsonData) {
      let Can = scrimjsonData[key]["Can"];

      if (Can[interaction.user.username] === interaction.user.id) {
        delete Can[interaction.user.username];
      }

      let Cant = scrimjsonData[key]["Cant"];
      if (Cant[interaction.user.username] === interaction.user.id) {
        delete Cant[interaction.user.username];
      }

      let Sub = scrimjsonData[key]["Sub"];
      if (Sub[interaction.user.username] === interaction.user.id) {
        delete Sub[interaction.user.username];
      }

      scrimjsonData[key]["Unsure"][interaction.user.username] =
        interaction.user.id;

      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);

      const Can_data = scrimjsonData[key]["Can"];
      const Can_ids = Object.values(Can_data);
      const Cant_data = scrimjsonData[key]["Cant"];
      const Cant_ids = Object.values(Cant_data);
      const Unsure_data = scrimjsonData[key]["Unsure"];
      const Unsure_ids = Object.values(Unsure_data);
      const Sub_data = scrimjsonData[key]["Sub"];
      const Sub_ids = Object.values(Sub_data);

      let global_ids = get_ids();

      const channel = interaction.channel;
      const old_message = await channel.messages.fetch(global_ids[key]);

      // Get the existing embed
      const oldEmbed = old_message.embeds[0];
      let Can_Text = "";
      let Cant_Text = "";
      let Unsure_Text = "";
      let Sub_Text = "";

      if (Can_ids.length == 0) {
        Can_Text = "No signups yet";
      } else {
        for (const ids of Can_ids) {
          Can_Text = Can_Text + `<@${ids}>` + "\n";
        }
      }

      if (Cant_ids.length == 0) {
        Cant_Text = "No signups yet";
      } else {
        for (const ids of Cant_ids) {
          Cant_Text = Cant_Text + `<@${ids}>` + "\n";
        }
      }

      if (Unsure_ids.length == 0) {
        Unsure_Text = "No signups yet";
      } else {
        for (const ids of Unsure_ids) {
          Unsure_Text = Unsure_Text + `<@${ids}>` + "\n";
        }
      }

      if (Sub_ids.length == 0) {
        Sub_Text = "No signups yet";
      } else {
        for (const ids of Sub_ids) {
          Sub_Text = Sub_Text + `<@${ids}>` + "\n";
        }
      }

      const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          {
            name: `Can (${CanKeyCount}/5)`,
            value: Can_Text,
            inline: false,
          },
          { name: `Sub`, value: Sub_Text, inline: false },
          { name: `Cant`, value: Cant_Text, inline: false },
          { name: `Unsure`, value: Unsure_Text, inline: false }
        );
      await old_message.edit({ embeds: [newEmbed] });

      await interaction.reply({
        content: "You are a unsure!",
        ephemeral: true,
      });
    }

    async function Leave(key, scrimjsonData) {
      let Can = scrimjsonData[key]["Can"];

      if (Can[interaction.user.username] === interaction.user.id) {
        delete Can[interaction.user.username];
      }

      let Sub = scrimjsonData[key]["Sub"];

      if (Sub[interaction.user.username] === interaction.user.id) {
        delete Sub[interaction.user.username];
      }

      let Cant = scrimjsonData[key]["Cant"];
      if (Cant[interaction.user.username] === interaction.user.id) {
        delete Cant[interaction.user.username];
      }

      let Unsure = scrimjsonData[key]["Unsure"];
      if (Unsure[interaction.user.username] === interaction.user.id) {
        delete Unsure[interaction.user.username];
      }

      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);

      const Can_data = scrimjsonData[key]["Can"];
      const Can_ids = Object.values(Can_data);
      const Cant_data = scrimjsonData[key]["Cant"];
      const Cant_ids = Object.values(Cant_data);
      const Unsure_data = scrimjsonData[key]["Unsure"];
      const Unsure_ids = Object.values(Unsure_data);
      const Sub_data = scrimjsonData[key]["Sub"];
      const Sub_ids = Object.values(Sub_data);

      let global_ids = get_ids();

      const channel = interaction.channel;
      const old_message = await channel.messages.fetch(global_ids[key]);

      // Get the existing embed
      const oldEmbed = old_message.embeds[0];
      let Can_Text = "";
      let Cant_Text = "";
      let Unsure_Text = "";
      let Sub_Text = "";

      if (Can_ids.length == 0) {
        Can_Text = "No signups yet";
      } else {
        for (const ids of Can_ids) {
          Can_Text = Can_Text + `<@${ids}>` + "\n";
        }
      }

      if (Cant_ids.length == 0) {
        Cant_Text = "No signups yet";
      } else {
        for (const ids of Cant_ids) {
          Cant_Text = Cant_Text + `<@${ids}>` + "\n";
        }
      }

      if (Unsure_ids.length == 0) {
        Unsure_Text = "No signups yet";
      } else {
        for (const ids of Unsure_ids) {
          Unsure_Text = Unsure_Text + `<@${ids}>` + "\n";
        }
      }

      if (Sub_ids.length == 0) {
        Sub_Text = "No signups yet";
      } else {
        for (const ids of Sub_ids) {
          Sub_Text = Sub_Text + `<@${ids}>` + "\n";
        }
      }

      const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title)
        .setDescription(oldEmbed.description)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          {
            name: `Can (${CanKeyCount}/5)`,
            value: Can_Text,
            inline: false,
          },
          { name: `Sub`, value: Sub_Text, inline: false },
          { name: `Cant`, value: Cant_Text, inline: false },
          { name: `Unsure`, value: Unsure_Text, inline: false }
        );
      await old_message.edit({ embeds: [newEmbed] });

      await interaction.reply({
        content: "You left!",
        ephemeral: true,
      });
    }

    let scrimjsonData = get_scrim();
    for (let key in scrimjsonData) {
      if (scrimjsonData.hasOwnProperty(key)) {
        if (interaction.customId === `${key}-Can`) {
          const CanKeyCount = Object.keys(scrimjsonData[key]["Can"]).length;
          if (CanKeyCount >= 5) {
            Sub(key, scrimjsonData);
            return;
          } else {
            Can(key, scrimjsonData);
            return;
          }
        }
      }

      if (interaction.customId === `${key}-Cant`) {
        Cant(key, scrimjsonData);
      }

      if (interaction.customId === `${key}-Unsure`) {
        Unsure(key, scrimjsonData);
      }

      if (interaction.customId === `${key}-Leave`) {
        Leave(key, scrimjsonData);
      }
    }
  }
});
// Login to Discord with your app's token
client.login(global_ids["token"]);
