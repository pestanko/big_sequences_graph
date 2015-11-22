/**
 * Created by Peter Stanko on 13.7.2015.
 */




function D3Drawer(main_container_name)
{
        var main_container = d3.select(main_container_name);
        var main_node = main_container.node();
        this.log = Logger;
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

        this.drawTiles = true;

        this.pos = window.icfg.position;
        this.disabledChans = [];

        this.group = {
                level : null,
                begin: -1,
                end  : -1,
                data : []
        };

        const STYLE_AXIS = " fill: none;stroke: #000";
        const STYLE_LINE = STYLE_AXIS + "shape-rendering: crispEdges;stroke: steelblue;stroke-width: 1.5px;";

        // Init
        var min_line = d3.svg.line()
            .x(function (d)
               {
                       return _this.x(d.x);
               })
            .y(function (d)
               {
                       return _this.y(d.min);
               });

        var max_line = d3.svg.line()
            .x(function (d)
               {
                       return _this.x(d.x);
               })
            .y(function (d)
               {
                       return _this.y(d.max);
               });

        var line = d3.svg.line()
            .x(function (d)
               {
                       return _this.x(d.x);
               })
            .y(function (d)
               {
                       return _this.y(d.y);
               });

        this.chanStat = function (index, state)
        {
                this.disabledChans[index] = !state;
        };

        /**
         * Gets client width
         * @returns {number}
         */
        function getWidth()
        {

                return main_node.offsetWidth;
        }

        /**
         * Gets client height
         * @returns {number}
         */
        function getHeight()
        {

                return main_node.offsetHeight;
        }

        /**
         * Gets window size
         */
        this.requestWindowSize = function ()
        {
                window.config.client_width = getWidth;
        };

        /**
         * Function to update axes - an redraw graph
         */
        this.updateAxes = function ()
        {

                this.domain.x = [_this.pos.beg, _this.pos.end];
                this.domain.x = [_this.pos.beg, _this.pos.end];

                _this.x.domain(this.domain.x);
                _this.y.domain(this.domain.y);

                container.select(".x").call(xAxis);
                container.select(".y").call(yAxis);
        };

        /**
         * Reload all graph
         */
        this.reload = function ()
        {

                var cont = d3.select(main_container_name);

                width = getWidth() - margin.left - margin.right;
                height = getHeight() - margin.top - margin.bottom;

                this.log.info("[INFO] Window size: [%d, %d]", getWidth(), getHeight());

                if (cont) {
                        var s = cont.select("svg");
                        if (s) s.remove();
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
                    // .attr("style", STYLE_AXIS)
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                container.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    // .attr("style", STYLE_AXIS)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".72em")
                    .style("text-anchor", "end")
                    .text("Data -- #");

                this.drawLevel();
        };

        /**
         * Draw level
         * @param level - whole level
         */
        this.drawLevel = function (level)
        {
                level = level || this.currentLevel;

                if (!level) return;
                this.currentLevel = level;
                this.updateAxes();

                if (this.drawTiles) {
                        this.refreshLevel(level);
                }
        };

        /**
         * Refresh whole level
         * @param level - which level
         */
        this.refreshLevel = function (level)
        {

                level = level || this.currentLevel;

                if (!level) return;

                function reqTilesWait()
                {
                        var ready = true;
                        for (var i = level.lowIndex(); i < level.upIndex(); i++) {
                                var tile = level.tiles[i];
                                if (!tile) {
                                        ready = false;
                                        return;
                                }
                        }
                        if (ready) {
                                clearInterval(interval);
                                if (_this.drawTiles) {
                                        _this.redrawLevel(level);
                                }
                        }
                };

                var interval = setInterval(reqTilesWait, 100);
        };


        this.buildIntern = function(group, start, stop)
        {
                var level = group.level;
                for (var i = start; i < stop; i++) {

                        var tile = level.tiles[i];
                        if (!tile) continue;

                        for (var t = 0, j = 0; t < tile.length; t++) {
                                group.data[j] = group.data[j].concat(tile[t]);
                                j++;
                        }
                }
        };

        this.buildGroup = function (level)
        {
                if(this.group.level != level){
                        this.group = {
                                level: level,
                                begin: -1,
                                end: -1,
                                data: []
                        };
                }
                var group = this.group;
                var ll = level.lowIndex()  - 5;
                var lu = level.upIndex() + 5 ;
                var start = ll;
                var stop = lu;


                if (group.begin < 0 || group.end < 0) {
                        group.data = [];
                        for (var i = 0; i < window.config.channels; i++) {
                                group.data.push([]);
                        }

                        this.buildIntern(group, ll, lu);
                        return group;

                }
                /* Add to begin*/
                this.buildIntern(group, ll, group.begin);


                /* Add to end*/

                this.buildIntern(group, group.end, lu);

                group.begin = start;
                group.end = stop;

                return group;
        };

        /**
         *
         * @param level
         */
        this.redrawLevel = function (level)
        {
                level = level || this.currentLevel;

                if (path_container != null) {
                        path_container.remove();
                }

                path_container = container.append("g").attr("class", "path_container");

                var grp = this.buildGroup(level);
                this.drawTile(grp.data);

        };

        this.drawTile = function (tile)
        {
                if (!tile) return;
                tile.forEach(function (channel, index)
                             {
                                     if (!_this.disabledChans[index]) {
                                             _this.drawChannel(channel, index);
                                     }
                             });
        };

        this.drawChannel = function (channel, index)
        {
                if (!channel) return;

                if (channel[0].y) // Test if there is Y property
                {
                        // RAW_DATA
                        _this.drawPath(channel, index)
                }
                else {
                        _this.drawMinMax(channel, index);
                }
        };

        this.getSelectX = function (ix)
        {
                var invert = this.x.invert(ix + curr_shift);
                return invert;
        };

        this.drawMinMax = function (data, chan)
        {

                const cls = "line";

                path_container.append("path")
                    .datum(data)
                    .attr("class", cls)
                    .attr("style", STYLE_LINE)
                    .attr("id", "chan" + chan)
                    .attr("d", min_line);

                path_container.append("path")
                    .datum(data)
                    .attr("class", cls)
                    .attr("style", STYLE_LINE)
                    .attr("id", "chan" + chan)
                    .attr("d", min_line);

                path_container.append("path")
                    .datum(data)
                    .attr("class", cls)
                    .attr("style", STYLE_LINE)
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

        this.moveY = function (dir)
        {
                var min = this.domain.y[0];
                var max = this.domain.y[1];
                this.domain.y = [min + dir, max + dir];
                this.updateAxes();
        };

        this.scaleY = function (dir)
        {
                var min = this.domain.y[0];
                var max = this.domain.y[1];
                this.domain.y = [min + dir, max - dir];
                this.updateAxes();
        };

        this.scaleX = function (dir)
        {
                var min = this.domain.x[0];
                var max = this.domain.x[1];
                this.domain.x = [min + dir, max - dir];
                this.updateAxes();
        };

        this.drawPath = function (data, chan, mm)
        {
                var cls = "line";
                if (mm) {
                        cls += " " + mm;
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






