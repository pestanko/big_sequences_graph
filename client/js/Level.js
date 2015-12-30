/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */


function WindowLevel(level, manager, raw)
{

        // Size of level - Number of tiles
        var lvl_size = window.stat.levelTiles(level);
        // Converts coordinates to tile index
        var pos_tile = window.stat.convertToTile;
        // Object containing indexes of requested tiles
        var requested_tiles = {};
        // Self pointer
        var _this = this;
        // Previous
        var prev = {max: -1, low: -1};

        // Array of Tiles
        this.tiles = new Array(lvl_size);
        //Level id
        this.level = level;
        //Connection manager
        this.connection = manager.connection;
        // Logging tool
        this.log = Logger;
        // Size of one tile
        this.tileSize = Math.pow(window.config.tile_size, (window.config.levels - level));
        // Maximum size in coordinates
        this.max_size = window.config.active_window_size * this.tileSize * 2;
        // Position in graph
        this.pos = window.icfg.position;
        // Raw data
        this.raw = raw || false;

        this.log.debug("[DEBUG] Level [%d] has max size: %d", this.level, this.max_size);

        /**
         *  Gets window size
         * @returns {number} Window size
         */
        this.window_size = function ()
        {
                var int = {beg: pos_tile(this.pos.beg, this.level), end: pos_tile(this.pos.end, this.level)};
                var diff = (int.end - int.beg);
                if (diff < 0) return window.stat.windowSize();
                if (diff > 2 * window.stat.windowSize()) {
                        return window.stat.windowSize() * 2;
                }
                return diff;
        };

        /**
         * Returns Up index of active window (interval that is shown)
         * Also check bounds and return max or min value
         * @param index - UpIndex
         * @returns {number} UpIndex
         */
        this.upIndex = function (index)
        {
                index = index || pos_tile(this.pos.end, level);
                var up = index;
                if (up >= lvl_size) {
                        return lvl_size
                }
                else {
                        return up + 1;
                }
        };
        /**
         * Returns Low index of active window (interval that is shown)
         * Also check bounds and return max or min value
         * @param index - Low Index
         * @returns {number} Low Index
         */
        this.lowIndex = function (index)
        {
                if (!index) {
                        index = pos_tile(this.pos.beg, level);
                }
                var min = lvl_size - _this.window_size();
                return (index > min) ? min : index;
        };

        /**
         * Returns Low buffer index before active window (interval that is preloaded)
         * Also check bounds and return max or min value
         * @param index - Low buffer Index
         * @returns {number} Low buffer Index
         */
        this.lowBuffIndex = function (index)
        {
                index = this.lowIndex(index);
                var limit = this.window_size() / 4;
                if(limit < 10) limit = 10;
                var low_size = Math.floor(limit);

                var lowB = index - low_size;
                return (lowB < 0) ? 0 : lowB;
        };

        /**
         * Returns Up buffer index behind active window (interval that is preloaded)
         * Also check bounds and return max or min value
         * @param index - Up buffer Index
         * @returns {number} Up buffer Index
         */
        this.upBuffIndex = function (index)
        {
                index = this.upIndex(index);
                var limit = this.window_size() / 4;
                if(limit < 10) limit = 10;
                var up_size = Math.ceil(limit);

                var upB = index + up_size;
                return (upB > lvl_size) ? lvl_size : upB;
        };

        /**
         * Adding tile to Level Tile holder
         * @param index - index of tile
         * @param data - data of tile
         */
        this.addTile = function (index, data)
        {
                if(!data)
                {
                        this.log.error("Tile @ [%d] - is empty!", index );
                        return;
                }

                var tile_size = window.config.tile_size;
                var init_pos = window.stat.tileToPosition(level, index);
                var one_step = this.tileSize / tile_size;
                var number_of_channels = data.length;
                var tile = new Array(number_of_channels);

                delete requested_tiles[index];

                for (var i = 0; i < number_of_channels; i++) { // Each channels{
                        tile[i] = new Array(tile_size);
                        var channel = tile[i];
                        var position = init_pos;
                        var tile_data = null;
                        var data_ch = data[i];
                        for (var j = 0; j < tile_size; j++) {
                                if (this.raw) {
                                        tile_data = {x: position, y: data_ch[j]};
                                }
                                else {
                                        var data_min = data_ch[0];
                                        var data_max = data_ch[1];
                                        tile_data = {x: position, min: data_min[j], max: data_max[j]};
                                }
                                channel[j] = tile_data;
                                position += one_step;
                        }
                }

                this.tiles[index] = tile;

        };

        /**
         * Request tile from remote server
         * @param index - index of Tile
         */
        this.requestTile = function (index)
        {

                if (!this.getTile(index) && !requested_tiles[index]) {
                        if (index < lvl_size && index >= 0) {
                                this.connection.getTile(this.level, index);
                                requested_tiles[index] = true;
                        }
                }
        };

        this.requestTiles = function (beg, end)
        {
                if (beg >= end) return;
                var min = (beg < 0) ? 0 : beg;
                var max = (end > lvl_size) ? lvl_size : end;
                var prev_low = prev.low;
                var prev_max = prev.max;


                if (prev_low == -1 || prev_max == -1) {
                        _this.log.debug("[DEBUG] Getting tiles (whole level): [%d, %d]", min, max);
                        this.connection.getTiles(level, min, max);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                var min_get = (min < prev_low) ? min : prev_low;
                var max_get = (max > prev_max) ? max : prev_max;

                if (min_get < prev_low && max_get < prev_low) {
                        this.connection.getTiles(level, min_get, max_get);
                        _this.log.debug("[DEBUG] Getting tiles (new interval - before - actual): [%d, %d]", min_get, max_get);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                if (min_get > prev_max) {
                        this.connection.getTiles(level, min_get, max_get);
                        _this.log.debug("[DEBUG] Getting tiles (new interval - after - actual): [%d, %d]", min_get, max_get);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                if (min_get != prev_low) {
                        this.connection.getTiles(level, min_get, prev_low + 1);
                        _this.log.debug("[DEBUG] Getting tiles [before] (prefetch to actual): [%d, %d]", min_get, prev_low + 1);
                }

                if (max_get != prev_max) {
                        _this.log.debug("[DEBUG] Getting tiles [after] (postfetch to actual): [%d, %d]", prev_max, max_get + 1);
                        this.connection.getTiles(level, prev_max, max_get + 1);
                }

                prev.low = min_get;
                prev.max = max_get;
        };

        /**
         * This method will request all tiles in active window and in buffers
         */
        this.loadBuffer = function ()
        {
                var upB = this.upBuffIndex();
                var lowB = this.lowBuffIndex();
                var up = this.upIndex();
                var low = this.lowIndex();
                //this.log.info("Requested interval: [%d,%d] of size %d.", lowB, upB, this.lowIndex() - this.lowBuffIndex());

                if (window.icfg.communication == "tiles") {
                        this.requestTiles(low, up);
                        this.requestTiles(up, upB);
                        this.requestTiles(lowB, low);
                }
                else {
                        for (var i = low; i < up; i++) {
                                this.requestTile(i);
                        }
                        for (var i = up; i < upB; i++) {
                                this.requestTile(i);
                        }
                        for (var i = lowB; i < low; i++) {
                                this.requestTile(i);
                        }
                }
        };

        /**
         * Gets tile from array
         * @param index
         * @returns null if not exists, tile on spec. index
         */
        this.getTile = function (index)
        {
                if (index < 0 || index > lvl_size) return null;
                return this.tiles[index];
        };

        /**
         * Move window to spec. tile index
         * @param index - Tile index
         */
        this.toTile = function (index)
        {
                var direction = (index - this.interval.beg);
                this.moveTile(direction);
        };

        /**
         * Scale active window in spec. interval
         * @param dir - direction in which to scale
         */
        this.scale = function (dir)
        {
                this.moveVariable(-dir, dir);
        };

        /**
         * Move active window bounds in directions.
         * Movement speed is affected by one step
         * @param dir_beg - move begin of window in direction
         * @param dir_end - move end of window in direction
         */
        this.moveVariable = function (dir_beg, dir_end)
        {
                this.movePos(dir_beg, dir_end);
        };

        /**
         * Move to position - Main function to move by pos - not scaled
         * @param dir_beg
         * @param dir_end
         */
        this.movePos = function (dir_beg, dir_end)
        {
                var max_size = window.config.size;

                var p_beg = this.pos.beg;
                var p_end = this.pos.end;

                var beg = p_beg + dir_beg;
                var end = p_end + dir_end;

                if (beg >= end) {
                        this.log.debug("[DEBUG]{STOP} - Begin is greater than end.");
                        end = beg + this.tileSize;
                }

                if (beg < 0) {
                        this.log.debug("[DEBUG]{STOP} - Begin is negative.");
                        beg = 0;
                }
                if (end > max_size) {
                        this.log.debug("[DEBUG]{STOP} - End is greater than max_size.");
                        end = max_size;
                }

                this.pos.beg = beg;
                this.pos.end = end;

                var diff = end - beg; // Size of interval
                var nextLevel = manager.getLevel(this.level + 1); // Smaller numbers
                var up = this.max_size + 10;
                var low = 0;

                const prefetch_factor_up = 0.3;
                const prefetch_factor_down = 1.3;

                if (nextLevel) {
                        low = nextLevel.max_size;
                }
                var reflvl = window.icfg.current.level;

                if (diff > up * prefetch_factor_up) {
                        manager.loadlevel(-1);
                }

                if (diff < low * prefetch_factor_down) {
                        manager.loadlevel(+1);
                }

                if (diff > up) {
                        if (this.level <= 0) return;
                        manager.stepLevel(-1);

                }
                else if (diff < low) {
                        //if (this.level > (window.config.levels - 1)) return;
                        manager.stepLevel(+1);
                }

                this.loadBuffer();

        };

        /**
         * Move in one direction - not scale
         * @param dir - direction (negative - left , positive - right)
         */
        this.move = function (dir)
        {
                dir *= (this.tileSize);
                this.movePos(dir, dir);
        };

        /**
         * Move to new level - scaled on max size of level
         * @param up_down - up scaled of down scaled
         */
        this.moveScaled = function (up_down)
        {

                var beg = this.pos.beg;
                var end = this.pos.end;

                if (up_down > 0) {
                        end = beg + this.max_size - 50;
                }
                else {
                        end = beg + this.max_size + 50;
                }

                var diff_e = end - this.pos.end;

                this.movePos(0, diff_e);

        };

        /**
         * Moves window to new position by direction
         * @param dir - if negative, moving left, if positive, moving right
         */
        this.moveTile = function (dir)
        {
                this.movePos(dir * this.tileSize, dir * this.tileSize);
        };

}

