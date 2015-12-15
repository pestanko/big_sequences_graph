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

        var data = _this.holder.getTileData(index);

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

    this.loadTiles = function(lines) {
        var offset = 3;
        var num_lines = 0 ;
        for(var l = offset; l < lines.length; l++)
        {
            if(lines[l].length > 0) num_lines++;
        }

        var num_chan = num_lines;
        this.chan_number= num_chan;
        console.log("Lines length: %d, offset: %d, num_chan: %d", lines.length, offset, num_chan)
        var buffer = null;
        var j = 0;
        var i = 0;

        var num_tiles = this.size / this.tile_size;
        var curr_chan = new Array(this.tile_size);


        _this.tiles = new Array(num_tiles);


        for(i = 0 ; i < num_tiles; i++)
        {
            this.tiles[i] = new Array(num_chan);
        }

        for (var c = 0; c < num_chan; c++) {

            buffer = lines[offset + c].split(" ");
            i = 0;
            for (var n = 0; n < this.size; n++) {
                var number = parseInt(buffer[n]);

                if (j++ >= this.tile_size - 1) {
                    j = 0;

                    this.tiles[i++][c] = (curr_chan);
                    curr_chan = new Array(this.tile_size);

                }
                curr_chan[j] = (number);
            }

           if(j != 0 ) {
               console.log("This should not happen.", curr_chan);
               _this.tiles[i] = (curr_chan);
           }
        }
        console.log("Added " + this.tiles.length + " tiles.");
        console.log("Channels: " + this.tiles[0].length);
        console.log("Channels 1: " + this.tiles[1][0]);
        console.log("Channels 2: " + this.tiles[1][1]);


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
            }
        });
    };

    this.getTileData = function(index)
    {
        return this.tiles[index];
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




