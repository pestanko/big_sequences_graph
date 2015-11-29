/**
 * Created by Peter Stanko on 13.7.2015.
 */




function D3Drawer(main_container_name)
{
        var main_container = d3.select(main_container_name);
        var main_node = main_container.node();
        this.log = Logger;
        this.currentLevel = null;

        this.selectLine = {
                x: 0,
                show: false
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
        var container = null;
        this.domain = window.icfg.domain;
        this.domain.x = [0, 900];
        this.domain.y = [0, 2000];
        this.strokeColor = "steelblue";
        this.areaColor = "steelblue";

        this.drawTiles = true;

        this.pos = window.icfg.position;
        this.disabledChans = [];

        this.group = {
                level: null,
                begin: -1,
                end  : -1,
                data : []
        };

        const STYLE_AXIS = " fill: none;stroke: #000";

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
                    .attr("id", "x_axis")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                container.append("g")
                    .attr("id", "y_axis")
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
                }

                var interval = setInterval(reqTilesWait, 100);
        };

        this.buildIntern = function (group, start, stop)
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
                if (this.group.level != level) {
                        this.group = {
                                level: level,
                                begin: -1,
                                end  : -1,
                                data : []
                        };
                }
                var group = this.group;
                var ll = level.lowIndex();
                var lu = level.upIndex() + 2;
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


        this.transformXCoord = function(coor)
        {
                var range = this.x.range();
                var domain = this.x.domain();
                var one_step = (domain[1] - domain[0]) / (range[1] - range[0]);
                return coor * one_step;
        };

        this.transformYCoord = function(coor)
        {
                var range = this.y.range();
                var domain = this.y.domain();
                var one_step = (domain[1] - domain[0]) / (range[1] - range[0]);
                return coor * one_step;
        };


        /**
         *
         * @param level
         */
        this.redrawLevel = function (level)
        {
                level = level || this.currentLevel;

                var area = d3.selectAll(".removable");

                if (area.length) {
                        area.remove();
                }

                //path_container = container.append("g").attr("class", "path_container");

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
                var area_mm = d3.svg.area()
                    .x(max_line.x())
                    .y0(min_line.y())
                    .y1(max_line.y());

                container.append("path")
                    .datum(data)
                    .attr("class", " removable area" + chan)
                    .attr("d", area_mm)
                    .attr("fill", this.strokeColor);

                this.drawSelectLine();


        };

        this.drawSelectLine = function(posx)
        {
                if(posx) {
                        var offset = $('#y_axis')[0].getBBox().width;
                        this.selectLine.x = this.transformXCoord(posx - offset) + this.domain.x[0];
                }
                if(!this.selectLine.show) return;

                const STYLE_SELECT = STYLE_AXIS + "shape-rendering: crispEdges;stroke: " + "red" +
                                     ";stroke-width: 1.2px;";
                var _x = _this.x(this.selectLine.x);
                console.log("[%f] -> [%f]", this.selectLine.x, _x);

                container.append("line")
                    .attr("style", STYLE_SELECT)
                    .attr("id", "select_line")
                    .attr("class", "removable")
                    .attr("x1", _x)
                    .attr("x2", _x)
                    .attr("y1", this.y(this.domain.y[0]))
                    .attr("y2", this.y(this.domain.y[1]));
        };

        this.moveY = function (dir)
        {
                var min = this.domain.y[0];
                var max = this.domain.y[1];
                this.y.domain(this.domain.y);
                dir = this.transformYCoord(dir);
                this.domain.y = [min + dir, max + dir];
                this.updateAxes();
        };

        this.scaleY = function (dir)
        {
                var min = this.domain.y[0];
                var max = this.domain.y[1];
                var one_step = this.transformYCoord(dir);
                one_step *= window.icfg.scaleSpeedY;
                this.log.debug("(scaleY): Scaling by  [%d] -> [%d]", dir, one_step);
                this.domain.y = [min + one_step, max - one_step];
                this.updateAxes();
                return one_step;
        };

        this.scaleX = function (dir)
        {
                var min = this.domain.x[0];
                var max = this.domain.x[1];
                var coord_min = min;
                var coord_max = max;
                var one_step = this.transformXCoord(dir);
                one_step *= window.icfg.scaleSpeedX;
                this.log.debug("(scaleX): Scaling by  [%d] -> [%d]", dir, one_step);
                this.domain.x = [coord_min + one_step, coord_max - one_step];
                this.updateAxes();
                return one_step;
        };

        this.drawPath = function (data, chan, mm)
        {
                var cls = "line";
                if (mm) {
                        cls += " " + mm;
                }
                const STYLE_LINE = STYLE_AXIS + "shape-rendering: crispEdges;stroke: " + this.strokeColor +
                                   ";stroke-width: 1.2px;";


                this.drawSelectLine();

                container.append("path")
                    .datum(data)
                    .attr("style", STYLE_LINE)
                    .attr("class", "line removable")
                    .attr("id", "chan" + chan)
                    .attr("d", line);
                return line;
        };

        this.reload();

}






