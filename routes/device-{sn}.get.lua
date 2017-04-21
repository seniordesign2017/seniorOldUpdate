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
