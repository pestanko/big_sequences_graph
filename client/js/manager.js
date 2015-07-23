/**
 * Created by Peter Stanko on 13.7.2015.
 */


function ChannelData(id, data)
{
    this.id = id;
    this.data = data;
}


function Tile(channels)
{
    this.channels = channels | null;
    this.time_shift = 1;
    this.time_begin  = 0;
    this.time_end = 0;

    this.getChannelsList = function()
    {
        var ret = [];
        for(var i = 0 ; i < this.channels.length; i++)
        {
            var chan=this.channels[i];
            ret.push(chan.id);
        }
        return ret;
    };

    this.containsChannel = function(channel)
    {
        this.channels.forEach(function(chan){
            if(chan.id == channel.id) return true;
        });
    };


    this.updateChannel = function(channel)
    {
        var updated = false;
        this.channels.forEach(function(chan)
        {
            if(chan.id == channel.id)
            {
                updated = true;
                chan.data = channel.data;
            }
        });

        if(!updated)
        {
            this.channels.push(channel);
        }
    };

    this.updateAllChannels = function(channels)
    {
        channels.forEach(function(chan)
        {
            _this.updateChannel(chan);
        });
    }

}


function TileHolder()
{
    this.tiles = new Tile();
    var _this = this;

    this.addTile = function(channels, path)
    {
        var current_level = this.tiles;
        var pi = null;

        for(var i = 0; i < path.length; i++)
        {
            pi = path[i];
            if(pi in current_level)
            {
                current_level = current_level[pi];
            }else
            {
                current_level[pi] = new Tile();
                current_level = current_level[pi];
            }
        }
        current_level.channels = channels;
    };

    this.addToTile = function(path, channels)
    {
        var tile = _this.getTile(path);
        if(tile == null)
        {
            _this.addTile(channels,path);
        }

        //TODO
        tile.channels = tile.channels.concat(channels);
    };



    this.getTile = function(path)
    {
        var current_level = this.tiles;
        var pi = null;
        for(var i = 0; i < path.length; i++)
        {
            pi = path[i];
            if(pi in current_level)
            {
                current_level = current_level[pi];
            }else
            {
                return null;
            }
        }
        return current_level;

    };


    this.clean = function()
    {
        this.tiles = new Tile(null);
        console.log("Tiles were cleaned.");
    };

    this.remove = function(path)
    {
        var current_level = this.tiles;
        var pi = null;
        var prev = null;
        for(var i = 0; i < path.length; i++)
        {
            pi = path[i];
            if(pi in current_level)
            {
                prev = current_level;
                current_level = current_level[pi];
            }
            else
            {
                return null;
            }
        }

        delete prev[pi];

        console.log("Tiles were removed on level: "+ path);
    };

    this.getTileData = function(path)
    {
        var tile = _this.getTile(path);
        if(tile == null) return null;
        return tile.channels;
    }




}




function AppManager()
{
    this.wsclient = null;
    this.hwnd = d3hwnd = new D3_handle();
    this.client_width = 0;
    this.client_height = 0;

    this.channels = new ChannelsHolder();

    this.selected_channels = [];

    this.currentTile = 0;
    this.currentLevel = 0;
    this.currentPath = [];



    this.config  = {
        x_axis : "x-axis",  // name of X-AXIS
        y_axis : "y-axis",  // name of Y-AXIS
        levels: 0,          // number of levels
        tiles: 1,           // number of tiles
        size:255,           // size of tile
        channels: 1
    };



};





