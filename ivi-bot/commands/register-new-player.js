const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  RoleManager,
  Collection,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { title, disconnect } = require("process");
const path = require("path");
const { toUSVString } = require("util");
const { v4: uuidv4, stringify } = require("uuid");
const { get_ids, get_scrim, get_delete, get_kds } = require("../functions.js");
const { channel } = require("diagnostics_channel");

let uniqueIds = [];

module.exports = {
  data: {
    name: "add-player",
    description: "Add a player to the team",
    options: [
      {
        name: "name",
        type: 3,
        description: "The name of the team member",
        required: true,
      },
      {
        name: "discord",
        type: 6,
        description: "@ The person joining the team",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (
      interaction.user.id != "USER_ID" &&
      interaction.user.id != "USER_ID" &&
      interaction.user.id != "USER_ID"
    ) {
      return;
    }
    let global_ids = get_ids();
    const name = interaction.options.getString("name");
    const user = interaction.options.getUser("discord");

    const team = interaction.guild.roles.cache.get(global_ids["team_role_id"]);

    // Fetch the GuildMember object
    const guildMember = await interaction.guild.members.fetch(user.id);

    // Check bot's highest role
    const botHighestRole = interaction.guild.members.me.roles.highest;
    if (botHighestRole.position <= team.position) {
      return console.log(
        "Bot's highest role is not high enough to manage this role."
      );
    }

    // Add the role to the GuildMember
    await guildMember.roles.add(team);

    const announcements = await interaction.guild.channels.fetch(
      global_ids["team_announcements"]
    );

    let kds = get_kds();
    kds[name] = { Maps: 0, Kills: 0, Deaths: 0, Assists: 0 };
    let updatedData = JSON.stringify(kds, null, 2);
    fs.writeFileSync("player-stats.json", updatedData);

    await announcements.send(`${team} Welcome ${user} to the team!!`);
  },
};
