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
