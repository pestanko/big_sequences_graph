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



    this.newTile = function(path, channels)
    {
        //TODO

        var tile = new Tile(path, channels)
    };



    this.stringPath = function()
    {
        var path = "/";
        path += this.currentPath.forEach(function(elem){ return elem + "/"; });
        return path;
    };

    this.zoomOut = function()
    {
        this.currentPath.pop();
    };

    this.zoomIn = function(coord)
    {
        // TODO: Calculate where to zoom in.
    };

    this.moveTileRight()
    {
        if(cp.length <= 0)  return;

        var cp = this.currentPath;
        var last = cp[cp.length - 1];
        if(last >= this.config.tiles -1) return;
        cp[cp.length - 1]++;
    };

    this.moveTileLeft()
    {
        if(cp.length <= 0)  return;
        var cp = this.currentPath;
        var last = cp[cp.length - 1];
        if(last <= 0 ) return;
        cp[cp.length - 1]--;
    };




};





