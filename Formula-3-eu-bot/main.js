const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  RoleManager,
  Collection,
  REST,
  Routes,
  Events,
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { title } = require("process");
const cron = require("node-cron");
const path = require("path");
const { channel } = require("diagnostics_channel");
const app = express();
const port = 3000;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function get_scrim() {
  let scrimrawData = fs.readFileSync("scrimdata.json");
  let scrimjsonData = JSON.parse(scrimrawData);
  return scrimjsonData;
}

function get_ids() {
  let global_ids_raw = fs.readFileSync("global_ids.json");
  let global_ids = JSON.parse(global_ids_raw);
  return global_ids;
}
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
client.once("ready", () => {
  console.log("Ready!");
});

// Schedule a task to run every Sunday at 12:24 PM
cron.schedule("0 8 * * 1", () => {
  async function sendChannel(client) {
    let global_ids = get_ids();
    const channel = await client.channels.fetch(global_ids["Scrim"]);
    const guild = await client.guilds.fetch(global_ids["guild_id"]);
    const role = await guild.roles.fetch(global_ids["team_role_id"]);
    await channel.send(`${role} Please vote for the week!`);
  }
  sendChannel(client);
});

// Schedule a task to run every Sunday at 12:24 PM
cron.schedule("23 19 * * 1", async () => {
  async function sendMessage() {
    const channel = await client.channels.fetch(
      global_ids["upcomming_matches"]
    );
    const guild = await client.guilds.fetch(global_ids["guild_id"]);
    const role = await guild.roles.fetch(global_ids["team_role_id"]);
    const message = channel.send({ embeds: [embed] });
    message.reply(role);
  }
  // Fetch API example to make a GET request
  let global_ids = get_ids();

  try {
    // Fetch data from the API
    const response = await fetch(
      "https://api.vrmasterleague.com/Teams/4-rFNrc8g2Qx_1XMHl_nUQ2/Matches/Upcoming"
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
      .setThumbnail("https://vrmasterleague.com" + awayTeamLogo) // URL to the thumbnail image
      .setFooter({
        text: `${homeTeamName}`,
        iconURL: "https://vrmasterleague.com" + homeTeamLogo,
      });
    embed.addFields(
      {name: "Home", value: homeTeamName, inline: false},
      {name: "Away", value: awayTeamName, inline: false},
    )


    const channel = await client.channels.fetch(global_ids["upcomming_matches"]);

    await channel.send({ embeds: [embed] });
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
        await interaction.deferReply();
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
    let array = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    for (const day of array) {
      // Read the JSON file

      if (interaction.customId === day + "-Can") {
        await interaction.reply({
          content: "You have selected Can play!",
          ephemeral: true,
        });
        let scrimjsonDataa = get_scrim();
        let cantPlay = scrimjsonDataa[day]["Cant Play"];
        let unsure = scrimjsonDataa[day]["Unsure"];
        if (cantPlay[interaction.user.username] === interaction.user.id) {
          delete cantPlay[interaction.user.username];
        } else if (unsure[interaction.user.username] === interaction.user.id) {
          delete unsure[interaction.user.username];
        }
        scrimjsonDataa[day]["Can Play"][interaction.user.username] =
          interaction.user.id;

        let updatedData = JSON.stringify(scrimjsonDataa, null, 2);
        fs.writeFileSync("scrimdata.json", updatedData);

        let scrimjsonData = get_scrim();

        const can = scrimjsonData[day]["Can Play"];
        const can_ids = Object.values(can);
        const cant = scrimjsonData[day]["Cant Play"];
        const cant_ids = Object.values(cant);
        const idk = scrimjsonData[day]["Unsure"];
        const idk_ids = Object.values(idk);

        newjsonData = get_ids();

        const channel = await client.channels.fetch(newjsonData["Scrim"]);
        const old_message = await channel.messages.fetch(newjsonData[day]);

        // Get the existing embed
        const oldEmbed = old_message.embeds[0];
        let canText = "";
        let cantText = "";
        let idkText = "";

        if (can_ids.length == 0) {
          canText = "No signups yet";
        } else {
          for (const ids of can_ids) {
            canText = canText + `<@${ids}>` + "\n";
          }
        }

        if (cant_ids.length == 0) {
          cantText = "No signups yet";
        } else {
          for (const ids of cant_ids) {
            cantText = cantText + `<@${ids}>` + "\n";
          }
        }

        if (idk_ids.length == 0) {
          idkText = "No signups yet";
        } else {
          for (const ids of idk_ids) {
            idkText = idkText + `<@${ids}>` + "\n";
          }
        }

        const newEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title)
          .setDescription(oldEmbed.description)
          .setColor("#00FF00") // Optional: set the embed color
          .addFields(
            // Add your new fields here
            { name: "Can Go", value: canText, inline: false },
            { name: "Cant Go", value: cantText, inline: false },
            { name: "Unsure", value: idkText, inline: false }
          );
        await old_message.edit({ embeds: [newEmbed] });
      }

      if (interaction.customId === day + "-Cant") {
        await interaction.reply({
          content: "You have selected Cant play!",
          ephemeral: true,
        });
        let scrimjsonDataa = get_scrim();
        let canPlay = scrimjsonDataa[day]["Can Play"];
        let unsure = scrimjsonDataa[day]["Unsure"];
        if (canPlay[interaction.user.username] === interaction.user.id) {
          delete canPlay[interaction.user.username];
        } else if (unsure[interaction.user.username] === interaction.user.id) {
          delete unsure[interaction.user.username];
        }
        scrimjsonDataa[day]["Cant Play"][interaction.user.username] =
          interaction.user.id;

        let updatedData = JSON.stringify(scrimjsonDataa, null, 2);
        fs.writeFileSync("scrimdata.json", updatedData);

        let scrimjsonData = get_scrim();

        const can = scrimjsonData[day]["Can Play"];
        const can_ids = Object.values(can);
        const cant = scrimjsonData[day]["Cant Play"];
        const cant_ids = Object.values(cant);
        const idk = scrimjsonData[day]["Unsure"];
        const idk_ids = Object.values(idk);

        let global_ids = get_ids();

        const channel = await client.channels.fetch(global_ids["Scrim"]);
        const old_message = await channel.messages.fetch(global_ids[day]);

        // Get the existing embed
        const oldEmbed = old_message.embeds[0];
        let canText = "";
        let cantText = "";
        let idkText = "";

        if (can_ids.length == 0) {
          canText = "No signups yet";
        } else {
          for (const ids of can_ids) {
            canText = canText + `<@${ids}>` + "\n";
          }
        }

        if (cant_ids.length == 0) {
          cantText = "No signups yet";
        } else {
          for (const ids of cant_ids) {
            cantText = cantText + `<@${ids}>` + "\n";
          }
        }

        if (idk_ids.length == 0) {
          idkText = "No signups yet";
        } else {
          for (const ids of idk_ids) {
            idkText = idkText + `<@${ids}>` + "\n";
          }
        }

        const newEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title)
          .setDescription(oldEmbed.description)
          .setColor("#00FF00") // Optional: set the embed color
          .addFields(
            // Add your new fields here
            { name: "Can Go", value: canText, inline: false },
            { name: "Cant Go", value: cantText, inline: false },
            { name: "Unsure", value: idkText, inline: false }
          );
        await old_message.edit({ embeds: [newEmbed] });
      }
      if (interaction.customId === day + "-Unsure") {
        await interaction.reply({
          content: "You have selected Unsure!",
          ephemeral: true,
        });
        let scrimjsonDataa = get_scrim();
        let canPlay = scrimjsonDataa[day]["Can Play"];
        let cantPlay = scrimjsonDataa[day]["Cant Play"];
        if (canPlay[interaction.user.username] === interaction.user.id) {
          delete canPlay[interaction.user.username];
        } else if (
          cantPlay[interaction.user.username] === interaction.user.id
        ) {
          delete cantPlay[interaction.user.username];
        }
        scrimjsonDataa[day]["Unsure"][interaction.user.username] =
          interaction.user.id;

        let updatedData = JSON.stringify(scrimjsonDataa, null, 2);
        fs.writeFileSync("scrimdata.json", updatedData);

        let scrimjsonData = get_scrim();

        const can = scrimjsonData[day]["Can Play"];
        const can_ids = Object.values(can);
        const cant = scrimjsonData[day]["Cant Play"];
        const cant_ids = Object.values(cant);
        const idk = scrimjsonData[day]["Unsure"];
        const idk_ids = Object.values(idk);

        let global_ids = get_ids();

        const channel = await client.channels.fetch(global_ids["Scrim"]);
        const old_message = await channel.messages.fetch(global_ids[day]);

        // Get the existing embed
        const oldEmbed = old_message.embeds[0];
        let canText = "";
        let cantText = "";
        let idkText = "";

        if (can_ids.length == 0) {
          canText = "No signups yet";
        } else {
          for (const ids of can_ids) {
            canText = canText + `<@${ids}>` + "\n";
          }
        }

        if (cant_ids.length == 0) {
          cantText = "No signups yet";
        } else {
          for (const ids of cant_ids) {
            cantText = cantText + `<@${ids}>` + "\n";
          }
        }

        if (idk_ids.length == 0) {
          idkText = "No signups yet";
        } else {
          for (const ids of idk_ids) {
            idkText = idkText + `<@${ids}>` + "\n";
          }
        }

        const newEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title)
          .setDescription(oldEmbed.description)
          .setColor("#00FF00") // Optional: set the embed color
          .addFields(
            // Add your new fields here
            { name: "Can Go", value: canText, inline: false },
            { name: "Cant Go", value: cantText, inline: false },
            { name: "Unsure", value: idkText, inline: false }
          );
        await old_message.edit({ embeds: [newEmbed] });
      }
      if (interaction.customId === day + "-Leave") {
        await interaction.reply({ content: "Leaving...", ephemeral: true });
        let scrimjsonDataa = get_scrim();
        if (
          scrimjsonDataa[day]["Can Play"][interaction.user.username] ===
          interaction.user.id
        ) {
          delete scrimjsonDataa[day]["Can Play"][interaction.user.username];
        }
        if (
          scrimjsonDataa[day]["Cant Play"][interaction.user.username] ===
          interaction.user.id
        ) {
          delete scrimjsonDataa[day]["Cant Play"][interaction.user.username];
        }
        if (
          scrimjsonDataa[day]["Unsure"][interaction.user.username] ===
          interaction.user.id
        ) {
          delete scrimjsonDataa[day]["Unsure"][interaction.user.username];
        }

        let updatedData = JSON.stringify(scrimjsonDataa, null, 2);
        fs.writeFileSync("scrimdata.json", updatedData);

        let scrimjsonData = get_scrim();

        const can = scrimjsonData[day]["Can Play"];
        const can_ids = Object.values(can);
        const cant = scrimjsonData[day]["Cant Play"];
        const cant_ids = Object.values(cant);
        const idk = scrimjsonData[day]["Unsure"];
        const idk_ids = Object.values(idk);

        let global_ids = get_ids();

        const channel = await client.channels.fetch(global_ids["Scrim"]);
        const old_message = await channel.messages.fetch(global_ids[day]);

        // Get the existing embed
        const oldEmbed = old_message.embeds[0];
        let canText = "";
        let cantText = "";
        let idkText = "";

        if (can_ids.length == 0) {
          canText = "No signups yet";
        } else {
          for (const ids of can_ids) {
            canText = canText + `<@${ids}>` + "\n";
          }
        }

        if (cant_ids.length == 0) {
          cantText = "No signups yet";
        } else {
          for (const ids of cant_ids) {
            cantText = cantText + `<@${ids}>` + "\n";
          }
        }

        if (idk_ids.length == 0) {
          idkText = "No signups yet";
        } else {
          for (const ids of idk_ids) {
            idkText = idkText + `<@${ids}>` + "\n";
          }
        }

        const newEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title)
          .setDescription(oldEmbed.description)
          .setColor("#00FF00") // Optional: set the embed color
          .addFields(
            // Add your new fields here
            { name: "Can Go", value: canText, inline: false },
            { name: "Cant Go", value: cantText, inline: false },
            { name: "Unsure", value: idkText, inline: false }
          );
        await old_message.edit({ embeds: [newEmbed] });
      }

      async function asyncForEach(array, callback) {
        for (const item of array) {
          await callback(item);
        }
      }

      let wordToRemove = day;
      let newArray = array.filter((word) => word !== wordToRemove);
      array = newArray;
    }
  }
});

