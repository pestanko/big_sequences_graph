/**
 * Created by Peter Stanko on 9/7/15.
 */

function ConnectionManager(host)
{
        var _this = this;

        this.wsocket = new WebSocket(host);
        this.log = Logger;

        /**
         * When tile is received - must be implemented
         * @type {null} - requires implementation
         */
        this.receivedTile = null;
        /**
         * When tiles are received - must be implemented
         * @type {null}
         */
        this.receivedTiles = null;

        /**
         * When the connection is established
         */
        this.wsocket.onopen = function ()
        {
                _this.log.info("[INFO] WebSocket connected to remote host [%s] ", host);
        };

        /**
         * When the message arrives
         * @param event - event - message holder, data in event.data.
         */
        this.wsocket.onmessage = function (event)
        {
                var message = JSON.parse(event.data);

                switch (message.type) {
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

        /**
         * When error occurred
         * @param event - event.data - contains data
         */
        this.wsocket.onerror = function (event)
        {
                var message = event.data;
                _this.log.error("[ERROR] -- WebSocket fatal error:  ", message)
        };

        /**
         * When WebSocket connection is closed
         */
        this.wsocket.onclose = function ()
        {
                _this.log.info("[INFO] WebSocket closed connection.")
        };

        /**
         * When config message arrives
         * @param message
         */
        this.updateConfig = function (message)
        {
                window.config = {
                        x_axis            : message.x_axis,
                        y_axis            : message.y_axis,
                        levels            : message.levels,
                        tile_size         : message.tile_size,
                        size              : message.size,
                        active_window_size: 5,
                        channels          : message.channels
                };

                _this.log.info("[INFO] Updated config: " + window.config);
        };

        /**
         * Function to request tile from server
         * @param level - Level on which tile is
         * @param index - Index of tile
         */
        this.getTile = function (level, index)
        {
                _this.log.info("[INFO] Calling get tile for [%d, %d]", level, index);
                var message =
                {
                        type : "get",
                        level: level,
                        index: index
                };

                this.wsocket.send(JSON.stringify(message));
        };

        /**
         * Get tiles interval
         * @param level
         * @param beg - Begin interval
         * @param end - End interval
         */
        this.getTiles = function (level, beg, end)
        {
                _this.log.info("[INFO] Calling get tiles @ level [%d] and interval [%d, %d]", level, beg, end);
                var message =
                {
                        type : "get-tiles",
                        level: level,
                        beg  : beg,
                        end  : end
                };

                this.wsocket.send(JSON.stringify(message));
        };
}



