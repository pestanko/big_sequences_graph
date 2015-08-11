/**
 * Created by wermington on 12.7.2015.
 */


function TilesHolder()
{
    this.levels = {};
    var _this = this;
    this.addTile = function(level, index, data)
    {
        if(this.levels[level] == null)
        {
            this.levels[level] = {};
        }
        //console.log("Adding pos [" + level + ", " + index +"]: " + data);
        this.levels[level][index] = data;
    };

    this.removeTile = function(level, index)
    {
        if(this.levelsp[level] == null) return;
      this.levels[level][index] = null;
    };

    this.removeLevel = function(level)
    {
        if(this.levels[level] == null) return;
        this.levels[level] = null;
    };

    this.getTile = function(level, index)
    {
        if(this.levels[level] == null) return null;
        return this.levels[level][index];
    };

    this.contains = function(level, index)
    {
        return _this.getTile(level, index) != null;
    };
};


function ActiveHolder(max_levels, tile_size)
{
    this.levels = new Array(max_levels);
    for(var i = 0; i < max_levels; i++)
    {
        this.levels[i] = {};
    }
    this.tile_size = tile_size;
    var _this = this;
    var _tile_add = 0;
    var _tile_add_lim = 5;
    var _level_limit = 10;



    this.addTile = function(level, index, data)
    {
        if(level < 0 || level > this.levels.length) {
            console.log("Level is out of range");
            return;
        }
        _tile_add++;

        if(_tile_add == _tile_add_lim)
        {
            console.log("~~~~~~~~~~~~Calling safe remove");
            this.safeRemove(level, index);
            _tile_add = 0;
        }

        console.log("Adding tile at [" + level + ", " + index +"].");
        this.levels[level][index] = data;
    };


    this.safeRemove = function(level, index)
    {
        for( var i = 0 ; i < this.levels.length; i++) {

            var lvl = this.levels[i];
            if (i - 1 == level) {
                // PREVIOUS_LEVEL
                // TODO
            }
            else if (i + 1 == level) {
                // NEXT_LEVEL
                // TODO
            } else if (i == level) {
                var rem_tiles = [];
                for (var property in lvl) {
                    if (lvl.hasOwnProperty(property)) {
                        var prop = parseInt(property);
                        var limit = (_level_limit / 2);
                        if (prop <  index -limit || prop > (limit + index)) {
                            rem_tiles.push(property);
                            delete lvl[property];
                        }
                    }
                }
                console.log("Removing tiles at level %d: ", i, rem_tiles);
            }else
            {
                console.log("REMOVING level");
                this.levels[i] = null;
            }
        }
    };
    
    this.nextLevelMove = function (index) {
        return index * tile_size;
    };


    this.level_size = function(index)
    {
        return Math.pow(tile_size, index);
    };


    this.removeTile = function(level, index)
    {
        if(this.levels[level] == null) return;
        var tile = this.getTile(level, index);
        this.levels[level][index] = null;
        return tile;
    };

    this.removeLevel = function(level)
    {
        if(this.levels[level] == null) return;
        this.levels[level] = null;
    };

    this.getTile = function(level, index)
    {
        return this.levels[level][index];
    };

    this.contains = function(level, index)
    {
        return _this.getTile(level, index) != null;
    };
};



/**
 *
 * @param host - remote server with data
 * @param holder -
 * @param drawer - d3 handle to draw data
 * @constructor
 */

function ApplicationManager(host, drawer)
{
    this.wsocket = new WebSocket(host);
    this.current = {level: 0, pos: 0};
    this.config = {};

    var _this = this;
    this.drawer = drawer;

    this.host = host || "ws://locahost:10888";
    this.holder = null;

    var open = false, ready = false;

    this.isReady = function()
    {
        return ready;
    };

    this.init_holder = function () {
        this.holder = new ActiveHolder(this.config.levels, this.config.tile_size);
    };

    this.isOpen = function()
    {
        return open;
    };

    this.wsocket.onopen = function(event)
    {
        console.log("Websocket connected to " + host);
        open = true;
    };


    this.wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data)

        switch (message.type)
        {
            case "tile":
                console.log("Received tile message.");
                _this.receivedTile(message);
                break;

            case "config":
                _this.updateConfig(message);
                console.log("Received config message.", message);
                ready = true;
                _this.init_holder();
                _this.moveTo(_this.current.level, _this.current.pos);
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


    this.receivedTile = function(message)
    {
        this.holder.addTile(message.level, message.index, message.data);
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

    this.updateConfig = function(message)
    {

        this.config = {
            x_axis: message.x_axis,
            y_axis: message.y_axis,
            levels: message.levels,
            tile_size: message.tile_size,
            size: message.size
        };

        console.log("Updated config: " + this.config);
    };

    this.moveTile = function(dir_num)
    {
        var number_tiles = this.config.size / this.config.tile_size;
        var cnum = this.current.pos;
        var lvl = this.current.level;
        var sum_res = cnum + dir_num;

        if(sum_res < 0)
        {
            console.log("Reached minimum pos ", this.current);
            return;
        }

        else if(sum_res >= number_tiles)
        {
            console.log("Reached maximum pos ", this.current);
            return;
        }


        this.current.pos += dir_num;

        this.moveTo(this.current.level, this.current.pos);


    };

    this.moveTo = function(level, pos)
    {
        var number_tiles = this.config.size / this.config.tile_size;
        this.config.levels = 2;
        if(level >=  this.config.levels)
        {
            console.log("Reached maximum level ", this.current);
            return;
        }
        else if (level < 0)
        {
            console.log("Reached minimum level ", this.current);
            return;
        }
        if(pos >= number_tiles)
        {
            console.log("Reached maximum pos ", this.current);
            return;
        }
        else if (pos < 0)
        {
            console.log("Reached minimum pos ", this.current);
            return;
        }
        this.current.level = level;
        this.current.pos = pos;

        console.log("Current pos ", this.current);

        var cont = this.holder.contains;

        if(!cont(level, pos))
        {
            this.getTile(level, pos);
        }

        var intvl = setInterval(function() {
            if (cont(level, pos)) {
                clearInterval(intvl);
                //console.log("Ready to draw pos ", _this.current);
                _this.drawer.updateTile(_this.holder.getTile(level, pos));
            }
        }, 100);




    };

    this.moveLevel = function(dir_lvl, number)
    {
        var number_tiles = this.config.size / this.config.tile_size;
        var cnum = this.current.pos;
        var lvl = this.current.level;

        var lvl_sum = lvl + dir_lvl;

        if(lvl_sum >=  this.config.levels)
        {
            console.log("Reached maximum level ", this.current);
            return;
        }
        else if (lvl_sum < 0)
        {
            console.log("Reached minimum level ", this.current);
            return;
        }

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
                this.current.pos = number * number_tiles;
            }
        }


    };


};

function test()
{
    console.log("Running test...");
    var tm = new TilesHolder(null);
    var ws = new ApplicationManager("ws://localhost:10888", tm);
}

//test();

