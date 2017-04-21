--#ENDPOINT PUT /device/{sn}
-- Write to one or more sensors of device with serial number {sn}
-- Expects JSON object containing one or more properties depending on
-- the device.
-- E.g. {"temperature": 10.0}
local sn = tostring(request.parameters.sn)

local message = {}
local code = 200
for _, alias in ipairs(util.get_device_aliases()) do
  if request.body[alias] ~= nil then
    local ret = util.device_write(sn, alias, request.body[alias])
    if ret.status ~= nil and ret.status ~= 200 then
      code = ret.status
      table.insert(message, {alias = alias, status = ret.status, message = ret.error})
    elseif ret[alias] ~= nil then
      table.insert(message, {alias = alias, status = ret[alias]})
    else
      table.insert(message, {alias = alias, response = ret})
    end
  end
end
response.code = code
if table.getn(message) ~= 0 then
  response.message = message
else
  response.message = message
end
