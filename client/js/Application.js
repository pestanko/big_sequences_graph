/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */




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
    this.log = Logger;

    var _this = this;
    this.drawer = drawer;

    this.host = host || "ws://localhost:10888";
    this.levels = null;

    this.currLvl = function()
    {
        return this.levels[this.current.level];
    };

    this.currIndex = function()
    {
        return this.currLvl().lowIndex();
    };

    this.internal_load = function()
    {
        if(!this.levels)
        {
            return;
        }
        _this.currLvl().loadBuffer();
        _this.draw();
    };

    var interval = setInterval(function() {
        if (window.config)
        {
            clearInterval(interval);
            _this.drawer.requestWindowSize();
            _this.calculateWindowSize();
            _this.initLevels();
            _this.internal_load();
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
    };


    this.initLevels = function()
    {
        _this.levels = new Array(window.config.levels);
        for(var i = 0 ; i < _this.levels.length; i++)
        {
            var windowLevel = new WindowLevel(i, this.connection);
            this.levels[i] = windowLevel;
            windowLevel.moveLevel = this.moveLevel;

        }

    };

    this.countLevelSize = window.stat.levelTiles;

    this.contains = function(level, index)
    {
        if(!_this.levels)
        {
            this.log.warn("[WARNING] Application is not ready.");
            return false;
        }

        if(_this.levels[level])
        {
            return _this.levels[level].getTile(index) != null;
        }
        return false;
    };

    this.addTile = function(level, index, data, raw)
    {
        raw = raw || false;
        if(level < 0 || level >= this.levels.length) return;
        var lvl_size = this.countLevelSize(level);
        var lvl = this.levels[level];
        lvl.raw = raw;
        lvl.addTile(index, data);
        lvl.requestTiles = this.connection.getTile;
    };

    var add_tile_intern = function(message)
    {
        _this.addTile(message.level, message.index, message.data, message.raw);
    };

    this.connection.receivedTile = add_tile_intern;

    this.connection.receivedTiles = function(message)
    {
        message.forEach(function(msg){
            add_tile_intern(msg);
        });
    };


    this.moveTile = function(dir_num)
    {
        this.currLvl().moveTile(dir_num);
        this.draw();
    };

    this.moveTo = function(level, index)
    {
        level = level | this.current.level;
        index = index | this.currIndex();

        if(level < 0) this.current.level = 0;
        if(level >= this.levels.length) level = this.levels.length - 1;

        this.current.level = level;
        _this.levels[level].toTile(index);
        this.draw();
    };

    this.draw = function()
    {
        var level = this.levels[this.current.level];
        this.drawer.drawLevel(level);
    };


    this.getTile = function(level, index)
    {
        var number_tiles = window.config.size / window.config.tile_size;
        if(level >=  window.config.levels)
        {
            _this.log.info("[INFO] Reached maximum level [%d]", this.current.level);
            return;
        }
        else if (level < 0)
        {
            _this.log.info("[INFO] Reached minimum level [%d]", this.current.level);
            return;
        }
        if(index >= number_tiles)
        {
            _this.log.info("[INFO] Reached maximum index [%d]", this.currIndex());
            return;
        }
        else if (index < 0)
        {
            _this.log.info("[INFO] Reached minimum index [%d]", this.currIndex());
            return;
        }
        this.current.level = level;
        var lvl = this.levels[level];
        lvl.toTile(index);

        _this.log.info("[INFO] Current  index [%d] ", this.currIndex());

        var cont = this.contains;
        if(!cont(level, index))
        {
            this.connection.getTile(level, index);
        }
    };

    this.moveLevel = function(dir_lvl)
    {
        _this.moveToPosition(dir_lvl);
    };

    this.move = function(dir_lvl, dir_tile)
    {
        var d_lvl = this.currIndex() + dir_lvl;
        var d_tl = this.currIndex() + dir_tile;
        if(dir_lvl == 0) this.moveTile(dir_tile);
        else if(dir_tile == 0) this.moveLevel(dir_lvl);
        else this.moveTo(d_lvl, d_tl);
    };

    this.movePos = function(dir)
    {
        this.currLvl().moveVariable(dir, dir);
        this.draw();
    };

    this.moveToPosition = function(dir)
    {
        var new_level = this.current.level + dir;

        if(new_level < 0) new_level = 0;
        else if(new_level >= this.levels.length - 1)
            new_level = this.levels.length - 1;


        for (var i = 1; i < _this.levels.length; i++) {
            var lev = _this.levels;
            if( (i + 1) > new_level || (i - 1) < new_level)
            {
                this.log.info("[DELETE] - Deleting level [%d].", i);
                lev[i] = null;
                lev[i] = new WindowLevel(i, this.connection, false);
            }
        }


        this.current.level = new_level;
        this.currLvl().moveScaled(dir);
        this.log.info("[INFO] moveToPosition - New position [%d, %d].", this.current.level, this.currIndex());
        this.moveTile(0);
    };
}

