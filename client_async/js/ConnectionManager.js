/**
 * Created by wermington on 9/7/15.
 */

function ConnectionManager(host)
{
    this.wsocket = new WebSocket(host);
    var _this = this;
    this.log = Logger;

    this.wsocket.onopen = function()
    {
        _this.log.info("[INFO] WebSocket connected to remote host [%s] ", host);
    };

    this.wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data);

        switch (message.type)
        {
            case "tile":
                _this.receivedTile(message);
                break;

            case "tile-int":
                _this.receivedTiles(message);
                break;

            case "config":
                _this.updateConfig(message);
                _this.log.debug("[DEBUG] Received config message: ", message);
                break;
        }
    };

    this.wsocket.onerror = function(event)
    {
        var message = event.data;
        _this.log.error("[ERROR] -- WebSocket fatal error:  ", message)
    };

    this.wsocket.onclose = function()
    {
        _this.log.info("[INFO] WebSocket closed connection.")
    };

    this.receivedTile = null;
    this.receivedTiles = null;

    this.updateConfig = function(message)
    {
        window.config = {
            x_axis: message.x_axis,
            y_axis: message.y_axis,
            levels: message.levels,
            tile_size: message.tile_size,
            size: message.size,
            active_window_size: 5,
            channels: message.channels
        };

        _this.log.info("[INFO] Updated config: " + window.config);
    };

    this.getTile = function(level, index)
    {
        _this.log.info("[INFO] Calling get tile for [%d, %d]", level, index);
        var message =
        {
            type: "get",
            level: level,
            index: index
        };

        this.wsocket.send(JSON.stringify(message));
    };

    this.getTiles = function(level,index)
    {
        _this.log.info("[INFO] Calling get tiles @ level [%d] and interval [%d, %d]", level ,index.beg, index.end);
        var message =
        {
            type: "get-tiles",
            level: level,
            beg: index.geg,
            end: index.end
        };

        this.wsocket.send(JSON.stringify(message));
    };
}



