document.getElementById("mapCount").addEventListener("change", function () {
  const mapCount = parseInt(this.value);
  const container = document.getElementById("mapInputsContainer");
  container.innerHTML = ""; // Clear previous inputs

  for (let i = 1; i <= mapCount; i++) {
    const mapDiv = document.createElement("div");
    mapDiv.classList.add("map-input");
    mapDiv.innerHTML = `
              <h3>Map ${i}</h3>
              <input type="text" name="map${i}Name" placeholder="Map Name" required><br>
              <input type="text" name="map${i}Scores" placeholder="Map Scores" required><br>
              <input type="text" name="map${i}KD1" placeholder="playerName/k/d/a" required><br>
              <input type="text" name="map${i}KD2" placeholder="playerName/k/d/a" required><br>
              <input type="text" name="map${i}KD3" placeholder="playerName/k/d/a" required><br>
              <input type="text" name="map${i}KD4" placeholder="playerName/k/d/a" required><br>
              <input type="text" name="map${i}KD5" placeholder="playerName/k/d/a" required><br>
          `;
    container.appendChild(mapDiv);
  }
});

document.getElementById("mapForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form from submitting normally

  const mapCount = parseInt(document.getElementById("mapCount").value);
  const formData = [];
  const Team = document.getElementById("Team").value;

  for (let i = 1; i <= mapCount; i++) {
    const mapData = {
      mapNumber: i,
      Team: Team,
      Scores: document.querySelector(`input[name="map${i}Scores"]`).value,
      Name: document.querySelector(`input[name="map${i}Name"]`).value,
      KDS: [
        document.querySelector(`input[name="map${i}KD1"]`).value,
        document.querySelector(`input[name="map${i}KD2"]`).value,
        document.querySelector(`input[name="map${i}KD3"]`).value,
        document.querySelector(`input[name="map${i}KD4"]`).value,
        document.querySelector(`input[name="map${i}KD5"]`).value,
    ],
    };
    formData.push(mapData);
  }
  const jsonData = JSON.stringify(formData);
  // Call the server to send the messages
  fetch("https://localhost:3000/upload-kd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonData,
  }).catch(console.error);
});
