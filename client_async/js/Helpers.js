/**
 * Created by Peter Stanko on 9/7/15.
 */

/**
 * Internal config of application
 * @type {{current: {level: number, index: number}, factor: number, domain: {x: number[], y: number[]}}}
 */
window.icfg =
{
        current  : {level: 0},
        factor   : 4,
        domain   : {x: [0, 1000], y: [0, 2000]},
        threshold: 20,
        position : {beg: 0, end: 1000000}
};

/**
 * Internal global helper functions based on global configuration
 * @type {{windowSize: Function, levelTiles: Function, levelTileSize: Function, logging: Function, convertToTile: Function, tileToPosition: Function, domainXSize: Function, domainYSize: Function, domainXToTiles: Function}}
 */

window.stat =
{
        /**
         * Calculates windows size in TILES on spec. level
         * @param lvl - Level
         * @returns {number}
         */
        windowSize: function (lvl)
        {
                if (!window.config) {
                        return 0;
                }

                lvl = lvl || window.icfg.current.level;
                var max = window.config.levels - 1;
                var diff = max - lvl;

                var num = window.config.size / window.config.tile_size;
                for (var i = 0; i < diff; i++) {
                        num = Math.ceil(num / window.config.tile_size);
                }

                var lvl_size = num;
                var avs = window.config.active_window_size;
                if (avs < lvl_size) {
                        return avs;
                }
                return lvl_size;
        },

        /**
         * Gets number of files on specific level
         * @param lvl
         * @returns {number}
         */
        levelTiles: function (lvl)
        {
                if (!window.config) return 0;
                lvl = lvl || window.icfg.current.level;

                var max = window.config.levels - 1;
                var num = window.config.size / window.config.tile_size;
                var diff = max - lvl;

                if (diff < 0) {
                        diff = 0;
                }

                for (var i = 0; i < diff; i++) {
                        num = Math.ceil(num / window.config.tile_size);
                }

                return num;
        },
        
        /**
         * Gets position and returns tile index
         * @param position
         * @param curr_lvl
         * @returns {number} - tile index
         */
        convertToTile: function (position, curr_lvl)
        {
                if (!window.config) return 0;
                curr_lvl = curr_lvl || window.icfg.current.level;

                var size = window.config.size;
                var max = window.config.levels - 1;
                var diff = max - curr_lvl;
                var num = window.config.size / window.config.tile_size;

                for (var i = 0; i < diff; i++) {
                        num = Math.ceil(num / window.config.tile_size);
                }

                var tile_pos = position / (size / num);

                return Math.floor(tile_pos);
        },

        /**
         * Gets tile index and returns position of starting element
         * @param lvl - Level
         * @param index - Index
         * @returns {number} - position of first element in tile
         */
        tileToPosition: function (lvl, index)
        {
                if (!window.config)
                        return 0;

                var max = window.config.levels;
                var diff = max - lvl;

                return (Math.pow(window.config.tile_size, diff)) * index;
        }
};
