/**
 * Created by Peter Stanko on 13.7.2015.
 */


function D3_handle()
{

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    this.data = null;
    var _this = this;
    var container = null;
    var path_container = null;
    var step = width/500;
    this.domain = {};
    this.domain.x = [0, 900];
    this.domain.y = [0, 500];


    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = svg = d3.select("body").append("svg")
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

    this.drawData = function(data, xaxis)
    {
        var x_beg = xaxis.begin;
        var w_size = window.config.active_window_size * window.config.tile_size;
        if(data == null) {return;}
        var out_data = new Array(data.length);
        var x_step = 0;
        this.domain.x = [x_beg, x_beg + w_size];



        for(var i = 0; i < data.length; i++)
        {
            out_data[i] = new Array(data[i].length);
            x_step = x_beg;

            for(var j = 0; j < data[0].length; j++)
            {
                out_data[i][j] = {x: x_step, y: data[i][j]};
                x_step++;
            }
        }


        console.log("INTERVAL [%d, %d] ", x_beg ,x_step);
        this.updateData(out_data);
        this.updatePaths(x_beg);
    };

    this.drawGridVertical = function(cont, shift)
    {
        var num = window.config.active_window_size;
        var t_size = window.config.tile_size;

        for(var i = (shift/t_size) + 1; i < (shift/t_size) + num; i++)
        {
            var x_coor = i * t_size;
            cont.append("line")
                .attr("x1", x(x_coor))  //<<== change your code here
                .attr("y1", 0)
                .attr("x2", x(x_coor))  //<<== and here
                .attr("y2", height)
                .style("stroke-width", 1)
                .style("stroke", "#555")
                .style("fill", "none");
        }

    };


    this.updatePaths = function(shift)
    {
        var data = this.data;
        if(data == null) return;



        var line = d3.svg.line()
            .x(function(d) { return x(d.x); })
            .y(function(d) { return y(d.y); });


        x.domain(this.domain.x);
        y.domain(this.domain.y);

        container.select(".x").call(xAxis);
        container.select(".y").call(yAxis);

        if(path_container != null)
            path_container.remove();

        path_container = container.append("g").attr("class", "path_container");


        for(var i = 0 ; i < data.length; i++)
        {
            path_container.append("path")
                .datum(data[i])
                .attr("class", "line")
                .attr("id", "chan"+i)
                .attr("d", line);
        }

        this.drawGridVertical(path_container, shift);



    };
    this.updateData = function(data)
    {
        _this.data = data;
    };

}






