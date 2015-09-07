/**
 * Created by Peter Stanko on 13.7.2015.
 */




function D3Drawer(main_container_name) {
    var main_container = d3.select(main_container_name);
    var main_node = main_container.node();
    this.log = new SimpleLogger();
    this.currentLevel = null;

    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = getWidth() - margin.left - margin.right,
        height = getHeight() - margin.top - margin.bottom;

    this.x = null;
    this.y = null;
    var xAxis = null;
    var yAxis = null;
    var svg = null;
    var curr_shift = 0;

    this.log.info("[INFO] Window: [%d, %d]", getWidth(), getHeight());

    this.data = null;
    var _this = this;
    var path_container = null;
    var container = null;
    this.domain = window.icfg.domain;
    this.domain.x = [0, 900];
    this.domain.y = [0, 2000];



    // Init
    var min_line = d3.svg.line()
        .x(function (d) {
            return _this.x(d.x);
        })
        .y(function (d) {
            return _this.y(d.min);
        });

    var max_line = d3.svg.line()
        .x(function (d) {
            return _this.x(d.x);
        })
        .y(function (d) {
            return _this.y(d.max);
        });

    var line = d3.svg.line()
        .x(function (d) {
            return _this.x(d.x);
        })
        .y(function (d) {
            return _this.y(d.y);
        });


    function getWidth() {

        return main_node.offsetWidth;
    }

    function getHeight() {

        return main_node.offsetHeight;
    }


    this.requestWindowSize = function () {
        window.config.client_width = getWidth;
    };




    this.reload = function () {

        var cont = d3.select(main_container_name);

        if (cont)
        {
            var s = cont.select("svg");
            if(s) s.remove();
        }

        this.x = d3.scale.linear()
            .range([0, width]);

        this.y = d3.scale.linear()
            .range([height, 0]);

        xAxis = d3.svg.axis()
            .scale(this.x)
            .orient("bottom");

        yAxis = d3.svg.axis()
            .scale(this.y)
            .orient("left");

        svg = main_container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        container = svg.append("g").attr("class", "container");


        container.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        container.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".72em")
            .style("text-anchor", "end")
            .text("Data -- #");

        this.drawLevel();
    };



    this.drawLevel = function (level) {
        level = level | this.currentLevel;

        if(!level) return;

        var thresh_count = 0;

        this.currentLevel = level;

        _this.x.domain(this.domain.x);
        _this.y.domain(this.domain.y);

        container.select(".x").call(xAxis);
        container.select(".y").call(yAxis);

        if (path_container != null)
            path_container.remove();

        path_container = container.append("g").attr("class", "path_container");

        for(var i = level.lowIndex(); i < level.upIndex(); i++)
        {
            var interval = setInterval(function()
            {
                var index = i;
                if (window.icfg.threshold <= thresh_count++) {
                    clearInterval(interval);
                    _this.log.warning("[WARNING] - Timeout @ [%d, %d]", level.level, index);
                    return;
                }


                var tile = level.tiles[i];
                if(tile) {
                    clearInterval(interval);
                    _this.drawTile(level.tiles[index]);
                }
            }, 50);
        }

    };

    this.drawTile = function (tile) {
        if(!tile) return;

        tile.forEach(function(channel, index){
            _this.drawChannel(channel, index);
        });
    };


    this.drawChannel = function(channel, index)
    {
        if(!channel) return;

        if(channel[0].y) // Test if there is Y property
        {
            // RAW_DATA
            _this.drawPath(channel, index)
        }
        else
        {
            _this.drawMinMax(channel, index);
        }

    };


    this.drawGridVertical = function (cont) {

        var level = this.currentLevel;
        if(!level) return;
        var start = window.stat.tileToPosition(level, index);
        var stop = start + (level.window_size() * level.tileSize);
        var step = this.tileSize / window.config.tile_size;

        for (var i = start; i <= stop; i+= step) {
            var x_coor = _this.x(i);
            cont.append("line")
                .attr("x1", x_coor)  //<<== change your code here
                .attr("y1", 0)
                .attr("x2", (x_coor))  //<<== and here
                .attr("y2", height)
                .style("stroke-width", 1)
                .style("stroke", "#999")
                .style("fill", "none");
        }
    };

    this.updateSelectLine = function(ix)
    {
        this.drawSelectLine(path_container, curr_shift, ix);
    };


    this.drawSelectLine = function(cont, shift ,x_pos)
    {
        var sel_line = d3.select("#selectLine");
        if(sel_line)
            sel_line.remove();
        x_pos = x_pos | 0;
        shift = shift | curr_shift;
        curr_shift = shift;
        var x_coor = (x_pos);
        var line = cont.append("line")
            .attr("id", "selectLine")
            .attr("x1", x_coor)  //<<== change your code here
            .attr("y1", 0)
            .attr("x2", (x_coor))  //<<== and here
            .attr("y2", height)
            .style("stroke-width", 1)
            .style("stroke", "#F00")
            .style("fill", "none");
        return line;
    };

    this.getSelectX = function(ix)
    {
        var invert = this.x.invert(ix + curr_shift);
        return invert;
    };


    this.drawMinMax = function (data, chan) {

        var cls = "line";

        path_container.append("path")
            .datum(data)
            .attr("class", cls)
            .attr("id", "chan" + chan)
            .attr("d", min_line);


        path_container.append("path")
            .datum(data)
            .attr("class", cls)
            .attr("id", "chan" + chan)
            .attr("d", min_line);


        path_container.append("path")
            .datum(data)
            .attr("class", cls)
            .attr("id", "chan" + chan)
            .attr("d", max_line);

        var area_mm = d3.svg.area()
            .x(max_line.x())
            .y0(min_line.y())
            .y1(max_line.y());


        path_container.append("path")
            .datum(data)
            .attr("class", "area" + chan)
            .attr("d", area_mm)
            .attr("fill", "steelblue")
            .style("opacity", "0.3");

    };


    this.scaleY = function(dir)
    {
        var min = this.domain.y[0];
        var max = this.domain.y[1];
        this.domain.y = [ min - dir, max + dir ];
        this.reload();
    };

    this.scaleX = function(dir)
    {
        var min = this.domain.x[0];
        var max = this.domain.x[1];
        this.domain.x = [ min - dir, max + dir ];
        this.reload();
    };



    this.drawPath = function(data, chan , mm)
    {
        var cls = "line";
        if(mm)
        {
            cls += " "+mm;
        }

        path_container.append("path")
            .datum(data)
            .attr("class", cls)
            .attr("id", "chan" + chan)
            .attr("d", line);
        return line;
    };


    this.reload();

}






