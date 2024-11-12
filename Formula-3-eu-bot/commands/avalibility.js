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
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { title } = require("process");
const path = require("path");

module.exports = {
  data: {
    name: "rah",
    description: "Scrim stuff",
  },
  async execute(interaction) {
    if (interaction.user.id != "548485928008810533") {
      await interaction.editReply({
        content: "You cant use this",
        ephemeral: true,
      });
      return;
    }

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
      const message = `Scrim for ${day} date at time`;
      const embed = new EmbedBuilder().setTitle(message);
      embed.addFields(
        { name: "Can Go", value: "No signups yet", inline: false },
        { name: "Cant Go", value: "No signups yet", inline: false },
        { name: "Unsure", value: "No signups yet" }
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(day + "-Can")
          .setLabel("Can Play")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(day + "-Cant")
          .setLabel("Cant Play")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(day + "-Unsure")
          .setLabel("Unsure")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(day + "-Leave")
          .setLabel("Leave")
          .setStyle(ButtonStyle.Danger)
      );

      let wordToRemove = day;
      let newArray = array.filter((word) => word !== wordToRemove);
      array = newArray;

      const Embedmessage = await interaction.channel.send({
        embeds: [embed],
        components: [row],
      });

      let rawData = fs.readFileSync("global_ids.json");
      let jsonData = JSON.parse(rawData);

      jsonData[day] = Embedmessage.id;

      let updatedData = JSON.stringify(jsonData, null, 2);
      fs.writeFileSync("global_ids.json", updatedData);
    }
  },
};
