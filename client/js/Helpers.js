/**
 * Created by wermington on 9/7/15.
 */


/**
 * Internal config of application
 * @type {{current: {level: number, index: number}, factor: number, domain: {x: number[], y: number[]}}}
 */
window.icfg =
{
    current: {level: 0},
    factor: 3,
    domain: {x : [0,1000], y: [0,2000]},
    threshold: 20,
    position: {beg: 0, end: 0}
};


/**
 * Internal global helper functions based on global configureation
 * @type {{windowSize: Function, levelTiles: Function, levelTileSize: Function, logging: Function, convertToTile: Function, tileToPosition: Function, domainXSize: Function, domainYSize: Function, domainXToTiles: Function}}
 */

window.stat =
{
    windowSize: function()
    {
        if(!window.config)
        {
            return 0;
        }
        var lvl_size = this.levelTiles();
        var avs = window.config.active_window_size;
        if(avs < lvl_size)
            return avs;
        return lvl_size;
    },

    levelTiles:function(lvl)
    {
        if(!window.config) return 0;
        lvl = lvl || window.icfg.current.level;
        var max = window.config.levels - 1;
        var diff = max - lvl;

        var num = window.config.size/window.config.tile_size;
        for(var i = 0; i < diff; i++)
        {
            num = Math.ceil(num/window.config.tile_size);
        }
        return num;
    },


    logging: function() {
        console.log.apply(console, arguments);
    },

    convertToTile: function(position, curr_lvl)
    {
        if(!window.config) return 0;
        curr_lvl = curr_lvl || window.icfg.current.level;
        var size = window.config.size;
        var lvl_tiles = this.levelTiles(curr_lvl);
        console.log("TILES: %d, diff: %d", lvl_tiles, size/lvl_tiles);

        var tile_pos = position / (size / lvl_tiles);
        return Math.floor(tile_pos);
    },

    tileToPosition: function(lvl, index)
    {
        if(!window.config) return 0;
        var max = window.config.levels;
        var diff = max - lvl;
        return (Math.pow(window.config.tile_size, diff)) * index;
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

/**
 *  Simple logging tool for application
 * @constructor
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