/**
 * Created by wermington on 4.8.2015.
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
        console.log("Listening on port: " + port);
        this.wss.on('connection', function connection(ws)
            {
                console.log("New connection.");
                ws.on('message', function incoming(data) {
                    var msg = JSON.parse(data);
                    switch(msg.type)
                    {
                        case "get":
                            console.log("Received GET message.");
                            var res = _this.handleTileMsg(msg);

                            ws.send(JSON.stringify(res));

                            console.log("Sended index with index " + res.index);

                            break;
                    }

                });

                var msg = _this.getCfgMsg();
                ws.send(JSON.stringify(msg));
            }

        );
    };

    this.handleTileMsg = function(msg)
    {
        var level = msg.level;
        var index = msg.index;

        var data = _this.holder.getTileData(level, index);

        var result =
        {
            type: 'tile',
            index: index,
            level: level,
            data: data
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
    this.y_axis = [50, 200];
    this.size = 10000000;
    this.levels_num = 1;
    this.step = 1;
    this.tile_size = 10;
    var _this=  this;
    this.chan_number = 2;



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
        var j = 0;
        var i = 0;

        var num_tiles = this.tilesCount();
        var lvls=  Math.ceil(Math.log(this.size) / Math.log(this.tile_size)) - 1;
        console.log("LVLS -: " + lvls);
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
            console.log("TILES: " + i);
            if(j != 0 ) {
                console.log("This should not happen.", curr_chan);
            }
        }
        console.log("Added " + tiles.length + " tiles.");
        console.log("Channels: " + tiles[0].length);

        return tiles;

    };


    this.buildLevels = function()
    {
        var max = this.levels.length - 1;
        var tiles = this.levels[max];
        var it = 0;
        var n = 0;
        for(var i = max - 1; i >= 0; i--) { // levels
            var level = this.levels[i];
            for(var t = 0; t < level.length; t++) // tiles
            {
                var offset = t * this.tile_size;
                var tile = level[t];
                for(var c = 0 ; c < this.num_chan; c++) // channels
                {
                    tile[c] = new Array(this.num_chan);
                    var channel = tile[c];
                    for(var l = 0; l < this.tile_size; l++) // offset -> channel
                    {
                        if(tiles.length <= offset+l)
                        {
                            continue;
                        }
                        var avg = this.average(tiles[offset + l][c]);
                        channel[l] = avg;
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

    this.loadData = function(path)
    {
        fs.readFile(path, {encoding: 'utf-8'}, function(err, data){
            if(err)
            {
                console.log(err);
            }
            else
            {
                var buffer = null;
                console.log("Received data ...");
                var lines = data.split("\n");
                var header_x = lines[0].split(" ");
                var header_y = lines[1].split(" ");
                console.log("Showing info: ");
                _this.x_axis = [parseInt(header_x[0]), parseInt(header_x[1])];
                _this.y_axis = [parseInt(header_y[0]), parseInt(header_y[1])];
                _this.size = parseInt(lines[2]);
                _this.calucalteStep();

                console.log("X_AXIS: " + _this.x_axis);
                console.log("Y_AXIS: " + _this.y_axis);
                console.log("SIZE: " + _this.size);
                console.log("STEP: " + _this.step);
                console.log("TILES: " + _this.tilesCount());


                _this.loadTiles(lines);
                console.log("Ready ...");
            }
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
    app.run(10888, "data.txt");
}


main();




