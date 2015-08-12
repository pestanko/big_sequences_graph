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
    path_container = container.append("g").attr("class", "path_container");


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
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)");

    this.updateTile = function(data)
    {
        if(data == null) {return;}
        var out_data = new Array(data.length);


        for(var i = 0; i < data.length; i++)
        {
            var x_step = 0;
            out_data[i] = new Array(data[i].length);

            for(var j = 0; j < data.length; j++)
            {
                out_data[i][j] = {x: x_step, y: data[i][j]};
                x_step += step;
            }
        }



        this.updateData(out_data);
        this.updatePaths();
    };


    this.updatePath = function()
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


        var ln  = path_container.select(".line");
        ln.remove();

        path_container.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);
    };


    this.updatePaths = function()
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


        var ln  = path_container.select(".line");
        ln.remove();

        for(var i = 0 ; i < data.length; i++)
        {
            path_container.append("path")
                .datum(data[i])
                .attr("class", "line")
                .attr("id", "chan"+i)
                .attr("d", line);
        }

    };


    this.updateData = function(data)
    {
        _this.data = data;
    };

}