// Login to Discord with your app's token
client.login(global_ids["token"]);

// Define the sendMessage function
async function sendMessages(channelId, messages) {
  async function get_message(jsonData, client) {
    async function updateEmbed(jsonData, updatedEmbed, day, scrimjsonData) {
      const channel = await client.channels.fetch(jsonData["Scrim"]);
      const old_message = await channel.messages.fetch(jsonData[day]);
      await old_message.edit({ embeds: [updatedEmbed] });
      scrimjsonData[day]["Can Play"] = {};
      scrimjsonData[day]["Cant Play"] = {};
      scrimjsonData[day]["Unsure"] = {};
      let updatedData = JSON.stringify(scrimjsonData, null, 2);
      fs.writeFileSync("scrimdata.json", updatedData);
    }
    if (messages.field1 == "Clear") {
      let scrimjsonData = get_scrim();
      let global_ids = get_ids();
      const updatedEmbed = new EmbedBuilder();
      updatedEmbed.setTitle(`Scrim for ${messages.field4} 7/8`);
      updatedEmbed.setFields(
        { name: "Can Go", value: "No signups yet", inline: false },
        { name: "Cant Go", value: "No signups yet", inline: false },
        { name: "Unsure", value: "No signups yet" }
      );
      updateEmbed(global_ids, updatedEmbed, messages.field4, scrimjsonData);
      return;
    }

    const [day, month, year] = messages.field2.split("/").map(Number);
    const hour = Math.floor(Number(messages.field3) / 100);
    const minute = Number(messages.field3) % 100;
    const date = new Date(year, month - 1, day, hour, minute);
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    const channel = await client.channels.fetch(jsonData["Scrim"]);
    const old_message = await channel.messages.fetch(jsonData[messages.field4]);
    const message = `Scrim for ${messages.field4} ${messages.field2} at ${messages.field3}`;

    let scrimjsonData = get_scrim();

    const can = scrimjsonData[messages.field4]["Can Play"];
    const can_ids = Object.values(can);
    const cant = scrimjsonData[messages.field4]["Cant Play"];
    const cant_ids = Object.values(cant);
    const idk = scrimjsonData[messages.field4]["Unsure"];
    const idk_ids = Object.values(idk);

    // Get the existing embed
    const oldEmbed = old_message.embeds[0];
    let canText = "";
    let cantText = "";
    let idkText = "";

    if (can_ids.length == 0) {
      canText = "No signups yet";
    } else {
      for (const ids of can_ids) {
        canText = canText + `<@${ids}>` + "\n";
      }
    }

    if (cant_ids.length == 0) {
      cantText = "No signups yet";
    } else {
      for (const ids of cant_ids) {
        cantText = cantText + `<@${ids}>` + "\n";
      }
    }

    if (idk_ids.length == 0) {
      idkText = "No signups yet";
    } else {
      for (const ids of idk_ids) {
        idkText = idkText + `<@${ids}>` + "\n";
      }
    }

    if (messages.field1 == "Pokerstars") {
      const newEmbed = new EmbedBuilder()
        .setTitle(message)
        .setDescription(`Scrim starts in <t:${unixTimestamp}:R>`)
        .setColor("#00FF00") // Optional: set the embed color
        .addFields(
          // Add your new fields here
          { name: "Can Go", value: canText, inline: false },
          { name: "Cant Go", value: cantText, inline: false },
          { name: "Unsure", value: idkText, inline: false }
        );
      const sentMessage = await old_message.edit({ embeds: [newEmbed] });
      const guild = await client.guilds.fetch(jsonData["guild_id"]);
      const role = await guild.roles.fetch(jsonData["team_role_id"]);
      sentMessage.reply(`${role} POKERNIGHT!!!!`);
      return;
    }

    const newEmbed = new EmbedBuilder()
      .setTitle(message)
      .setDescription(`Scrim starts in <t:${unixTimestamp}:R>`)
      .setColor("#00FF00") // Optional: set the embed color
      .addFields(
        // Add your new fields here
        { name: "Can Go", value: canText, inline: false },
        { name: "Cant Go", value: cantText, inline: false },
        { name: "Unsure", value: idkText, inline: false }
      );
    const sentMessage = await old_message.edit({ embeds: [newEmbed] });

    const guild = await client.guilds.fetch(jsonData["guild_id"]);
    const role = await guild.roles.fetch(jsonData["team_role_id"]);
    sentMessage.reply(`${role}This is a scrim against ${messages.field1}`);
  }

  let global_ids = get_ids();

  const channel = client.channels.cache.get(global_ids["Scrim"]);
  if (channel) {
    // Send each message separately
    if (messages.field1) {
      if (messages.field2) {
        if (messages.field3) {
          const [day, month, year] = messages.field2.split("/").map(Number);
          const hour = Math.floor(Number(messages.field3) / 100);
          const minute = Number(messages.field3) % 100;
          const date = new Date(year, month - 1, day, hour, minute);
          const unixTimestamp = Math.floor(date.getTime() / 1000);
          // Convert the Unix timestamp to milliseconds
          const targetTimeInMilliseconds = unixTimestamp * 1000;

          // Calculate the remaining time in milliseconds
          const currentTimeInMilliseconds = Date.now();
          const remainingTime =
            targetTimeInMilliseconds - currentTimeInMilliseconds;

          let global_ids = get_ids();

          get_message(global_ids, client);

          async function updateEmbed(
            jsonData,
            updatedEmbed,
            day,
            scrimjsonData
          ) {
            const channel = await client.channels.fetch(jsonData["Scrim"]);
            const old_message = await channel.messages.fetch(jsonData[day]);
            await old_message.edit({ embeds: [updatedEmbed] });
            scrimjsonData[day]["Can Play"] = {};
            scrimjsonData[day]["Cant Play"] = {};
            scrimjsonData[day]["Unsure"] = {};
            let updatedData = JSON.stringify(scrimjsonData, null, 2);
            fs.writeFileSync("scrimdata.json", updatedData);
          }

          if (remainingTime > 0) {
            setTimeout(() => {
              const updatedEmbed = new EmbedBuilder();
              updatedEmbed.setTitle("Scrim for " + messages.field4 + " 7/8");
              updatedEmbed.setFields(
                { name: "Can Go", value: "No signups yet", inline: false },
                { name: "Cant Go", value: "No signups yet", inline: false },
                { name: "Unsure", value: "No signups yet" }
              );
              let scrimjsonData = get_scrim();
              updateEmbed(
                global_ids,
                updatedEmbed,
                messages.field4,
                scrimjsonData
              );
            }, remainingTime);
          } else {
            console.log("The target Unix time has already passed.");
          }
        }
      }
    }
  } else {
    console.log("Channel not found!");
  }
}

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static("public"));

