/**
 * Created by Peter Stanko on 13.7.2015.
 */


function ChannelData(id, data)
{
    this.id = id;
    this.data = data;
}


function Tile(channels) {
    this.channels = channels | null;
    this.time_shift = 1;
    this.time_begin = 0;
    this.time_end = 0;

    this.getChannelsList = function () {
        var ret = [];
        for (var i = 0; i < this.channels.length; i++) {
            var chan = this.channels[i];
            ret.push(chan.id);
        }
        return ret;
    };

    this.containsChannel = function (channel) {
        this.channels.forEach(function (chan) {
            if (chan.id == channel.id) return true;
        });
    };


    this.updateChannel = function (channel) {
        var updated = false;
        this.channels.forEach(function (chan) {
            if (chan.id == channel.id) {
                updated = true;
                chan.data = channel.data;
            }
        });

        if (!updated) {
            this.channels.push(channel);
        }
    };

    this.updateAllChannels = function (channels) {
        channels.forEach(function (chan) {
            _this.updateChannel(chan);
        });
    }

};








