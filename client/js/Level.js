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
        var prev = {up: -1, low: -1};

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
                var int = {beg: pos_tile(this.pos.beg), end: pos_tile(this.pos.end)};
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
                index = index || pos_tile(this.pos.end);
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
                        index = pos_tile(this.pos.beg);
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
                var low_size = Math.floor(this.window_size());

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
                var up_size = Math.ceil(this.window_size());

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
                var max = (end > lvl_size) ? 0 : end;
                var lbi = prev.low;
                var ubi = prev.up;

                if (lbi == -1 || ubi == -1) {
                        this.connection.getTiles(level, min, max);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                var min_b = (min < lbi) ? min : lbi;
                var max_b = (max > ubi) ? max : ubi;

                if (min < lbi && max < lbi) {
                        this.connection.getTiles(level, min, max);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                if (min > ubi) {
                        this.connection.getTiles(level, min, max);
                        prev.low = min;
                        prev.max = max;
                        return;
                }

                if (min_b != lbi) {
                        this.connection.getTiles(level, min_b, lbi + 1);
                }

                if (max_b != ubi) {
                        this.connection.getTiles(level, ubi, max_b + 1);
                }

                prev.low = min;
                prev.max = max;
        };

        /**
         * This method will request all tiles in active window and in buffers
         */
        this.loadBuffer = function ()
        {
                var upB = this.upBuffIndex();
                var lowB = this.lowBuffIndex();

                this.requestTiles(lowB, upB);
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
                var oneStep = this.tileSize / window.config.tile_size;

                var diff = this.pos.end - this.pos.beg;

                oneStep *= (diff / (this.tileSize * 50) );

                dir_beg *= (oneStep / 2);
                dir_end *= (oneStep / 2);
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

                if (nextLevel) {
                        low = nextLevel.max_size;
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

