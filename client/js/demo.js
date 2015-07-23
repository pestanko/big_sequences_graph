function DemoApp()
{
    var _this = this;


    this.generate = function(holder)
    {
        holder.addTile("0", []);
        holder.addTile("1", [1]);
        holder.addTile("2", [2]);
        holder.addTile("3", [3]);
        holder.addTile("4", [4]);
        holder.addTile("12", [1,2]);
        holder.addTile("26", [2,6]);
        holder.addTile("436", [4,3,6]);
    };

    this.test_clear = function(holder)
    {
        holder.clean();
        this.print(holder.tiles);
    };


    this.test_remove = function(holder)
    {
        holder.remove([4,3,6]);
        this.print(holder.tiles);
        console.log("**************************");
        holder.addTile("436", [4,3,6]);
        this.print(holder.tiles);
    };

    this.test_get = function(holder)
    {
        var tile1 = holder.getTile([1]);
        console.log("TILE ON PATH [1]: " + tile1.channels);

        var tile2 = holder.getTile([2]);
        console.log("TILE ON PATH [2]: " + tile2.channels);

        var tile3 = holder.getTile([1,2]);
        console.log("TILE ON PATH [1,2]: " + tile3.channels);

        var tile4 = holder.getTile([4,3,6]);
        console.log("TILE ON PATH [4,3,6]: " + tile4.channels);
    };

    this.print = function(tree)
    {
        var current_level = tree;

        if(current_level == null) return;

        for(var key in current_level)
        {
            var prop = current_level[key];
            if(key == "channels") continue;
            if((typeof prop) == 'function') continue;
            if (current_level.hasOwnProperty(key)) {
                var tmp = current_level[key];
                if(tmp == null) return;
                if(!tmp.channels) continue;
                console.log("KEY: " + key + " - " + tmp.channels);
                _this.print(tmp);
            }
        }

    };


    this.run = function()
    {
        var holder = new TileHolder();

        console.log("Tile Holder created: "+ holder);

        this.generate(holder);
        this.print(holder.tiles);
        //this.test_remove(holder);
        //this.test_clear(holder);

    };




};


var demo = new DemoApp();

demo.run();

