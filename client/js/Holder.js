/**
 * Created by Peter Stanko on 12.7.2015.
 * @author Peter Stanko
 * @uco 410338
 * @licence MIT
 */




function WindowDataHolder(level)
{
    var minTile = 0;
    var maxTile = 0;
    this.level = level;
    this.data = [];
    this.log = window.stat.logging();

    this.addTilesBuff = function(beg_index, end_index)
    {
        var p_winsize = minTile - maxTile;

        var diff_begin = beg_index - minTile;

        var min_t = minTile;
        var max_t = maxTile;

        minTile = beg_index;
        maxTile = end_index;

        if(Math.abs(diff_begin) >= p_winsize)
        {
            // NEW WINDOW
            this.delete(minTile, maxTile);
            this.data = this.buildData(beg_index, end_index);
            return;
        }

        if(beg_index < min_t)
        {
            this.dataAquire(beg_index, min_t);
            var new_data = this.buildData(beg_index, min_t);
            this.data = new_data.join(this.data);
        }else
        {
            this.delete(beg_index, min_t);
            this.shrinkDataBegin(beg_index - min_t);
        }

        if(end_index > max_t)
        {
            this.dataAquire(max_t, end_index);
            var new_data = this.buildData(max_t, end_index);
            this.data.join(new_data);
        }
        else
        {
            this.delete(max_t, end_index);
            this.shrinkDataEnd(max_t - end_index);
        }

    };

    this.dataAquire = function(from, to)
    {
        for(var i = from; i < to; i++)
        {
            this.level.requestTile(i);
        }
    };

    this.buildData = function(from, to)
    {
        return data;
    };

    this.buildRaw = function(from, to)
    {
        var data = null;
        for(var i = from; i < to; i++) // IterateTiles
        {
            var tile = this.level.getTile(i);
        }
    };

    this.buildLevels = function(from, to)
    {
        var chans = this.level.channels;
        var data = new Array(chans);
        for(var i = from; i < to; i++) // Iterate Tiles
        {
            var tile = this.level.getTile()
        }
    };

    this.delete = function(begin, end)
    {
        this.log.info("[INFO] Deleting tiles from [%d, %d].", begin, end);
        this.level.deleteTiles(begin, end);
    };

    this.shrinkDataBegin = function (count)
    {
        var delc = count * window.config.tile_size;
        var size = this.data.length;
        this.data = this.data.slice(delc, size);
        this.log.debug("[DEBUG] New size after slice: %d - %d  vs  %d.", this.data.length, this.data.length/ 10, count);
    };

    this.shrinkDataEnd = function (count)
    {
        var delc = count * window.config.tile_size;
        var size = this.data.length;
        this.data = this.data.slice(0, size - delc);
        this.log.debug("[DEBUG] New size after slice: %d - %d  vs  %d.", this.data.length, this.data.length/ 10, count);
    };

    this.getData = function()
    {
        return this.data;
    };

}
