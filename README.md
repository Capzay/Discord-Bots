# VRML Team Discord Bots for Breachers VR

A collection of Discord bots I developed to organize and coordinate my team for the VRML (Virtual Reality Master League) game **Breachers VR**. These bots were created as side projects in my spare time, with each iteration exploring a different programming language and adding unique features. 

---

## 🚀 Project Overview

1. **F3 Bot**
    - Built with: **Javascript** (previously in Python)
    - Purpose: Organize team availability for VRML matches.
    - Features:
      - **REST API**: Enables external commands to interact with Discord.
      - **Availability Voting**: Uses old embeds (one for each day of the week) in a specified channel that allows team members to vote on their availability.
      - + More
    - Status: Archived, no further updates planned.

2. **IVI Bot**
    - Built with: **Javascript** (previously F3 Bot)
    - Purpose: Current bot in active use with new functionalities added over each version.
    - Evolution: 
      - F3 Bot → IVI Bot
      - Implemented unique features and improvements in each version for better performance and functionality.
      - Added the same avalibility feature, without there needing to be one for each day of the week constantly (create one on / command, with an auto generated custom id) which automatically deletes itself after scheduled time has passed
      - 
    - Status: Archived, no further updates planned.

## 💻 Languages Explored
These bots were developed multiple times across different programming languages, adding new layers of functionality and performance improvements in each iteration:
- **Python**
- **JavaScript**
- **TypeScript**

## ❗ Note
This repository currently holds only the earlier versions of the bot (Javascript, not python because i lost it). The latest version of IVI Bot in TypeScript is not included in this repository.

## 📜 About
These bots were a product of my free time and curiosity about bot development. They also served as a playground to learn and experiment with **REST APIs**, **Discord Embeds**, and multi-language bot development. 

> **Why so many versions?**  
> I enjoy experimenting with different programming languages and learning new techniques. Each iteration was built to test new ideas and features, so even though I only needed one bot, it’s been fun to build, improve, and re-build them.

---

## 📄 License

This project is licensed under the MIT License. See the License file for details.

## 🤖 Getting Started

General Setup for the bots:
1. Clone this repository.
2. Follow the setup instructions in the respective bot directories (`F3-Bot` for the Old version, `IVI-Bot` for JavaScript better, new version).
3. Configure the bot token and create a file for the necessary settings named: `global_ids.json`:
4. Using the IDE of your choide, search for "USER_ID" and replace it with your discord id, this prevents people using the commands other than you.
   
# F3 BOT SETUP + GLOBAL_IDS.JSON FILE + COMMANDS EXPLAINED:
```
{
  "Scrim": "A_Channel_ID",
  "team_role_id": "A_Role_ID",
  "guild_id": "guild_id",
  "scrim_kds": "A_Channel_ID",
  "token": "Discord_Bot_Token",
  "client_id": "Bot_ID",
  "upcomming_matches": "A_Channel_ID"
}
```

* /avalibility -> Creates 7 embeds in one channel with buttons (one for each day of the week) adds its message id to global_ids.json. Lets you vote your avalibility for the week (Visit website (https://localhost:3000/) to edit the embed for a scheduled date and time against a specific team (I made it in BST(Not sure if GMT is the same)
* https://localhost:3000/scrims to upload your teams KDs to a specific channel which would be sent an embed of each map, and KD of each person played

# IVI BOT SETUP + GLOBAL_IDS.JSON FILE + COMMANDS EXPLAINED:
```
{
  "Scrim": "A_Channel_ID",
  "team_role_id": "A_Role_ID",
  "guild_id": "guild_id",
  "scrim_kds": "A_Channel_ID",
  "monthly_kds": "A_Channel_ID",
  "token": "Discord_Bot_Token",
  "client_id": "Bot_ID",
  "upcomming_matches": "A_Channel_ID",
  "team_announcements": "A_Channel_ID"
}
```

* /add-player (Name: Being their IRL name, as thats how we call eachother on ivi, you can do username. but make sure when you are doing kds, you keep the username the same even if they changed it in game) -> gives the discord user the team role, to get access to your channels
* /scrim Creates an embed vote for the team, instead of having one for each day, there is no limit now(5 can vote for main, till automatically put as a sub). Sends a reminder message, and then a message when it happens. And a while after the entered time, it will ping the subs. Then a while after the scrim started, it deletes all 3 messages.
* /upload-kds -> Gets the bot to DM you asking for each map played, and the teams KDS, it will send a message as an embed for you teams KDS, and every month it will automatically calculate everyone's KDs and kills/deaths per map average
* A weekly task to Fetch from the VRML API on your teams weekly matchup

## Contact Me
Discord -> capzay

feel free to ask me questions
