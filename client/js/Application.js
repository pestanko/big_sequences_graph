/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */


function SimpleLogger()
{
    this.disabled = {};
    var _this = this;
    this.log = window.stat.logging;
    this.error = function()
    {
        if(this.disabled.error) return;
        this.log.apply(null, arguments);
    };
    this.warning = function()
    {
        if(this.disabled.warning) return;
        this.log.apply(null,arguments);
    };
    this.debug = function()
    {
        if(this.disabled.debug) return;
        this.log.apply(null, arguments);
    };
    this.info = function()
    {
        if(this.disabled.info) return;
        this.log.apply(null,arguments);
    };
    //this.disabled.error = 1;
    //this.disabled.warning = 1;
    //this.disabled.info = 1;
    //this.disabled.debug = 1;
}


window.icfg =
{
    current: {level: 0, index: 0},
    factor: 6,
    domain: {x : [0,1000], y: [0,2000]}

};

window.stat =
{
    windowSize: function()
    {
        if(!window.config)
        {
            return 0;
        }
        var lvl_size = this.levelSize();
        var avs = window.config.active_window_size;
        if(avs < lvl_size)
            return avs;
        return lvl_size;
    },

    levelTiles:function(lvl)
    {
        if(!window.config) return 0;
        lvl = lvl | window.icfg.current.level;
        var max = window.config.levels - 1;
        var diff = max - lvl;

        var num = window.config.size/window.config.tile_size;
        for(var i = 0; i < diff; i++)
        {
            num = Math.ceil(num/window.config.tile_size);
        }
        return num;
    },

    /**
     * Returns Domain Size of one Tile
     * @param lvl - On which level
     * @returns {number}
     */
    levelTileSize: function (lvl) {
        lvl = lvl | window.icfg.current.level;
        var max = window.config.levels - 1;
        var diff = max - lvl;
        return Math.pow(window.config.tile_size, diff);
    },

    logging: function() {
        console.log.apply(console, arguments);
    },

    convertToTile: function(position, curr_lvl)
    {
        if(!window.config) return 0;
        curr_lvl = curr_lvl | window.icfg.current.level;
        var size = window.config.size;
        var lvl_tiles = this.levelSize(curr_lvl);
        console.log("TILES: %d, diff: %d", lvl_tiles, size/lvl_tiles);

        var tile_pos = position / (size / lvl_tiles);
        return Math.floor(tile_pos);
    },

    tileToPosition: function(lvl, index)
    {
        if(!window.config) return 0;

    },

    domainXSize : function()
    {
        var domain = window.icfg.domain;
        return domain.x[1] - domain.x[0];
    },

    domainYSize : function () {
        var domain = window.icfg.domain;
        return domain.y[1] - domain.y[0];
    },

    domainXToTiles : function()
    {
        var tiles = this.domainXSize() / this.levelTileSize();
        return tiles;
    }

};


function ConnectionManager(host)
{
    this.wsocket = new WebSocket(host);
    var _this = this;
    this.log = new SimpleLogger();

    this.wsocket.onopen = function(event)
    {
        _this.log.info("[INFO] WebSocket connected to " + host);
    };

    this.wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data);

        switch (message.type)
        {
            case "tile":
                _this.receivedTile(message);
                break;

            case "config":
                _this.updateConfig(message);
                _this.log.debug("[DEBUG] Received config message.", message);
                break;
        }
    };

    this.wsocket.onerror = function(event)
    {
        var message = event.data
        _this.log.error("[ERROR] -- WEBSOCKET:  " +  message)
    };

    this.wsocket.onclose = function(event)
    {
        _this.log.info("[INFO] Websocket closed connection.")
    };

    this.receivedTile = null;

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
}



