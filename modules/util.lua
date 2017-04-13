util = {}
util.DATA_PREFIX = "sensor-"

---
-- Return a product identifier
util.get_product_id = function ()
  -- Assume only only one product associated with
  -- this solution.
  local solutionConfig = Config.solution()
  if table.getn(solutionConfig.products) == 0 then
    return nil
  end
  --TODO Return first known product, change as needed.
  return solutionConfig.products[1]
end

--------------------------------------------------
-- Timeseries functions
--------------------------------------------------

---
-- Record timeseries data
-- { device_sn="<sn>", alias="<alias>",
-- value="<value>", timestamp="<timestamp>" }
util.write_log = function(data)
  local metric_alias = data.alias:gsub("-", "_")
  local metrics = {
    [metric_alias] = tostring(to_json(data.value))
  }
  local tags = {
    region = "us",
    city = "minneapolis",
    identity = data.device_sn,
    pid = util.get_product_id()
  }
  local write_block = {
    metrics = metrics,
    tags = tags
  }
  if data.timestamp then
    write_block["ts"] = data.timestamp
  end

  return Tsdb.write(write_block)
end

--------------------------------------------------
-- Device functions
--------------------------------------------------

---
-- Read values for a device from the key/value database
-- parm_name is 'sn', parm_value is the ID
util.kv_read = function (sn)
  local resp = Keystore.get({key = util.DATA_PREFIX .. sn})
  local device = nil
  if type(resp) == "table" and type(resp.value) == "string" then
    -- device was written, return the latest values
    device = from_json(resp.value)
  end

  return device
end

---
-- Store device settings to the key value store
util.kv_write = function (sn, values)
  return Keystore.set({key = util.DATA_PREFIX .. sn, value = to_json(values)})
end

---
-- Write value to device alias
util.device_create = function (sn)
  local pid = util.get_product_id()

  if pid == nil then
    local response = {}
    response.code = 500
    response.message = "No Product ID associated with Solution."
    return response
  end

  local device = {pid = pid}
  -- save to keystore
  util.kv_write(sn, device)

  return Device.create({
    pid = pid,
    ["device_sn"]=sn
  })
end

---
-- Write value to device alias
util.device_write = function (sn, alias, value)
  local pid = util.get_product_id()

  if pid == nil then
    local response = {}
    response.code = 500
    response.message = "No Product ID associated with Solution."
    return response
  end

  local device = util.kv_read(sn)
  if device == nil then
    device = {pid = pid}
  end
  device[alias] = value

  -- save to keystore
  util.kv_write(sn, device)

  return Device.write({
    pid = pid,
    device_sn=sn,
    [alias]=value
  })
end

---
-- Return a list (table) of all product device aliases
util.get_device_aliases = function ()
   local ret = Device.productInfo({pid=util.get_product_id()})
   if ret.resources ~= nil then
     local alias_names = {}
     for idx, group in pairs(ret.resources) do
       for key, value in pairs(group) do
         if key == "alias" then
           table.insert(alias_names, value)
         end
       end
     end
     return alias_names
   end
   return nil
end

---
-- Return a list of all devices
util.get_all_devices = function()
  return Device.list({ pid=util.get_product_id() })
end

-- vim: set ai sw=2 ts=2 :
