// JavaScript function to gather input values and send them separately
function sendMessage(day) {
  // Get the values of the input fields
  const Team = document.getElementById("Team").value;
  const Date = document.getElementById("Date").value;
  const Time = document.getElementById("Time").value;

  // Create a message object with separate fields
  const messageData = {
    channelId: "channelID_Here",
    messages: {
      field1: Team,
      field2: Date,
      field3: Time,
      field4: day,
    },
  };

  // Call the server to send the messages
  fetch("https://localhost:3000/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
  }).catch(console.error);
}

// Add event listeners for the day buttons
const dayButtons = document.querySelectorAll(".day-button");
dayButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const day = button.getAttribute("data-day");
    console.log(`Button for ${day} clicked`);
    // You can add functionality based on the day here
    sendMessage(day);
  });
});
