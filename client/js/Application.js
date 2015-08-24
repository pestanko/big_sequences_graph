/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */

function ConnectionManager(host)
{
    this.wsocket = new WebSocket(host);
    var _this = this;

    this.wsocket.onopen = function(event)
    {
        console.log("Websocket connected to " + host);
    };

    this.wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data)

        switch (message.type)
        {
            case "tile":
                _this.receivedTile(message);
                break;

            case "config":
                _this.updateConfig(message);
                console.log("Received config message.", message);
                break;
        }
    };

    this.wsocket.onerror = function(event)
    {
        var message = event.data
        console.log("ERROR: " +  message)
    };

    this.wsocket.onclose = function(event)
    {
        console.log("Websocket closed connection")
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

        console.log("Updated config: " + window.config);
    };

    this.getTile = function(level, index)
    {
        console.log("Calling get tile for [%d, %d]", level, index);
        var message =
        {
            type: "get",
            level: level,
            index: index
        };

        this.wsocket.send(JSON.stringify(message));
    };
}


function WindowLevel(level, lvl_size, connection)
{
    this.tiles = new Array(lvl_size);
    this.index = 0;
    this.level = level;
    this.connection = connection;
    var _this = this;

    this.windowSize = function() {
        return window.config.active_window_size;
    };

    this.upIndex = function(index)
    {
        if(!index) { index = _this.index ;}
        var up = index + _this.windowSize();
        return (up >= lvl_size) ? lvl_size : up;
    };

    this.lowIndex = function (index) {
        if(!index) { index = _this.index ;}
        var min = lvl_size - _this.windowSize();
        return (index > min) ? min : index;
    };

    this.lowBuffIndex = function(index)
    {
        if(!index) { index = this.index ;}
        var w_size = this.windowSize();
        var low_size = w_size * 2;
        var low = this.lowIndex(index) - low_size;
        return (low < 0) ? 0 : low;
    };

    this.upBuffIndex = function(index)
    {
        if(!index) { index = this.index ;}
        var w_size = this.windowSize();
        var up_size = w_size * 2;
        var up = this.upIndex(index) + up_size;
        return (up > lvl_size ) ? lvl_size : up;
    };

    this.addTile = function(index, data)
    {
        console.log("Adding tile [%d, %d].", level, index);
        _this.tiles[index] = data;
    };

    this.loadBuffer = function()
    {
        //noinspection JSUnusedAssignment
        var i = 0;
        for(i = this.lowIndex(); i < this.upIndex(); i++)
        {
            if(!this.getTile(i))
            {
                this.connection.getTile(level, i);
            }
        }

        for(i = this.lowBuffIndex(); i < this.lowIndex(); i++)
        {
            if(!this.getTile(i))
            {
                this.connection.getTile(level, i);
            }
        }

        for(i = this.upIndex(); i < this.upBuffIndex(); i++)
        {
            if(!this.getTile(i))
            {
                this.connection.getTile(level, i);
            }
        }
    };

    this.getWindowData = function(index, callback)
    {
        var chan = window.config.channels;
        var data = new Array(chan);

        for(var c = 0 ; c < chan; c++)
        {
            data[c] = [];
        }

        var interval = setInterval(function() {
            var i = 0;
            var tile = null;
            for(i = 0; i < _this.windowSize(); i++)
            {
                var t_index= _this.lowIndex() + i;
                tile = _this.tiles[t_index];
                if(!tile)
                {
                    console.log("Still no tile: %d.", t_index );
                    return;
                }
            }

            clearInterval(interval);
            for(i = _this.lowIndex(); i < _this.upIndex(); i++) {
                tile = _this.tiles[i];
                if(tile)
                {
                    for(var n = 0; n < chan; n++) {
                        var ch = tile[n];
                        data[n] = data[n].concat(ch);
                    }
                }else
                {
                    console.log("Tile fault on index: " + i);
                }
            }

            if(callback)
                callback(data);

            return data;
        }, 100);
    };

    this.getTile = function(index)
    {
        if(index < 0 || index > lvl_size) return null;
        return this.tiles[index];
    };

    this.toTile = function(index)
    {
        var direction = (this.index - index);
        this.moveTile(direction);
    };

    this.moveTile = function(direction)
    {
        var sum = this.index + direction;
        var oldIndex = this.index;
        var n_index = 0;

        if(sum < 0)
        {
            n_index = 0;
        }
        else if(sum >= lvl_size)
        {
            n_index = lvl_size - this.windowSize();
        }
        else
        {
            n_index = sum;
        }

        this.index = n_index;
        var del =  { min: 0, max: 0};


        if(direction > 0)
        {
            del.min = this.lowBuffIndex(oldIndex);
            del.max = this.lowBuffIndex(n_index);
        }
        else
        {
            del.min = this.upBuffIndex(n_index);
            del.max = this.upBuffIndex(oldIndex);
        }

        console.log("~~~~~~~~~~~~~~~Min vs Max: [%d, %d]", del.min, del.max);

        for(var i = del.min; i < del.max; i++)
        {
            console.log("Delete tile [%d, %d]. ", level, this.index);
            this.tiles[i] = null;
        }

       this.loadBuffer();
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
    this.current = {level: 0};
    window.config = null;

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


    _this.calculateWindowSize = function(width)
    {
        var wc = window.config;
        width = width | wc.client_width();
        var t_size = wc.tile_size;
        var factor = 3;
        var tiles = Math.floor( width / (factor * t_size) );
        console.log("Tiles in window: ", tiles);
        wc.active_window_size = tiles;
        _this.levels[_this.current.level].loadBuffer();
        _this.draw();
    };


    this.initLevels = function()
    {
        _this.levels = new Array(window.config.levels + 1);
        for(var i = 0 ; i < _this.levels.length; i++)
        {
            this.levels[i] = new WindowLevel(i, this.levelSize(i), this.connection);
        }
    };

    this.levelSize = function(level)
    {
        var levels = window.config.levels;
        var lev = window.config.size/window.config.tile_size;
        return lev;
    };

    this.contains = function(level, index)
    {
        if(!_this.levels)
        {
            console.log("Levels are not init.");
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
        var lvl_size = this.levelSize(level);
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
        _this.levels[level].toTile(index);
        this.draw();
    };

    this.draw = function()
    {

        var level = this.levels[this.current.level];
        level.getWindowData(null, function(win_data){
                console.log("Drawing Data: ", win_data);
                var xax = {
                    begin: level.lowIndex()*window.config.tile_size
                };

                _this.drawer.drawData(win_data,xax);
            });

    };

    this.getTile = function(level, index)
    {
        var number_tiles = window.config.size / window.config.tile_size;
        window.config.levels = 2;
        if(level >=  window.config.levels)
        {
            console.log("Reached maximum level ", this.current);
            return;
        }
        else if (level < 0)
        {
            console.log("Reached minimum level ", this.current);
            return;
        }
        if(index >= number_tiles)
        {
            console.log("Reached maximum index ", this.current);
            return;
        }
        else if (index < 0)
        {
            console.log("Reached minimum index ", this.current);
            return;
        }
        this.current.level = level;
        var lvl = this.levels[level];
        lvl.toTile(index);

        console.log("Current index ", this.current);

        var cont = this.contains;
        if(!cont(level, index))
        {
            this.connection.getTile(level, index);
        }
    };

    this.moveLevel = function(dir_lvl, number)
    {
        var number_tiles = window.config.size / window.config.tile_size;

        this.current.level += dir_lvl;
        if(dir_lvl < 0)
        {
            //TODO
            // Compute back -> divide n-times
        }
        else
        {
            //TODO
            while(dir_lvl)
            {
                this.current.index = number * number_tiles;
            }
        }
    };
};

