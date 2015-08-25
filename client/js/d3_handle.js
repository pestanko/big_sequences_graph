/**
 * Created by Peter Stanko on 13.7.2015.
 */


function D3_handle(main_container_name) {
    var main_container = d3.select(main_container_name);
    var main_node = main_container.node();
    this.log = new my_logger();



    function getWidth() {

        return main_node.offsetWidth;
    }

    function getHeight() {

        return main_node.offsetHeight;
    }

    this.log.debug(main_node.style.width, main_node.style.height);

    this.requestWindowSize = function () {
        window.config.client_width = getWidth;
    };


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
    this.domain = {};
    this.domain.x = [0, 900];
    this.domain.y = [0, 500];


    this.reload = function () {


        if (svg)
        {
            svg.remove();
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
    };


    this.domain_bounds = function(bounds)
    {
        if(bounds.start < 0)
            bounds.start = 0;
        if(bounds.stop > window.config.size)
            bounds.stop = window.config.size;
        this.log.info( "[INFO] BOUNDS: " ,bounds);
    };

    this.drawData = function (data) {

        if(!window.config) return;

        var tile_size = window.config.tile_size;
        var x_beg = window.icfg.current.index;
        var d_size = window.config.size;
        var levelSize = window.stat.levelSize();
        var oneTile = d_size / levelSize;
        var nTile = window.stat.windowSize() * oneTile;
        var oneStep = oneTile / tile_size;
        var xb_ts = x_beg * oneTile;
        var bounds = {start: xb_ts, stop: xb_ts + nTile, step: oneTile};
        this.log.info("[DEBUG] BOUNDS - BEGIN: " ,bounds);



        if (data == null) {
            return;
        }
        var out_data = new Array(data.length);
        var x_step = 0;
        this.domain_bounds(bounds);
        this.domain.x = [bounds.start, bounds.stop];


        for (var i = 0; i < data.length; i++) {
            out_data[i] = new Array(data[i].length);
            x_step = xb_ts;

            for (var j = 0; j < data[0].length; j++) {
                out_data[i][j] = {x: x_step, y: data[i][j]};
                x_step+=oneStep;
            }
        }


        this.log.info("[INFO] INTERVAL [%d, %d] ", xb_ts, x_step);
        this.updateData(out_data);
        this.updatePaths(bounds);
    };

    this.drawGridVertical = function (cont,bounds) {
        var start = bounds.start;
        var stop = bounds.stop;


        for (var i = start; i <= stop; i+= bounds.step) {
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


    this.updatePaths = function (bounds) {
        var data = this.data;
        if (data == null) return;


        var line = d3.svg.line()
            .x(function (d) {
                return _this.x(d.x);
            })
            .y(function (d) {
                return _this.y(d.y);
            });


        _this.x.domain(this.domain.x);
        _this.y.domain(this.domain.y);

        container.select(".x").call(xAxis);
        container.select(".y").call(yAxis);

        if (path_container != null)
            path_container.remove();

        path_container = container.append("g").attr("class", "path_container");


        for (var i = 0; i < data.length; i++) {
            path_container.append("path")
                .datum(data[i])
                .attr("class", "line")
                .attr("id", "chan" + i)
                .attr("d", line);
        }

        this.drawGridVertical(path_container, bounds);

        //this.drawSelectLine(path_container, shift);
    };
    this.updateData = function (data) {
        _this.data = data;
    };


    this.reload();

}






