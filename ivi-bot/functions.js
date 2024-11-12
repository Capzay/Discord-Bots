const fs = require("fs");

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

function get_delete() {
  let global_ids_raw = fs.readFileSync("to-delete.json");
  let global_ids = JSON.parse(global_ids_raw);
  return global_ids;
}

function get_kds() {
  let global_ids_raw = fs.readFileSync("player-stats.json");
  let global_ids = JSON.parse(global_ids_raw);
  return global_ids;
}

module.exports = { get_ids, get_scrim, get_delete, get_kds };