// Handle POST requests to /send-message
app.post("/send-message", (req, res) => {
  const { channelId, messages } = req.body;
  sendMessages(channelId, messages);
  res.sendStatus(200);
});

async function send_kd(map_data) {
  for (const map of map_data) {
    const channel = await client.channels.fetch(global_ids["scrim_kds"]);
    const team = map["Team"];
    const scores = map["Scores"];
    const mapName = map["Name"];
    const embed = new EmbedBuilder();

    embed.setTitle(
      `Scrim against ${team}: ${mapName} REKT EU ${scores} ${team}`
    );
    for (const kd of map["KDS"]) {
      const parts = kd.split("/");
      const name = parts[0];
      const number1 = parseInt(parts[1], 10);
      const number2 = parseInt(parts[2], 10);
      const number3 = parseInt(parts[3], 10);
      embed.addFields({
        name: `${name}`,
        value: `${number1}/${number2}/${number3}`,
        inline: false,
      });
    }
    channel.send({ embeds: [embed] });
  }
}

// Handle POST requests to /send-message
app.post("/upload-kd", (req, res) => {
  send_kd(req.body);
  res.sendStatus(200);
});

// Serve index.html at the root route
app.get("/scrims", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "scrims.html"));
});

// Serve scrims.html at the /scrims route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "embed.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
