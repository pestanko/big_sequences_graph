function TilesContainer(begin, end, data)
{
        if (begin >= end) return;
        this.beginIndex = begin;
        this.endIndex = end;
        this.array = new Array(end - begin);
        this.render = null;

        var _this = this;
        this.log = Logger;

        //Add data
        for (var i = 0; i < end - begin; i++) {
                this.array[i] = data[i];
        }

        this.contains = function (index)
        {
                return !!(index >= begin && index <= end);
        };

        this.getTile = function (index)
        {
                if (this.contains(index)) {
                        return this.array[index - this.beginIndex];
                }
                return null;
        };

        this.getTiles = function (beg, end)
        {
                var min = (this.contains(beg)) ? beg : this.beginIndex;
                var max = (this.contains(end)) ? beg : this.endIndex;

                var slice_min = min - this.beginIndex;
                var slice_max = max - this.beginIndex;

                return {beg: min, end: max, tiles: this.array.slice(slice_min, slice_max + 1)};
        };

        this.joinContainers = function (container)
        {
                var my_b = this.beginIndex;
                var my_e = this.endIndex;
                var c_b = container.beginIndex;
                var c_e = container.endIndex;

                var min = (my_b < c_b) ? my_b : c_b;
                var max = (my_e > c_e) ? my_e : c_e;
                var new_array = new Array(max + 1 - min);

                for (var i = min; i < max; i++) {
                        if (container.contains(i)) {
                                new_array[i - min] = container.getTile(i);
                        }
                        else {
                                new_array[i - min] = this.getTile(i);
                        }
                }

                return new TilesContainer(min, max, new_array);
        };

        this.shrinkContainer = function (beg, end)
        {
                var tiles = this.getTile(beg, end);
                if (!tiles) return null;
                return new TilesContainer(beg, end, tiles);
        };

        this.prepend = function (container)
        {
                var my_b = this.beginIndex;
                var my_e = this.endIndex;
                var c_b = container.beginIndex;
                var c_e = container.endIndex;

                if (c_e < my_b) {
                        return null;
                }

                container.array.push(this.array);
                this.array = container.array;
                return this;

        };

        this.postpend = function (container)
        {
                var my_b = this.beginIndex;
                var my_e = this.endIndex;
                var c_b = container.beginIndex;
                var c_e = container.endIndex;

                if(my_b)
        };
}