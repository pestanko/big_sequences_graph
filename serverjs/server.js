/**
 * Created by Peter Stanko on 4.8.2015.
 */

fs = require("fs");
WebSocketServer = require("ws").Server;


function Application()
{
    this.wss = null;
    this.holder = new DataHolder();
    var _this = this;


    this.init_ws = function(port)
    {
        this.wss = new WebSocketServer({port: port});
        console.log("[INFO] Listening on port: " + port);
        this.wss.on('connection', function connection(ws)
            {
                console.log("[DEBUG] New connection.");
                ws.on('message', function incoming(data) {
                    var msg = JSON.parse(data);
                    switch(msg.type)
                    {
                        case "get":
                            console.log("[INFO] Received GET message.");
                            var res = _this.handleTileMsg(msg);

                            ws.send(JSON.stringify(res));

                            console.log("[DEBUG] Sended tile with index " + res.index);

                            break;
                        case 'get-tiles':
                            console.log("[INFO] Received GET-TILES message.");
                            var res = _this.handleTilesMsg(msg);
                            ws.send(JSON.stringify(res));
                            console.log("[DEBUG] Sended tiles interval [%d, %d] ", res.beg, res.end);
                            break;
                    }

                });

                var msg = _this.getCfgMsg();
                ws.send(JSON.stringify(msg));
            }
        );
    };

    this.handleTilesMsg = function(msg)
    {
        var level = msg.level;
        var beg = msg.beg;
        var end = msg.end;
        var raw = this.holder.levels[level].raw;
        var res_data = [];

        for(var i = beg ; i < end; i++)
        {
            res_data.push(_this.holder.getTileData(level, i));
        }

        var result =
        {
            type: 'tile-int',
            beg: beg,
            end: end,
            level: level,
            data: res_data,
            raw: raw
        };

        return result;
    };

    this.handleTileMsg = function(msg)
    {
        var level = msg.level;
        var index = msg.index;

        var data = _this.holder.getTileData(level, index);
        var raw = this.holder.levels[level].raw;

        var result =
        {
            type: 'tile',
            index: index,
            level: level,
            data: data,
            raw: raw
        };

        return result;

    };

    this.getCfgMsg = function ()
    {
        var msg =
        {
            type: "config",
            x_axis: _this.holder.x_axis,
            y_axis: _this.holder.y_axis,
            levels: _this.holder.levels_num,
            size: _this.holder.size,
            tile_size: _this.holder.tile_size,
            channels: _this.holder.chan_number
        };
        return msg;
    };


    this.run = function(port, path)
    {
        this.holder.loadData(path);
        this.init_ws(port);
    }
}



var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});




