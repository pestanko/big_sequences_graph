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
    this.log = new SimpleLogger();

    var _this = this;
    this.drawer = drawer;

    this.host = host || "ws://locahost:10888";
    this.levels = null;

    this.currLvl = function()
    {
        return this.levels[this.current.level];
    };

    this.currIndex = function()
    {
        return this.currLvl().lowIndex();
    }

    this.internal_load = function()
    {
        if(!this.levels)
        {
            return;
        }
        _this.levels[_this.current.level].loadBuffer();
        _this.draw();
    };

    var interval = setInterval(function() {
        if (window.config) {
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
            this.levels[i] = new WindowLevel(i, this.connection);
        }

        _this.levels[_this.levels.length - 1].raw = true;
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


        tile_no = tile_no | this.currIndex();

        var lvl_size = window.stat.levelTiles(prev);

        var oneTile = Math.floor(window.config.size / lvl_size);
        var n_pos = oneTile * tile_no;
        this.log.debug("[DEBUG] New Tile pos: [%d, %d] ", this.currLvl(), n_pos);
        this.moveToPosition(dir_lvl, n_pos);
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

    };

    this.moveToPosition = function(dir, pos)
    {
        var new_level = this.current.level + dir;

        if(new_level < 0) new_level = 0;
        else if(new_level >= this.levels.length - 1)
            new_level = this.levels.length - 1;

        this.current.level = new_level;
        this.currLvl().moveTo(window.stat.convertToTile(pos));
        this.log.warning("[INFO] moveToPosition - New position [%d, %d].", this.current.level, this.currIndex());
        this.moveTile(0);
    };
};

