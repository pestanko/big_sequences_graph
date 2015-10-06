/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */


function WindowLevel(level, manager, raw) {

    // Size of level - Number of tiles
    var lvl_size = window.stat.levelTiles(level);

    var requested_tiles = {};

    // Array of Tiles
    this.tiles = new Array(lvl_size);
    //Level id
    this.level = level;
    //Connection manager
    this.connection = manager.connection;
    // Self pointer
    var _this = this;
    // Logging tool
    this.log = Logger;


    // function to calculate window size
    this.window_size = function () { //TODO
        var int = pos_int();
        var diff = (int.end - int.beg);
        if (diff < 0) return window.stat.windowSize();
        if (diff > 2 * window.stat.windowSize())
        {
            return window.stat.windowSize() * 2;
        }
        return diff;
    };
    // Current interval in tile indexes
    // previous interval in coordinates
    this.prev_pos = {beg: 0, end: 0};
    this.pos = window.icfg.position;

    this.raw = raw || false;

    var pos_tile = window.stat.convertToTile;



    var pos_int = function (pos) {
        pos = pos || _this.pos;
        return {beg: pos_tile(pos.beg), end: pos_tile(pos.end)};
    };

    var max = window.config.levels - 1;
    var diff = max - level;
    this.tileSize = Math.pow(window.config.tile_size, diff + 1);

    this.max_size = window.config.active_window_size * this.tileSize * 2;

    this.log.debug("[DEBUD] Level [%d] has max size: %d", this.level, this.max_size);


    this.deleteTile = function (index) {
        this.tiles[index] = null;
    };

    this.deleteTiles = function (begin, end) {
        for (var i = begin; i < end; i++)
        {
            this.deleteTile(i);
        }
    };


    this.upIndex = function (index) {
        index = index || pos_tile(this.pos.end);
        var up = index;
        if (up >= lvl_size)
        {
            return lvl_size
        }
        else
        {
            return up + 1;
        }
    };

    this.lowIndex = function (index) {
        if (!index)
        {
            index = pos_tile(this.pos.beg);
        }
        var min = lvl_size - _this.window_size();
        return (index > min) ? min : index;
    };

    this.lowBuffIndex = function (index) {
        index = this.lowIndex(index);
        var low_size = Math.floor(this.window_size() * 1);
        var low = index - low_size;
        return low;
    };

    this.upBuffIndex = function (index) {
        index = this.upIndex(index);
        var up_size = Math.ceil(this.window_size() * 1);
        var up = index + up_size;
        return up;
    };

    this.moveTo = function () {
        var oldWinSize = this.window_size();
        this.movePos(0, oldWinSize * this.tileSize);
    };

    this.addTile = function (index, data) {
        var tile_size = window.config.tile_size;
        var init_pos = window.stat.tileToPosition(level, index);
        var one_step = this.tileSize / tile_size;
        var number_of_channels = data.length;
        var tile = new Array(number_of_channels);

        delete requested_tiles[index];


        for (var i = 0; i < number_of_channels; i++) // Each channels
        {
            tile[i] = new Array(tile_size);
            var channel = tile[i];
            var position = init_pos;
            var tile_data = null;
            var data_ch = data[i];
            for (var j = 0; j < tile_size; j++)
            {
                if (this.raw)
                {
                    tile_data = {x: position, y: data_ch[j]};
                }
                else
                {
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

    this.requestTile = function (index) {
        if (!this.getTile(index) && !requested_tiles[index])
        {
            if (index < lvl_size && index >= 0)
            {
                this.connection.getTile(this.level, index);
                requested_tiles[index] = true;
            }
        }
    };

    this.loadBuffer = function () {
        var low = this.lowIndex();
        var up = this.upIndex();
        var upB = this.upBuffIndex();
        var lowB = this.lowBuffIndex();
        for (var i = low; i < up + 1; i++) // Window interval
        {
            this.requestTile(i)
        }

        for (var i = up; i < upB + 1; i++)
        {
            this.requestTile(i)
        }

        for (var i = lowB; i < low; i++)
        {
            this.requestTile(i)
        }
    };


    this.getTile = function (index) {
        if (index < 0 || index > lvl_size) return null;
        return this.tiles[index];
    };

    this.toTile = function (index) {
        var direction = (index - this.interval.beg);
        this.moveTile(direction);
    };

    this.scale = function (dir) {
        this.moveVariable(-dir, dir);
    };

    this.moveVariable = function (dir_beg, dir_end) {
        var oneStep = this.tileSize / window.config.tile_size;

        dir_beg *= (oneStep / 2);
        dir_end *= (oneStep / 2);
        this.movePos(dir_beg, dir_end);
    };


    this.movePos = function (dir_beg, dir_end) {
        var max_size = window.config.size;

        var p_beg = this.pos.beg;
        var p_end = this.pos.end;


        var beg = p_beg + dir_beg,
            end = p_end + dir_end;


        if (beg >= end)
        {
            this.log.debug("[DEBUG]{STOP} - Begin is greater than end.");
            end = beg + this.tileSize;
        }

        if (beg < 0)
        {
            this.log.debug("[DEBUG]{STOP} - Begin is negative.");
            beg = 0;
        }
        if (end > max_size)
        {
            this.log.debug("[DEBUG]{STOP} - End is greater than max_size.");
            end = max_size;
        }

        this.pos.beg = beg;
        this.pos.end = end;


        var diff = end - beg; // Size of interval

        var nextLevel = manager.getLevel(this.level + 1); // Smaller numbers

        var up = this.max_size - 10;
        var low = 0;
        if(nextLevel)
            low = nextLevel.max_size;

        if (diff > up)
        {
            if (this.level <= 0) return;
            manager.stepLevel(-1);

        }
        else if (diff < low)
        {
            //if (this.level > (window.config.levels - 1)) return;
            manager.stepLevel(+1);
        }


        this.loadBuffer();
        this.prev_pos = this.pos;

    };

    this.update = function () {
        var move_beg = this.pos.beg - this.prev_pos.beg;
        var move_end = this.pos.end - this.prev_pos.end;
        this.movePos(move_beg, move_end);
    };

    this.move = function (dir) {
        dir *= (this.tileSize);
        this.movePos(dir, dir);
    };



    this.moveScaled = function (up_down) {

        var beg = this.pos.beg;
        var end = this.pos.end;
        var std_w_size = window.stat.windowSize();
        var w_size_limit = std_w_size * 3.1;
        var w_size_pos = w_size_limit * this.tileSize;

        if (up_down)
        {
            if (up_down < 0)
            {
                (end = end + w_size_pos / 2);
            }
        }

        var diff = end - beg;

        if (diff >= w_size_pos)
        {
            end = beg + w_size_pos;
        }

        var diff_e = end - this.pos.end;

        this.movePos(0, diff_e);

    };


    this.moveTile = function (dir) {
        this.movePos(dir * this.tileSize, dir * this.tileSize);
    };

}

