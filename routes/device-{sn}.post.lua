--#ENDPOINT POST /device/{sn}
-- Create a device with serial number {sn}
local sn = tostring(request.parameters.sn)

local message = {}
local code = 200
local ret = util.device_create(sn)
--if ret.status ~= nil and ret.status ~= 200 then
--  code = ret.status
--  message = ret.error
--else
--  message = ret
--end
response.code = code
response.message = ret
