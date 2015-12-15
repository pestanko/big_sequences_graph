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
        this.log = Logger;
        this.drawer = drawer;
        this.host = host || "ws://localhost:10888";
        this.levels = null;


        // Global Variable containing configuration from server
        window.config = null;

        this.connection.receivedTile = add_tile_intern;

        // self pointer
        var _this = this;

        /**
         * Reconnects to WS Server
         */
        this.connect = function (host)
        {
                host = host || this.host;
		window.config = null;
                this.connection = new ConnectionManager(host);
        };

        /**
         * Gets current level
         * @returns {WindowLevel}
         */
        this.currLvl = function ()
        {
                return this.levels[this.current.level];
        };

        /**
         * Gets current low index of tile
         * @returns {*}
         */
        this.currIndex = function ()
        {
                return this.currLvl().lowIndex();
        };

        /**
         * Load buffer of current level and call draw
         */
        this.internal_load = function ()
        {
                if (!this.levels) {
                        return;
                }

                _this.currLvl().loadBuffer();
                _this.draw();
        };

        /**
         * Interval that waits for window config.
         * @type {number}
         */
        var interval = setInterval(
            function ()
            {
                    if (window.config) {
			    console.log(window.config);
                            clearInterval(interval);
                            _this.drawer.requestWindowSize();
                            _this.calculateWindowSize();
                            _this.initLevels();
                            _this.internal_load();
                            _this.movePos(0);
                    }
            }, 100);

        /**
         * Gets level on spec. index
         * @param index - level index
         * @returns {*}
         */
        this.getLevel = function (index)
        {
                var levels = this.levels;

                if (index < 0) {
                        return null;
                }

                if (index >= levels.length) {
                        return null;
                }

                return levels[index];
        };

        /**
         * Window size for spec. width - calculate by draw window size - pixels
         * @param width - Width in pixels
         */
        this.calculateWindowSize = function (width)
        {
                var wc = window.config;
                width = width | wc.client_width();
                var t_size = wc.tile_size;
                var factor = (window.icfg.factor);
                // How many pixels on one tile
                var tiles = Math.floor(width / (factor * t_size));
                this.log.info("Tiles vs Data vs Width : [%d, %d ,%d]", tiles, factor * t_size, width);
                _this.log.debug("[DEBUG] Tiles in window: ", tiles);
                wc.active_window_size = tiles;
        };

        /**
         * Initializes levels
         */
        this.initLevels = function ()
        {
                _this.levels = new Array(window.config.levels);

                for (var i = 0; i < _this.levels.length; i++) {
                        var windowLevel = new WindowLevel(i, this);
                        this.levels[i] = windowLevel;
                        windowLevel.moveLevel = this.moveLevel;
                }
        };

        /**
         * Calculates how many tiles are on spec. level
         * @type {Function}
         */
        this.countLevelSize = window.stat.levelTiles;

        /**
         * Function that test if tile on spec. level and index exists and is loaded
         * @param level
         * @param index
         * @returns {boolean} - if exists true, else false
         */
        this.contains = function (level, index)
        {
                if (!_this.levels) {
                        this.log.warn("[WARNING] Application is not ready.");
                        return false;
                }

                if (_this.levels[level]) {
                        return _this.levels[level].getTile(index) != null;
                }

                return false;
        };

        /**
         * Adds tile to level spec, on spec. index, with spec. data and with flag if it is raw
         * @param level
         * @param index
         * @param data
         * @param raw
         */
        this.addTile = function (level, index, data, raw)
        {
                raw = raw || false;
                if (level < 0 || level >= this.levels.length) return;

                var lvl = this.levels[level];
                lvl.raw = raw;
                lvl.addTile(index, data);
        };

        /**
         * Intern function to add file
         * @param message
         */
        function add_tile_intern(message)
        {
                _this.addTile(message.level, message.index, message.data, message.raw);
        }


        /**
         * When arrives multiple tiles.
         * Implementation of connection manager method pointer.
         * @param message - message containing tiles data and info
         */
        this.connection.receivedTiles = function (message)
        {
                var level = message.level;
                var beg = message.beg;
                var end = message.end;
                var data = message.data;
                var raw = message.raw;
                var j = 0;

                for (var i = beg; i < end; i++) {
                        _this.addTile(level, i, data[j], raw);
                        j++;
                }
        };

        /**
         * Moving by tile
         * @param dir_num
         */
        this.moveTile = function (dir_num)
        {
                this.currLvl().moveTile(dir_num);
                this.draw();
        };

        /**
         * Move to specified index
         * @param level
         * @param index
         */
        this.moveTo = function (level, index)
        {
                level = level | this.current.level;
                index = index | this.currIndex();

                if (level < 0) this.current.level = 0;
                if (level >= this.levels.length) level = this.levels.length - 1;

                this.current.level = level;
                this.levels[level].toTile(index);
                this.draw();
        };

        /**
         * Draws graph from current level
         */
        this.draw = function ()
        {
                var level = this.levels[this.current.level];
                this.drawer.drawLevel(level);
        };


        /**
         * Move to level
         * @param dir_lvl - negative - level up, positive - level down
         */
        this.moveLevel = function (dir_lvl)
        {
                _this.moveToPosition(dir_lvl);
        };

        /**
         * TODO
         * @param dir
         */
        this.stepLevel = function (dir)
        {
                this.moveLevelClean(dir);
                this.movePos(0);
        };

        /**
         * Move function - move level and tile
         * @param dir_lvl - direction level
         * @param dir_tile - direction index
         */
        this.move = function (dir_lvl, dir_tile)
        {
                var d_lvl = this.currIndex() + dir_lvl;
                var d_tl = this.currIndex() + dir_tile;

                if (dir_lvl == 0) {
                        this.moveTile(dir_tile);
                }
                else if (dir_tile == 0) {
                        this.moveLevel(dir_lvl);
                }
                else {
                        this.moveTo(d_lvl, d_tl);
                }
        };

        /**
         * Move to position with drawing
         * @param dir
         */
        this.movePos = function (dir)
        {
                var rev = this.drawer.transformXCoord(dir);
                this.log.debug("(movePos): Moving by [%d] -> [%d]", dir, rev);
                this.currLvl().moveVariable(rev, rev);
                this.draw();
        };

        /**
         * Move to position with drawing
         * @param dir
         */
        this.movePosNoDraw = function (dir)
        {
                var rev = this.drawer.transformXCoord(dir);
                this.log.debug("(movePosNoDraw): Moving by [%d] -> [%d]", dir, rev);
                this.currLvl().moveVariable(rev, rev);
        };

        /**
         * Helper function - move with cleaning leves
         * @param dir - direction to move
         */
        this.moveLevelClean = function (dir)
        {
                var new_level = this.current.level + dir;

                if (new_level < 0) {
                        new_level = 0;
                }
                else if (new_level >= this.levels.length - 1) {
                        new_level = this.levels.length - 1;
                }

                for (var i = 1; i < _this.levels.length; i++) {
                        var lev = _this.levels;
                        if ((i + 1) > new_level || (i - 1) < new_level) {
                                this.log.info("[DELETE] - Deleting level [%d].", i);
                                lev[i] = null;
                                lev[i] = new WindowLevel(i, this, false);
                        }
                }

                this.current.level = new_level;
        };

        /**
         * Move to position
         * @param dir - direction
         */
        this.moveToPosition = function (dir)
        {
                this.moveLevelClean(dir);
                this.currLvl().moveScaled(dir);
                this.log.info("[INFO] moveToPosition - New position [%d, %d].", this.current.level, this.currIndex());
                this.draw();
        };

        /**
         * Scale by axis X
         * @param dir
         */
        this.scaleX = function (dir)
        {
                var scl = this.drawer.scaleX(dir);
                this.drawer.drawLevel();
                this.currLvl().scale(scl);
        };

        /**
         * Scale by axis Y
         * @param dir
         */
        this.scaleY = function (dir)
        {
                this.drawer.scaleY(dir);
        };

        /**
         * Reload View - no load data
         */
        this.reload = function ()
        {
                this.drawer.reload();
        };

        this.loadlevel = function(dir)
        {
                var new_level = this.current.level + dir;
                if (new_level < 0) {
                        new_level = 0;
                }
                else if (new_level >= this.levels.length - 1) {
                        new_level = this.levels.length - 1;
                }

                this.levels[new_level].loadBuffer();

        }

}

