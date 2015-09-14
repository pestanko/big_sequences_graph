/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */


function WindowLevel(level, connection, raw)
{

    // Size of level - Number of tiles
    var lvl_size = window.stat.levelTiles(level);

    var requested_tiles = {};

    // Array of Tiles
    this.tiles = new Array(lvl_size);
    //Level id
    this.level = level;
    //Connection manager
    this.connection = connection;
    // Self pointer
    var _this = this;
    // Logging tool
    this.log = Logger;
    // function to calculate window size
    this.window_size = function() { //TODO
        var int = pos_int();
        var diff = (int.end - int.beg);
        if(diff < 0) return window.stat.windowSize();
        if(diff > 2*window.stat.windowSize())
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


    var pos_int = function(pos)
    {
        pos = pos || _this.pos;
        return {beg:  pos_tile(pos.beg), end: pos_tile(pos.end) };
    };
    var max = window.config.levels - 1;
    var diff = max - level;
    this.tileSize = Math.pow(window.config.tile_size, diff + 1);


    this.saveInterval = function()
    {
        this.prev_pos = this.pos;
    };

    this.updateInterval = function(interval)
    {
        this.saveInterval();
        this.interval = interval;
    };

    this.dataSize = function()
    {
        return this.window_size() * this.tileSize;
    };



    /**
     * Function calculate which tiles should be allocated
     * @param inter - current interval
     * @param prev - previous interval
     * @returns {{a_beg: number[], a_end: number[], d_end: number[], d_beg: number[]}}
     * @constructor
     */
    this.UpDownDiff = function (inter, prev) {
        var pb = pos_tile(this.prev_pos.beg);
        inter = inter  ||  {beg:this.lowBuffIndex(), end:this.upBuffIndex()};
        prev = prev ||  {beg:this.lowBuffIndex(pb), end:this.upBuffIndex(pb)};

        var diff_beg = inter.beg - prev.beg;
        var diff_end = inter.end - prev.end;

        var d_beg = [0,0];
        var d_end = [0,0];
        var a_beg = [0,0];
        var a_end = [0,0];

        if(diff_beg < 0)
        {
            // Ib < Pb -- shift left
            a_beg = [inter.beg , prev.beg];
        }else
        {
            d_beg = [prev.beg, inter.beg];
        }

        if(diff_end < 0)
        {
            a_end = [inter.beg, prev.end];
        }else
        {
            d_end = [prev.end, inter.end];
        }

        return {a_beg : a_beg, a_end: a_end, d_end: d_end, d_beg: d_beg};
    };

    /**
     * Function deletes tiles
     * @param inter - current interval
     * @param prev - previous interval
     */

    this.activeClean = function(inter, prev)
    {
        inter = inter || pos_int() ;
        prev = inter ||  pos_int(this.prev_pos) ;

        var p_b = this.lowBuffIndex(prev.beg);
        var p_e = this.upBuffIndex(prev.end);

        var bounds = this.UpDownDiff();

        var pws = p_b - p_e;

        for(var i = bounds.d_beg[0], j = 0; i < bounds.d_beg[1], j < pws; i++, j++)
        {
            this.deleteTile(i);
        }
        this.log.info("[CLEAN]: Begin Interval [%d, %d].", bounds.d_beg[0], bounds.d_beg[1]);

        for(var i = bounds.d_end[0], j = 0; i < bounds.d_end[1], j < pws; i++, j++)
        {
            this.deleteTile(i);
        }
        this.log.info("[CLEAN]: End Interval [%d, %d].", bounds.d_end[0], bounds.d_end[1]);

    };

    this.deleteTile = function(index)
    {
        this.tiles[index] = null;
    };

    this.deleteTiles = function(begin, end)
    {
        for(var i = begin; i < end; i++)
        {
            this.deleteTile(i);
        }
    };



    this.upIndex = function(index)
    {
        index = index || pos_tile(this.pos.end);
        var up = index;
        if(up >= lvl_size)
        {
            return lvl_size
        }
        else
        {
            return up + 1;
        }
    };

    this.lowIndex = function (index) {
        if(!index) { index = pos_tile(this.pos.beg) ;}
        var min = lvl_size - _this.window_size();
        return (index > min) ? min : index;
    };

    this.lowBuffIndex = function(index)
    {
        index = this.lowIndex(index);
        var low_size = Math.floor(this.window_size() * 1);
        var low = index - low_size;
        return low;
    };

    this.upBuffIndex = function(index)
    {
        index = this.upIndex(index);
        var up_size = Math.ceil(this.window_size() * 1);
        var up = index + up_size;
        return up;
    };

    this.moveTo = function()
    {
        var oldWinSize = this.window_size();
        this.movePos(0, oldWinSize * this.tileSize);
    };

    this.addTile = function(index, data){
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
            for(var j = 0 ; j < tile_size; j++)
            {
                if(this.raw)
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

    this.requestTile = function(index)
    {
        if(!this.getTile(index) && !requested_tiles[index])
        {
            if(index < lvl_size && index >= 0) {
                this.connection.getTile(this.level, index);
                requested_tiles[index] = true;
            }
        }
    };

    this.loadBuffer = function()
    {
        var low = this.lowIndex();
        var up = this.upIndex();
        var upB = this.upBuffIndex();
        var lowB=this.lowBuffIndex();
        for(var i = low; i < up + 1; i++) // Window interval
        {
            this.requestTile(i)
        }

        for(var i =  up; i < upB; i++)
        {
            this.requestTile(i)
        }

        for(var i = lowB; i < low; i++)
        {
            this.requestTile(i)
        }
    };

    this.getInterval = function (beg, end) {
        this.updateInterval({beg, end});

        this.loadBuffer();

    };



    this.getTile = function(index)
    {
        if(index < 0 || index > lvl_size) return null;
        return this.tiles[index];
    };

    this.toTile = function(index)
    {
        var direction = (index - this.interval.beg);
        this.moveTile(direction);
    };

    this.scale = function (dir)
    {
        this.movePos(-dir, dir);
    };


    this.movePos = function(dir_beg, dir_end)
    {
        var max_size = window.config.size;

        var oneStep = this.tileSize / window.config.tile_size;

        dir_beg *= (oneStep/2);
        dir_end *= (oneStep/2);

        var p_beg = this.pos.beg;
        var p_end = this.pos.end;

        var beg = p_beg + dir_beg,
            end = p_end + dir_end;



        var std_w_size = window.stat.windowSize();
        var w_size_limit = std_w_size * 1.5;
        var w_size_pos =  w_size_limit * this.tileSize;


        var diff = end - beg;

        if(diff >= w_size_pos)
        {
            end = beg + w_size_pos;
        }

        if(beg >= end)
        {
            end = beg + this.tileSize;
            return;
        }

        if(beg < 0){
            beg = 0;
            return;
        }
        if(end > max_size)
        {
            end = max_size;
            return;
        }

        this.pos.beg = beg;
        this.pos.end = end;

        var gp = window.stat.convertToTile;


        var nbt = gp(beg);
        var net = gp(end);

        this.getInterval(nbt,net + 1);

    };

    this.move = function(dir)
    {
        dir *= (this.tileSize);
        this.movePos(dir, dir);
    };

    this.moveScaled = function()
    {
        var beg = this.pos.beg;
        var end = this.pos.end;
        var std_w_size = window.stat.windowSize();
        var w_size_limit = std_w_size * 1.5;
        var w_size_pos =  w_size_limit * this.tileSize;

        if(beg + w_size_pos > end  )
        {
            end = beg + w_size_pos;
        }

        var diff = end - this.pos.end;


        this.movePos(0, diff);
    };



    this.moveTile = function(dir)
    {
        this.movePos(dir * this.tileSize, dir * this.tileSize);
    };

};