function WindowDataHolder(level)
{
    var minTile = 0;
    var maxTile = 0;
    this.level = level;
    this.data = [];
    this.log = window.stat.logging();

    this.addTilesBuff = function(beg_index, end_index)
    {
        var p_winsize = minTile - maxTile;

        var diff_begin = beg_index - minTile;

        var min_t = minTile;
        var max_t = maxTile;

        minTile = beg_index;
        maxTile = end_index;

        if(Math.abs(diff_begin) >= p_winsize)
        {
            // NEW WINDOW
            this.delete(minTile, maxTile);
            this.data = this.buildData(beg_index, end_index);
            return;
        }

        if(beg_index < min_t)
        {
            this.dataAquire(beg_index, min_t);
            var new_data = this.buildData(beg_index, min_t);
            this.data = new_data.join(this.data);
        }else
        {
            this.delete(beg_index, min_t);
            this.shrinkDataBegin(beg_index - min_t);
        }

        if(end_index > max_t)
        {
            this.dataAquire(max_t, end_index);
            var new_data = this.buildData(max_t, end_index);
            this.data.join(new_data);
        }
        else
        {
            this.delete(max_t, end_index);
            this.shrinkDataEnd(max_t - end_index);
        }
        
    };

    this.dataAquire = function(from, to)
    {
        for(var i = from; i < to; i++)
        {
            this.level.requestTile(i);
        }
    };

    this.buildData = function(from, to)
    {
        return data;
    };

    this.buildRaw = function(from, to)
    {
        var data = null;
        for(var i = from; i < to; i++) // IterateTiles
        {
            var tile = this.level.getTile(i);
        }
    };

    this.buildLevels = function(from, to)
    {
        var chans = this.level.channels;
        var data = new Array(chans);
        for(var i = from; i < to; i++) // Iterate Tiles
        {
            var tile = this.level.getTile()
        }
    };

    this.delete = function(begin, end)
    {
        this.log.info("[INFO] Deleting tiles from [%d, %d].", begin, end);
        this.level.deleteTiles(begin, end);
    };
    
    this.shrinkDataBegin = function (count)
    {
        var delc = count * window.config.tile_size;
        var size = this.data.length;
        this.data = this.data.slice(delc, size);
        this.log.debug("[DEBUG] New size after slice: %d - %d  vs  %d.", this.data.length, this.data.length/ 10, count);
    };

    this.shrinkDataEnd = function (count)
    {
        var delc = count * window.config.tile_size;
        var size = this.data.length;
        this.data = this.data.slice(0, size - delc);
        this.log.debug("[DEBUG] New size after slice: %d - %d  vs  %d.", this.data.length, this.data.length/ 10, count);
    };

    this.getData = function()
    {
        return this.data;
    };
    
}

