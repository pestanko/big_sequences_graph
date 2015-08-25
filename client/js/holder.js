/**
 * Created by Peter Stanko on 22.7.2015.
 */




function MatrixHolder()
{
    /**
     * Holds in levels_num minimal values for channels
     * @type {Array}
     */
    this.minDataLevels = [];
    /**
     * Holds in levels_num maximal values for channels
     * @type {Array}
     */
    this.maxDataLevels = [];


}



function MatrixManager()
{
    this.holder = new MatrixHolder();

    this.level = 0; // current level
    this.n_levels = 0; // index of levels_num
    this.n_tiles = 0; // index of tiles
    this.size = 255; // size of index


    this.nextLevel = function()
    {
        if(this.level < this.n_levels - 1)
        {
            this.level++;
        }
        else
        {
            console.log("[INFO] - Reached maximal level");
        }
    };

    this.previousLevel = function()
    {
        if(this.level > 0)
        {
            this.level--;
        }else
        {
            console.log("[INFO] - Reached minimal level 0");
        }
    };

    /**
     * Returns mins and max for tiles
     * @param tile_no - Tile index
     */
    this.getData = function(tile_no, level)
    {
        level = level | this.level;
        var min = this.holder.minDataLevels[level][tile_no];
        var max = this.holder.maxDataLevels[level][tile_no];
        var data = {
            min: min,
            max: max
        };
    };


    /**
     *
     * @param tile_no - Tile index
     * @param data - Collection of min and max
     */
    this.addTile = function(tile_no, data)
    {
        var hld = this.holder;
        hld.minDataLevels[tile_no] = data.min;
        hld.maxDataLevels[tile_no] = data.max;
    };
    /**
     *
     * @param tile_no - Tile index
     */

    this.removeTile = function(tile_no)
    {
        var hld = this.holder;
        var min = hld.minDataLevels;
        var max = hld.maxDataLevels;

        if(min.hasOwnProperty(tile_no))
            delete min[tile_no];

        if(max.hasOwnProperty(tile_no))
            delete max[tile_no];
    }

}









