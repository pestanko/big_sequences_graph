/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */


function WindowLevel(level, connection)
{
    // Size of level - Number of tiles
    var lvl_size = window.stat.levelTiles(level);

    // Array of Tiles
    this.tiles = new Array(lvl_size);
    //Pointer to current position {level, index}
    this.curr = window.icfg.current;
    //Level id
    this.level = level;
    //Connection manager
    this.connection = connection;
    // Self pointer
    var _this = this;
    // Logging tool
    this.log = new SimpleLogger();
    // function to calculate window size
    this.window_size = function() { return this.interval.end - this.interval.beg; };
    // Current interval in tile indexes
    this.interval = {beg: 0, end: window.stat.windowSize()};
    // previous interval in coordinates
    this.prev_interval = {beg: 0, end: 0};

    this.raw = false;

    var max = window.config.levels - 1;
    var diff = max - level;

    this.tileSize = Math.pow(window.config.tile_size, diff);


    this.saveInterval = function()
    {
        this.prev_interval = this.interval;
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
        var pb = this.prev_interval.beg;
        inter = inter  | {beg:this.lowBuffIndex(), end:this.upBuffIndex()};
        prev = prev | {beg:this.lowBuffIndex(pb), end:this.upBuffIndex(pb)};

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
        inter = inter | this.interval;
        prev = inter | this.prev_interval;

        var w_size = prev.end - prev.beg;

        var i_b = this.lowBuffIndex(inter.beg);
        var i_e = this.upBuffIndex(inter.end);
        var p_b = this.lowBuffIndex(prev.beg);
        var p_e = this.upBuffIndex(prev.end);

        var bounds = this.UpDownDiff();

        var pws = p_b - p_e;

        for(var i = bounds.d_beg[0], j = 0; i < bounds.d_beg[1], j < pws; i++, j++)
        {

            this.deleteTile(i);

        }

        for(var i = bounds.d_end[0], j = 0; i < bounds.d_end[1], j < pws; i++, j++)
        {
            this.deleteTile(i);
        }
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


    this.windowSize = window.stat.windowSize;

    this.upIndex = function(index)
    {
        if(!index)
        {
            index = _this.curr.index ;
        }
        var up = index + _this.window_size();
        return (up >= lvl_size) ? lvl_size  : up;
    };

    this.lowIndex = function (index) {
        if(!index) { index = _this.curr.index ;}
        var min = lvl_size - _this.window_size();
        return (index > min) ? min : index;
    };

    this.lowBuffIndex = function(index)
    {
        index = index | this.interval.beg;
        var low_size = Math.floor(this.window_size() * 1);
        var low = index - low_size;
        return low;
    };

    this.upBuffIndex = function(index)
    {
        index = index | this.interval.end;
        var low_size = Math.floor(this.window_size() * 1);
        var low = index + low_size;
        return low;
    };

    this.addTile = function(index, data)
    {
        _this.log.debug("[ADD] Tile @ [%d, %d].", level, index);
        var tile_size = window.config.tile_size;

        var init_pos = window.stat.tileToPosition(level, index);
        var one_step = this.tileSize / tile_size;
        var number_of_channels = data.length;
        var tile = new Array(number_of_channels);


        for (var i = 0; i < number_of_channels; i++) // Each channels
        {
            tile[i] = new Array(tile_size);
            var position = init_pos;
            for(var j = 0 ; j < tile_size; i++)
            {
                if(this.raw)
                {
                    tile[i][j] = {x: position, y: data[i][j]};
                }
                else
                {
                    tile[i][j] = {x: position, min: data[i][0][j], max: [i][1][j]};
                }
                position += one_step;
            }
        }

        this.tiles[index] = tile;

    };

    this.requestTile = function(index)
    {
        if(!this.getTile(index))
        {
            if(index < lvl_size && index >= 0)
                this.connection.getTile(this.level, index);
        }
    };

    this.loadBuffer = function()
    {
        //noinspection JSUnusedAssignment
        var i = 0;
        for(i = this.lowIndex(); i < this.upIndex(); i++)
        {
            this.requestTile(i)
        }

        for(i = this.lowBuffIndex(); i < this.lowIndex(); i++)
        {
            this.requestTile(i)

        }

        for(i = this.upIndex(); i < this.upBuffIndex(); i++)
        {
            this.requestTile(i)
        }
    };

    this.getInterval = function (beg, end) {
        this.updateInterval({beg, end});
    };



    this.getTile = function(index)
    {
        if(index < 0 || index > lvl_size) return null;
        return this.tiles[index];
    };

    this.toTile = function(index)
    {
        var direction = (index - this.curr.index);
        this.moveTile(direction);
    };

    this.toDomainX = function()
    {
        var beg = this.tileSize * this.interval.beg;
        var end = this.tileSize * this.interval.end;
        return {beg, end};
    };

    this.moveTile = function(direction)
    {
        var sum = this.curr.index + direction;
        var oldIndex = this.curr.index;
        var n_index = 0;

        if(sum < 0)
        {
            n_index = 0;
        }
        else if(sum >= (lvl_size - this.window_size))
        {
            n_index = lvl_size - this.window_size;
        }
        else
        {
            n_index = sum;
        }

        this.curr.index = n_index;
        var del =  { min: 0, max: 0};
        var bf_size = this.upBuffIndex() - this.lowBuffIndex();


        if(direction > 0)
        {
            del.min = this.lowBuffIndex(oldIndex);
            del.max = this.lowBuffIndex(n_index);


            for(var i = del.min; i < del.max && i <= del.min + bf_size; i++)
            {
                _this.log.info("[DELETE] Tile @ [%d, %d]. ", level, this.curr.index);
                this.tiles[i] = null;
            }
        }
        else
        {
            del.min = this.upBuffIndex(n_index);
            del.max = this.upBuffIndex(oldIndex);
            for(var i = del.max - 1; i >= del.min && i >= (del.max - bf_size); i--)
            {
                _this.log.info("[DELETE] Tile @ [%d, %d]. ", level, this.curr.index);
                this.tiles[i] = null;
            }
        }

        _this.log.debug("~~~~~~~~ [DEBUG] Min vs Max: [%d, %d]", del.min, del.max);


        this.loadBuffer();
    };

};

