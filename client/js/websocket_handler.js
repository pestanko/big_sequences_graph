/**
 * Created by wermington on 12.7.2015.
 */


function ws_client(host, manager)
{
    var wsocket = new WebSocket(host);
    var _this = this;

    this.host = host || "ws://locahost:10888";
    this.manager = manager || null;

    wsocket.onopen = function(event)
    {
        console.log("Websocket connected to " + host)

    };


    wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data)

        switch (message.type)
        {
            case "tile":
                console.log("Received tile message");
                _this.receivedTile(message);
                break;

            case "channel-update":
                console.log("Received updated channel");
                break;

            case "config":
                _this.updateConfig(message);
                console.log("Received config message.", message);
                break;
        }

    };

    wsocket.onerror = function(event)
    {
        var message = event.data
        console.log("ERROR: " +  message)
    };

    wsocket.onclose = function(event)
    {
        console.log("Websocket closed connection")
    };


    this.receivedTile = function(message)
    {
        manager.newTile(message.channels, message.path, message.data);
    };

    this.getTile = function(tile_info)
    {
        //TODO

        var message =
        {
            type: "tile",
            channels: tile_info.channels,
            path: tile_info.path
        };

        wsocket.send(JSON.stringify(message));

    };

    this.updateConfig = function(message)
    {
        this.manager.config = {
            x_axis: message.x_axis,
            y_axis: message.y_axis,
            levels: message.levels,
            tiles: message.tiles,
            size: message.tileSize,
            channels: message.channels
        };
    };

}



