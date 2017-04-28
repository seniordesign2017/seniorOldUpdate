--#ENDPOINT GET /development/test
return 'Hello World! \r\nI am a test Murano Solution API Route entpoint'

--#ENDPOINT GET /development/storage/keyvalue
-- Description: Show current key-value data for a specific unique device or for full solution
-- Parameters: ?device=<uniqueidentifier>
local identifier = tostring(request.parameters.device)

if identifier == 'all' or identifier == "nil" then
  local response_text = 'Getting Key Value Raw Data for: Full Solution: \r\n'
  local resp = Keystore.list()
  --response_text = response_text..'Solution Keys\r\n'..to_json(resp)..'\r\n'
  if resp['keys'] ~= nil then
    local num_keys = #resp['keys']
    local n = 1 --remember Lua Tables start at 1.
    while n <= num_keys do
      local id = resp['keys'][n]
      local response = Keystore.get({key = id})
      response_text = response_text..id..'\r\n'
      --response_text = response_text..'Data: '..to_json(response['value'])..'\r\n'
      -- print out each value on new line
      for key,val in pairs(from_json(response['value'])) do
        response_text = response_text.. '   '..key..':'.. val ..'\r\n'
      end
      n = n + 1
    end
  end
  return response_text
else
  local resp = Keystore.get({key = "identifier_" .. identifier})
  return 'Getting Key Value Raw Data for: Device Identifier: '..identifier..'\r\n'..to_json(resp)
end

--#ENDPOINT GET /development/device/data
-- Description: Get timeseries data for specific device
-- Parameters: ?identifier=<uniqueidentifier>&window=<number>
local identifier = tostring(request.parameters.identifier) -- ?identifier=<uniqueidentifier>
local window = tonumber(request.parameters.window) -- in minutes,if ?window=<number>
if true then
  local data = {}
  if window == nil then window = 30 end
  -- Assumes temperature and humidity data device resources
  local metrics = {"temperature", "pressure","flow"}
  local tags = {identity = identifier}
  local out = Tsdb.query({
    metrics = metrics,
    tags = tags,
    relative_start = "-"..tostring(window).."m",
    epoch = "ms",
    fill = "null",
  })
  data['timeseries'] = out
  return data
else
  response.message = "Conflict - Identifier Incorrect"
  response.code = 404
  return
end

--#ENDPOINT POST /development/device/simulate
-- Description: Get timeseries data for specific device
-- Parameters: ?identifier=<identifier> (like "000001")
--             &pid=<pid>               (like "j7oac150bxzuxr")
--             &alias=<alias>           (like "temperature")
--             &value=<value>           (like "37")

local data = {}
data.device_sn = tostring(request.parameters.identifier)
data.value = {'live', tostring(request.parameters.value)}
data.alias = tostring(request.parameters.alias)
data.timestamp = tostring(request.parameters.timestamp)
data.pid = tostring(request.parameters.pid)

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
  flow = "undefined",
  pressure = "undefined",
  state = "undefined",
  humdiity = "undefined",
  pressure2 = "undefined",
  atmoPressure = "undefined",
  pumpTemperature = "undefined",
  current = "undefined"
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

--#ENDPOINT GET /aliases
-- Return a list of all device aliases
response.code = 200
local aliases = util.get_device_aliases()
if aliases == nil then
  response.code = 404
  response.message = util.get_device_aliases()
else
  response.message = aliases
end

--#ENDPOINT GET /device/{sn}
-- get details about a particular device
local sn = tostring(request.parameters.sn)
local res = util.kv_read(sn)
if res == nil then
    response.code = 404
    response.message = {}
else
  response.code = 200
  response.message = res
end
--#ENDPOINT GET /device
-- Return a list of all devices
response.code = 200
response.message = util.get_all_devices()
