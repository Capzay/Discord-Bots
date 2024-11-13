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
const { title } = require("process");
const path = require("path");
const { toUSVString } = require("util");
const { v4: uuidv4, stringify } = require("uuid");
const { get_ids, get_scrim, get_delete, get_kds } = require("../functions.js");
const { channel } = require("diagnostics_channel");

let uniqueIds = [];

module.exports = {
  data: {
    name: "upload-kds",
    description: "Upload Kds",
  },
  async execute(interaction) {
    if (
      interaction.user.id != "USER_ID" &&
      interaction.user.id != "USER_ID" &&
      interaction.user.id != "USER_ID"
    ) {
      return;
    }
    function log_KDS(player_Now) {
      kds = get_kds();
      console.log(kds);
      console.log(player_Now);

      let player = player_Now[0];
      console.log(player);

      let Maps = kds[player]["Maps"];
      kds[player]["Maps"] = Maps + 1;

      let Kills = kds[player]["Kills"];
      kds[player]["Kills"] = Kills + Number(player_Now[1]);

      let Deaths = kds[player]["Deaths"];
      kds[player]["Deaths"] = Deaths + Number(player_Now[2]);

      let Assists = kds[player]["Assists"];
      kds[player]["Assists"] = Assists + Number(player_Now[3]);

      let updatedData = JSON.stringify(kds, null, 2);
      fs.writeFileSync("player-stats.json", updatedData);
    }

    async function sendMsg(newEmbed) {
      let global_ids = get_ids();
      const channel = await interaction.guild.channels.fetch(
        global_ids["scrim_kds"]
      );
      await channel.send({ embeds: [newEmbed] });
    }

    async function SendDM(Question) {
      // Send a DM to the user who triggered the command
      const user = interaction.user;
      const dmChannel = await user.createDM();
      await dmChannel.send(Question);

      // Listen for the user's response in their DMs
      const filter = (response) => {
        return response.author.id === user.id;
      };

      const collected = await dmChannel.awaitMessages({
        filter,
        max: 1, // Only collect one message
        time: 60000, // 1 minute to reply
        errors: ["time"],
      });

      // Log the user's response
      let userResponse = collected.first();
      userResponse = userResponse.content;
      return userResponse;
    }

    let Team = await SendDM("Who was the team agaisnt?");

    let Maps = await SendDM("What were the maps? e.g: Hideout,Factory,Ship");
    Maps = Maps.split(",");

    for (let map in Maps) {
      let Score = await SendDM(
        `What were the scores for ${Maps[map]} (ivi-oppoent) e.g. 7-4`
      );

      let Player1 = await SendDM(
        `What was the KD of player1 for ${Maps[map]}? e.g: Player/11/2/3\n(If you are a player short/Had a sub please use the format: Na/0/0/0)`
      );
      Player1 = Player1.split("/");

      let Player2 = await SendDM(
        `What was the KD of player2 for ${Maps[map]}? e.g: Player/11/2/3\n(If you are a player short/Had a sub please use the format: Na/0/0/0)`
      );
      Player2 = Player2.split("/");

      let Player3 = await SendDM(
        `What was the KD of player3 for ${Maps[map]}? e.g: Player/11/2/3\n(If you are a player short/Had a sub please use the format: Na/0/0/0)`
      );
      Player3 = Player3.split("/");

      let Player4 = await SendDM(
        `What was the KD of player4 for ${Maps[map]}? e.g: Player/11/2/3\n(If you are a player short/Had a sub please use the format: Na/0/0/0)`
      );
      Player4 = Player4.split("/");

      let Player5 = await SendDM(
        `What was the KD of player5 for ${Maps[map]}? e.g: Player/11/2/3\n(If you are a player short/Had a sub please use the format: Na/0/0/0)`
      );
      Player5 = Player5.split("/");

      const newEmbed = new EmbedBuilder()
        .setTitle(`Scrim KDS against ${Team} ${Maps[map]}: ${Score}`)
        .setColor("#00FF00"); // Optional: set the embed color
      newEmbed.addFields({
        name: `${Player1[0]}`,
        value: `${Player1[1]}/${Player1[2]}/${Player1[3]}`,
        inline: false,
      });
      newEmbed.addFields({
        name: `${Player2[0]}`,
        value: `${Player2[1]}/${Player2[2]}/${Player2[3]}`,
        inline: false,
      });
      newEmbed.addFields({
        name: `${Player3[0]}`,
        value: `${Player3[1]}/${Player3[2]}/${Player3[3]}`,
        inline: false,
      });
      newEmbed.addFields({
        name: `${Player4[0]}`,
        value: `${Player4[1]}/${Player4[2]}/${Player4[3]}`,
        inline: false,
      });
      newEmbed.addFields({
        name: `${Player5[0]}`,
        value: `${Player5[1]}/${Player5[2]}/${Player5[3]}`,
        inline: false,
      });
      sendMsg(newEmbed);

      log_KDS(Player1);
      log_KDS(Player2);
      log_KDS(Player3);
      log_KDS(Player4);
      log_KDS(Player5);
    }
  },
};