function DataHolder()
{
    this.levels = [];
    this.tiles = null;
    this.x_axis = [0 , 500];
    this.y_axis = [-100, 6000];
    this.size = 10000000;
    this.levels_num = 1;
    this.step = 1;
    this.tile_size = 10;
    var _this=  this;
    this.chan_number = 2;
    this.lines = [];



    this.calucalteStep = function()
    {
        var diff = this.x_axis[1] - this.x_axis[0];

        _this.step = diff/this.size;

    };

    this.tilesCount = function()
    {
        return this.size/this.tile_size;
    };


    this.level_size = function (level) {
        var max = this.levels_num - 1;
        var diff = max - level;

        var num = this.tilesCount();
        for(var i = 0; i < diff; i++)
        {
            num = Math.ceil(num/this.tile_size);
        }
        return num;
    };

    this.loadTiles = function(lines) {
        var offset = 3;
        var num_lines = 0 ;
        for(var l = offset; l < lines.length; l++)
        {
           if(lines[l].length > 0) num_lines++;
        }
        this.num_chan = num_lines;
        this.chan_number= this.num_chan;
        var i = 0;
        var lvls =  Math.ceil(Math.log(this.size) / Math.log(this.tile_size)) - 1;
        console.log("[DEBUG] Number of levels : " + lvls);
        this.levels = new Array(lvls);

        this.levels_num = lvls;

        for (var k = 0; k < lvls; k++) {
            var lvl_size = this.level_size(k);
            this.levels[k] = new Array(lvl_size);
            for(i = 0 ; i < lvl_size; i++)
            {
                var tile = new Array(this.num_chan);
                this.levels[k][i] = tile;
            }
        }
        var max = this.levels.length - 1;
        var tiles = this.rawTiles(lines);
        this.levels[max] = tiles;
        this.levels[max].raw = true;
        this.buildLevels();
    };

    this.rawTiles = function(lines)
    {
        var tiles = new Array(this.tilesCount());
        var offset = 3;
        var curr_chan = new Array(this.tile_size);
        var i,j = 0;
        for(var t = 0; t < this.tilesCount(); t++)
        {
            tiles[t] = new Array(this.num_chan);
        }

        for (var c = 0; c < this.num_chan; c++) {

            var buffer = lines[offset + c].split(" ");
            i = 0;
            for (var n = 0; n < this.size; n++) {
                var number = parseInt(buffer[n]);

                if (j++ >= this.tile_size - 1) {
                    j = 0;

                    tiles[i++][c] = (curr_chan);
                    curr_chan = new Array(this.tile_size);

                }
                curr_chan[j] = (number);
            }
            console.log("[DEBUG] TILES: " + i);
            if(j != 0 ) {
                console.log("[ERROR] This should not happen.", curr_chan);
            }
        }
        console.log("[INFO] Added " + tiles.length + " tiles.");
        console.log("[INFO] Channels: " + tiles[0].length);


        return tiles;

    };


    this.buildLevels = function()
    {
        var max = this.levels.length - 1;
        var tiles = this.levels[max];
        var it = 0;
        var n = 0;
        var lvl = 0;
        for(var i = max - 1; i >= 0; i--) { // levels
            lvl = i;
            var level = this.levels[i];
            for(var t = 0; t < level.length; t++) // tiles
            {
                var offset = t * this.tile_size;
                var tile = level[t];
                for(var c = 0 ; c < this.num_chan; c++) // channels
                {
                    tile[c] = new Array(2); // channel -> Min_Max
                    tile[c][0] = new Array(this.num_chan);
                    tile[c][1] = new Array(this.num_chan);
                    var chan_min = tile[c][0];
                    var chan_max = tile[c][1];

                    for(var l = 0; l < this.tile_size; l++) // offset -> channel
                    {
                        if(tiles.length <= offset+l)
                        {
                            continue;
                        }
                        if(lvl == (max - 1))
                        {
                            //console.log("[INFO] Working with raw_data.");
                            var t_chan = tiles[offset + l][c];
                            var min_val = this.min(t_chan);
                            var max_val = this.max(t_chan);
                            //console.log("[INFO]  ADDING MIN_MAX - RAW [%d, %d]",min_val, max_val);
                            chan_min[l] = min_val;
                            chan_max[l] = max_val;

                        }
                        else
                        {
                            //console.log("[INFO] Working with levels.");
                            var t_chan = tiles[offset + l][c];
                            var t_chan_min = t_chan[0];
                            var t_chan_max = t_chan[1];
                            var min_val = this.min(t_chan_min);
                            var max_val = this.max(t_chan_max);
                            //console.log("[INFO]  ADDING MIN_MAX - LEVEL [%d, %d]",min_val, max_val);
                            chan_min[l] = min_val;
                            chan_max[l] = max_val;
                        }

                    }
                }
            }
            tiles = this.levels[i];
        }
    };


    this.average = function(arr)
    {
        var sum = arr.reduce(function(a,b) { return a+b;});
        return sum / arr.length;
    };

    this.min = function(arr)
    {
        var min = arr.reduce(function(a,b) { return (a > b) ? b : a; });
        return min;
    };

    this.max = function(arr)
    {
        var max = arr.reduce(function(a,b) { return (a > b) ? a : b; });
        return max;
    };

    this.parseBuffer = function(lines)
    {
            var header_x = lines[0].split(" ");
            var header_y = lines[1].split(" ");
            console.log("Showing info: ");
            _this.x_axis = [parseInt(header_x[0]), parseInt(header_x[1])];
            _this.y_axis = [parseInt(header_y[0]), parseInt(header_y[1])];
            _this.size = parseInt(lines[2]);
            _this.calucalteStep();

            console.log("[INFO] X Axis: " + _this.x_axis);
            console.log("[INFO] Y Axis: " + _this.y_axis);
            console.log("[INFO] Size: " + _this.size);
            console.log("[INFO] Step: " + _this.step);
            console.log("[INFO] Number of Tiles: " + _this.tilesCount());


            _this.loadTiles(lines);
            console.log("[INFO] - Ready ...");


    }

    this.loadData = function(path)
    {
                var rfile = require('readline').createInterface({
                  input: require('fs').createReadStream(path)
                });

                var i = 0;
                var buffer = null;
                rfile.on('line', function (line) {
                        i++;
                        buffer = line;
                        _this.lines.push(line);

                });
                rfile.on('close', function(){
                        _this.parseBuffer(_this.lines);
                });
    };

    this.getTileData = function(level, index)
    {
        if(this.levels[level])
            return this.levels[level][index];
        console.log("Reached level %d, which is unreachable.", level);
        return null;
    }

}

function test()
{
    var holder = new DataHolder();
    holder.loadData("data.txt");

    rl.on('line', function(line){
        if(line == "q")
            process.exit(0);
        var tile = holder.getTileData(parseInt(line));

        process.stdout.write("[ ");
        tile.forEach(function (elem) {
            process.stdout.write( elem +", ")
        });
        process.stdout.write("\b\b ]\n");

    });
}


function main()
{
    var app = new Application();
    var myArgs = process.argv.slice(2);
    console.log('Passed arguments: ', myArgs);
    var file = "sin2.txt";
    if(myArgs.length > 0)
    {
        file = myArgs[0];
    }
    console.log("Starting file:", file);
    app.run(10888, file);
}


main();
