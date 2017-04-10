--
-- Product Event Handler
-- Handle data events

-- PUT DATA INTO TIME SERIES DATABASE STORAGE:
-- ============================
-- Write All Device Resource Data to timeseries database
local metrics = {[data.alias] = data.value[2]}
local tags = {pid = data.pid,identity = data.device_sn}
local out = Tsdb.write({
  metrics = metrics,
  tags = tags
})

-- PUT DATA INTO KEY VALUE STORE:
-- ============================
-- Write All Device Resources incomiong data to key/value data store
-- Check to see what data already exists
local resp = Keystore.get({key = "identifier_" .. data.device_sn})

-- Make sure each device has the following keys stored
local value = {
  temperature = "undefined",
  humidity = "undefined",
  uptime = "undefined",
  state = "undefined"
}
if type(resp) == "table" and type(resp.value) == "string" then
  value = from_json(resp.value) -- Decode from JSON to Lua Table
end
-- Add in other available data about this device / incoming data
value[data.alias] = data.value[2]
value["timestamp"] = data.timestamp/1000 -- add server's timestamp
value["pid"] = data.vendor or data.pid
-- Write data into key/value data store
Keystore.set({key = "identifier_" .. data.device_sn, value = to_json(value)})