function WindowLevel(level, connection)
{
    var lvl_size = window.stat.levelTiles(level);
    this.tiles = new Array(lvl_size);
    this.curr = window.icfg.current;
    this.level = level;
    this.connection = connection;
    var _this = this;
    this.log = new SimpleLogger();
    this.window_size = function() { return this.interval.end - this.interval.beg; } ;
    this.interval = {beg: 0, end: window.stat.windowSize()};
    this.prev_interval = {beg: 0, end: 0};


    this.saveInterval = function()
    {
        this.prev_interval = this.interval;
    };

    this.updateInterval = function(interval)
    {
        this.saveInterval();
        this.interval = interval;
    };


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
    }


    this.windowSize = window.stat.windowSize;

    this.upIndex = function(index)
    {
        if(!index)
        {
            index = _this.curr.index ;
        }
        var up = index + _this.window_size();
        return (up >= this.levelSize()) ? this.levelSize() : up;
    };

    this.lowIndex = function (index) {
        if(!index) { index = _this.curr.index ;}
        var min = this.levelSize() - _this.window_size();
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

        if(this.raw)
        {
            var tile = new Array(data.length);
            for (var i = 0; i < data.length; i++) { // each channel
                tile[i] = new Array(2);
                tile[i][0] = data[i];
                for(var i = window.stat.
            }

        }


        _this.tiles[index] = data;
    };

    this.requestTile = function(index)
    {
        if(!this.getTile(index))
        {
            if(index < this.levelSize() && index >= 0)
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

    this.getWindowData = function(index, callback)
    {
        var chan = window.config.channels;
        var data = new Array(chan);

        for(var n = 0; n < chan; n++) { // PRECHADZAJ CHANELLY
            if(_this.level == (window.config.levels - 1))
            {
                //RAW_DATA
                data[n] = [];
            }else{
                //NO_RAW_DATA
                data[n] = new Array(2);
                data[n][0] = [];
                data[n][1] = [];
            }
        }

        var treshold = 20;


        var interval = setInterval(function() {
            var i = 0;
            var tile = null;
            var w_size = _this.window_size();
            var l_index = _this.lowIndex();
            var u_index = _this.upIndex();

            for(i = 0; i < w_size; i++)
            {
                var t_index= _this.lowIndex() + i;
                tile = _this.tiles[t_index];
                if(!tile)
                {
                    _this.log.info("[INFO] No tile: %d.", t_index );
                }
            }

            clearInterval(interval);
            for(i = l_index; i < u_index; i++) { // PRECHADZAJ TILES
                tile = _this.tiles[i];
                if(tile)
                {

                    for(var n = 0; n < chan; n++) { // PRECHADZAJ CHANELLY
                        var ch = tile[n];
                        if(_this.level == (window.config.levels - 1))
                        {
                            //RAW_DATA
                            data[n] = data[n].concat(ch);
                        }else{
                            //NO_RAW_DATA
                            data[n][0] = data[n][0].concat(ch[0]); // MIN
                            data[n][1] = data[n][1].concat(ch[1]); // MAX
                        }
                    }


                }else
                {
                    _this.log.error("[ERROR] Tile fault on index: " + i);
                }
            }

            if(callback)
                callback(data);

            return data;
        }, 100);
    };

    this.getTile = function(index)
    {
        if(index < 0 || index > this.levelSize()) return null;
        return this.tiles[index];
    };

    this.toTile = function(index)
    {
        var direction = (index - this.curr.index);
        this.moveTile(direction);
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
        else if(sum >= (this.levelSize() - this.window_size))
        {
            n_index = this.levelSize() - this.window_size;
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


    this.levelSize = function () {
        return this.tiles.length;
    };
}


function requireVar(variable, callback)
{
    var interval = setInterval(function() {
        if (variable) {
            clearInterval(interval);
            callback();
        }
    }, 100);
}


/**
 *
 * @param host - remote server with data
 * @param drawer - d3 handle to draw data
 * @constructor
 */

function ApplicationManager(host, drawer)
{
    this.connection = new ConnectionManager(host);
    this.current = window.icfg.current;
    window.config = null;
    this.log = new SimpleLogger();

    var _this = this;
    this.drawer = drawer;

    this.host = host || "ws://locahost:10888";
    this.levels = null;

    var interval = setInterval(function() {
        if (window.config) {
            clearInterval(interval);
            _this.initLevels();
            _this.drawer.requestWindowSize();
            _this.calculateWindowSize();
        }
    }, 100);


    this.calculateWindowSize = function(width)
    {
        var wc = window.config;
        width = width | wc.client_width();
        var t_size = wc.tile_size;
        var tiles = Math.floor( width / (window.icfg.factor * t_size) );
        _this.log.debug("[DEBUG] Tiles in window: ", tiles);
        wc.active_window_size = tiles;
        _this.levels[_this.current.level].loadBuffer();
        _this.draw();
    };


    this.initLevels = function()
    {
        _this.levels = new Array(window.config.levels);
        for(var i = 0 ; i < _this.levels.length; i++)
        {
            this.levels[i] = new WindowLevel(i, this.connection);
        }
    };

    this.countLevelSize = window.stat.levelTiles;



    this.contains = function(level, index)
    {

        if(!_this.levels)
        {
            this.log.warning("[WARNING] Levels are not init.");
            return false;
        }
        if(_this.levels[level])
        {
            return _this.levels[level].getTile(index) != null;
        }
        return false;
    };

    this.addTile = function(level, index, data)
    {
        if(level < 0 || level >= this.levels.length) return;
        var lvl_size = this.countLevelSize(level);
        var lvl = this.levels[level];
        if(!lvl)
        {
            this.levels[level] = new WindowLevel(level, lvl_size);
        }
        lvl.addTile(index, data);
        lvl.requestTiles = this.connection.getTile;
    };

    this.connection.receivedTile = function(message)
    {
        _this.addTile(message.level, message.index, message.data);
    };


    this.moveTile = function(dir_num)
    {
        this.levels[this.current.level].moveTile(dir_num);
        this.draw();
    };

    this.moveTo = function(level, index)
    {
        level = level | this.current.level;
        index = index | this.current.index;

        if(level < 0) this.current.level = 0;
        if(level >= this.levels.length) level = this.levels.length - 1;

        this.current.level = level;
        _this.levels[level].toTile(index);
        this.draw();
    };

    this.draw = function()
    {

        var level = this.levels[this.current.level];
        level.getWindowData(null, function(win_data){
            _this.log.debug("[DEBUG] Drawing Data: ", win_data);
                _this.drawer.drawData(win_data);
            });

    };

    this.toRange = function(x_min, x_max)
    {
        var beg_tiles = window.stat.convertToTile(x_min),
            end_tiles = window.stat.convertToTile(x_max) +1;

        _this.levels[this.current.level].getInterval(beg_tiles, end_tiles);

    };

    this.getTile = function(level, index)
    {
        var number_tiles = window.config.size / window.config.tile_size;
        if(level >=  window.config.levels)
        {
            _this.log.info("[INFO] Reached maximum level ", this.current);
            return;
        }
        else if (level < 0)
        {
            _this.log.info("[INFO] Reached minimum level ", this.current);
            return;
        }
        if(index >= number_tiles)
        {
            _this.log.info("[INFO] Reached maximum index ", this.current);
            return;
        }
        else if (index < 0)
        {
            _this.log.info("[INFO] Reached minimum index ", this.current);
            return;
        }
        this.current.level = level;
        var lvl = this.levels[level];
        lvl.toTile(index);

        _this.log.info("[INFO] Current index [%d] ", this.current);

        var cont = this.contains;
        if(!cont(level, index))
        {
            this.connection.getTile(level, index);
        }
    };

    this.moveLevel = function(dir_lvl, tile_no)
    {
        var prev = this.current.level;

        tile_no = tile_no | this.current.index;

        var lvl_size = window.stat.levelTiles(prev);

        var oneTile = Math.floor(window.config.size / lvl_size);
        var n_pos = oneTile * tile_no;
        this.log.debug("[DEBUG] New Tile pos: [%d, %d] ", this.current.level, n_pos);
        this.moveToPosition(dir_lvl, n_pos);
    };

    this.move = function(dir_lvl, dir_tile)
    {
        var d_lvl = this.current.level + dir_lvl;
        var d_tl = this.current.index + dir_tile;
        if(dir_lvl == 0) this.moveTile(dir_tile);
        else if(dir_tile == 0) this.moveLevel(dir_lvl);
        else this.moveTo(d_lvl, d_tl);
    };

    this.moveToPosition = function(dir, pos)
    {
        var new_level = this.current.level + dir;

        if(new_level < 0) new_level = 0;
        else if(new_level >= this.levels.length - 1)
            new_level = this.levels.length - 1;

        this.current.level = new_level;
        this.current.index = window.stat.convertToTile(pos);
        this.log.warning("[INFO] moveToPosition - New position [%d, %d].", this.current.level, this.current.index);
        this.moveTile(0);
    };
};

