/**
 * Created by wermington on 9/14/15.
 */


function ConnectionAjax(host)
{
    var _this = this;
    this.log = Logger;


    this.getConfig = function()
    {
        var url = host + "/?type=config";

        $.get(url, function(data)
        {
            var message = JSON.parse(data);
            window.config = {
                x_axis: message.x_axis,
                y_axis: message.y_axis,
                levels: message.levels,
                tile_size: message.tile_size,
                size: message.size,
                active_window_size: 5,
                channels: message.channels
            };

            _this.log.info("[INFO] Updated config: " + window.config);
        });
    };


    this.getInterval = function(level, beg, end)
    {
        var url = host + "/?type=interval&level="+level+"&beg="+beg+"&end="+end;
        return $.get(url); // return promis
    };

    this.getTile = function(level, index)
    {
        var url = host + "/?type=get&level="+level+"&index="+index;
        return $.get(url); // return promis
    };

};