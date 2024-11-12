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
const { get_ids, get_scrim, get_delete } = require("../functions.js");
const { channel } = require("diagnostics_channel");

let uniqueIds = [];

module.exports = {
  data: {
    name: "scrim",
    description: "Check team availability for a scrim",
    options: [
      {
        name: "team",
        type: 3,
        description: "The team you want to scrim",
        required: true,
      },
      {
        name: "date",
        type: 3,
        description: "The date of the scrim e.g. 02/09/2024",
        required: true,
      },
      {
        name: "time",
        type: 3,
        description: "The time of the scrim (BST) e.g. 1900",
        required: true,
      },
    ],
  },
  async execute(interaction) {
    while (true) {
      const uniqueId = uuidv4();
      if (uniqueId in uniqueIds) {
        console.log("ID already exists");
      } else {
        if (
          interaction.user.id != "548485928008810533" &&
          interaction.user.id != "818147738133987369" &&
          interaction.user.id != "1147174984838566000"
        ) {
          await interaction.editReply({
            content: "You cant use this",
            ephemeral: true,
          });
          return;
        } else {
          let global_ids = get_ids();
          if (interaction.channel.id != global_ids["Scrim"]) {
            await interaction.editReply({
              content: "You cant use this here",
              ephemeral: true,
            });
            return;
          }
          const team = interaction.options.getString("team");
          const _date = interaction.options.getString("date");
          const time = interaction.options.getString("time") || "Not specified";

          const [day, month, year] = _date.split("/").map(Number);
          const hour = Math.floor(Number(time) / 100);
          const minute = Number(time) % 100;
          const date = new Date(year, month - 1, day, hour, minute);
          const unixTimestamp = Math.floor(date.getTime() / 1000);

          const message = `Scrim for ${day}/${month}/${year} at <t:${unixTimestamp}:F>`;
          const embed = new EmbedBuilder().setTitle(message);
          embed.addFields(
            { name: "Can Go", value: "No signups yet", inline: false },
            { name: "Cant Go", value: "No signups yet", inline: false },
            { name: "Unsure", value: "No signups yet" }
          );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(uniqueId + "-Can")
              .setLabel("Can Play")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(uniqueId + "-Cant")
              .setLabel("Cant Play")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(uniqueId + "-Unsure")
              .setLabel("Unsure")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(uniqueId + "-Leave")
              .setLabel("Leave")
              .setStyle(ButtonStyle.Danger)
          );

          const Embedmessage = await interaction.channel.send({
            embeds: [embed],
            components: [row],
          });

          const guild = interaction.guild;
          const role = await guild.roles.fetch(global_ids["team_role_id"]);
          let to_delete = get_delete();
          let ping = await Embedmessage.reply(
            `${role}This is a scrim against ${team}`
          );
          to_delete[`${uniqueId}-ping`] = ping.id;
          let to_delete_updated = JSON.stringify(to_delete, null, 2);
          fs.writeFileSync("to-delete.json", to_delete_updated);

          global_ids[uniqueId] = Embedmessage.id;

          let global_ids_updated = JSON.stringify(global_ids, null, 2);
          fs.writeFileSync("global_ids.json", global_ids_updated);

          let scrimjsonData = get_scrim();

          scrimjsonData[uniqueId] = {
            Can: {},
            Sub: {},
            Cant: {},
            Unsure: {},
          };

          let scrimjsonData_updated = JSON.stringify(scrimjsonData, null, 2);
          fs.writeFileSync("scrimdata.json", scrimjsonData_updated);

          // Step 2: Get the current Unix time (in seconds)
          let currentUnixTime = Math.floor(Date.now() / 1000);

          // Subtract 15 minutes (900 seconds) from the original unixTimestamp
          let adjustedUnixTime_15 = unixTimestamp - 900;

          // Calculate the Reserve_Time
          let Before = (adjustedUnixTime_15 - currentUnixTime) * 1000;

          let adjustedUnixTime = unixTimestamp + 300;

          // Step 3: Calculate the time difference (in milliseconds)
          let Main_time = (unixTimestamp - currentUnixTime) * 1000;

          let Reserve_Time = (adjustedUnixTime - currentUnixTime) * 1000;

          // Step 4: Wait until the designated time
          if (Before > 0) {
            setTimeout(async () => {
              let scrimjsonData = get_scrim();

              // Send a DM to the user who triggered the command
              const user = interaction.user;
              const dmChannel = await user.createDM();
              await dmChannel.send(
                "What are the lobby details? in the format:\\Player_Name: Code"
              );

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
              userResponse = userResponse.replace(" ", "");
              userResponse = userResponse.split(":");
              let lobby = userResponse[0];
              let pass = userResponse[1];
              let text = "";
              for (let user_name in scrimjsonData[uniqueId]["Can"]) {
                let user = scrimjsonData[uniqueId]["Can"][user_name];
                text = text + `<@${user}>`;
              }

              const start_message = await interaction.channel.send(
                `Scrim starting soon! make sure to warm up!!\n${text}\nLobby on: ${lobby}\nPass: ${pass}`
              );

              let to_delete = get_delete();
              to_delete[`${uniqueId}-warmup`] = start_message.id;

              let updatedData = JSON.stringify(to_delete, null, 2);
              fs.writeFileSync("to-delete.json", updatedData);

              //scrimjsonData["Details"]["lobby"] =
            }, Before);
          } else {
            console.log("The designated time has already passed.");
          }

          // Step 4: Wait until the designated time
          if (Main_time > 0) {
            setTimeout(async () => {
              async function send_msg() {
                let scrimjsonData = get_scrim();
                let text = "";
                for (let user_name in scrimjsonData[uniqueId]["Can"]) {
                  let user = scrimjsonData[uniqueId]["Can"][user_name];
                  text = text + `<@${user}>`;
                }

                const start_message = await interaction.channel.send(
                  `Scrim starting now!\n${text}`
                );

                let to_delete = get_delete();
                to_delete[`${uniqueId}-start`] = start_message.id;

                let updatedData = JSON.stringify(to_delete, null, 2);
                fs.writeFileSync("to-delete.json", updatedData);
              }

              await send_msg();
            }, Main_time);
          } else {
            console.log("The designated time has already passed.");
          }

          if (Reserve_Time > 0) {
            setTimeout(async () => {
              let global_ids = get_ids();
              let scrimjsonData = get_scrim();

              for (let user_name in scrimjsonData[uniqueId]["Sub"]) {
                let text = "";
                let user = scrimjsonData[uniqueId]["Sub"][user_name];
                text = text + `<@${user}>`;

                const sub_message = await interaction.channel.send(
                  `Scrim starting now!\n${text}`
                );

                let to_delete = get_delete();
                to_delete[`${uniqueId}-sub`] = sub_message.id;

                let updatedData = JSON.stringify(to_delete, null, 2);
                fs.writeFileSync("to-delete.json", updatedData);
              }
            }, Reserve_Time);
          }

          // Step 2: Get the current Unix time (in seconds)
          let currentUnixTimee = Math.floor(Date.now() / 1000);

          let adjustedUnixTimee = unixTimestamp + 600;

          // Step 3: Calculate the time difference (in milliseconds)
          let Main_timee = (adjustedUnixTimee - currentUnixTimee) * 1000;

          if (Main_timee > 0) {
            setTimeout(async () => {
              async function get_key(global_ids) {
                for (let key in global_ids) {
                  if (global_ids.hasOwnProperty(key)) {
                    //console.log(`Key: ${key}`);
                    //console.log(`Value:`, global_ids[key]);
                    try {
                      let fetchedMessage =
                        await interaction.channel.messages.cache.get(
                          global_ids[key]
                        );
                      if (fetchedMessage.author) {
                        return key;
                      }
                    } catch (error) {}
                  }
                }
              }
              let key = await get_key(global_ids);
              delete scrimjsonData[key];
              delete global_ids[key];
              if (Embedmessage) await Embedmessage.delete();

              // Delete messages if they exist
              let to_delete = get_delete();
              let start_message = await interaction.channel.messages.cache.get(
                to_delete[`${uniqueId}-start`]
              );
              let warmup_message = await interaction.channel.messages.cache.get(
                to_delete[`${uniqueId}-warmup`]
              );
              
              let sub_message = await interaction.channel.messages.cache.get(
                to_delete[`${uniqueId}-sub`]
              );
              let ping_message = await interaction.channel.messages.cache.get(
                to_delete[`${uniqueId}-ping`]
              );
              if (start_message) await start_message.delete();
              if (sub_message) await sub_message.delete();
              if (ping_message) await ping_message.delete();
              if (warmup_message) await warmup_message.delete();
              delete to_delete[`${uniqueId}-ping`];
              delete to_delete[`${uniqueId}-start`];
              delete to_delete[`${uniqueId}-sub`];
              delete to_delete[`${uniqueId}-warmup`];

              let to_delete_a = JSON.stringify(to_delete, null, 2);
              fs.writeFileSync("to-delete.json", to_delete_a);

              let updatedData_global_ids = JSON.stringify(global_ids, null, 2);
              let updatedData = JSON.stringify(scrimjsonData, null, 2);
              fs.writeFileSync("scrimdata.json", updatedData);
              fs.writeFileSync("global_ids.json", updatedData_global_ids);
            }, Main_timee);
          }

          break;
        }
      }
    }
  },
};
