var big_graph = SAGE2_App.extend(
    {
	    openConnection: function()
	    {
		    this.drawer = new D3Drawer("#" + this.container_name);
                    this.manager = new ApplicationManager(this.host, this.drawer);
                    this.element.style.backgroundColor = "#DDD";
                    this.position = {x: 0, y: 0};
                    this.dragging = false;
	    },
	    
            init: function (data)
            {
                    // data: contains initialization parameters, such as `x`, `y`, `width`, `height`, and `date`
                    this.SAGE2Init("div", data);
                    this.element.id = "container";

                    this.resizeEvents = "continuous"; //see below for other options

                    // initialize your variables
                    this.container_name = "container";
                    this.host = "ws://localhost:10888/";
                    this.openConnection();
                    this.initializeWidgets();
            },

            initializeWidgets: function ()
            {
                    this.controls.addButton({type: "rewind", position: 1, identifier: "Back"});
                    this.controls.addButton({type: "fastforward", position: 2, identifier: "Forward"});

                    this.controls.addButton({type: "prev", position: 6, identifier: "Left"});
                    this.controls.addButton({type: "next", position: 7, identifier: "Right"});
                    this.controls.addButton({type: "up-arrow", position: 8, identifier: "Up"});
                    this.controls.addButton({type: "down-arrow", position: 9, identifier: "Down"});

                    this.controls.addButton({type: "zoom-in", position: 10, identifier: "ZoomIn"});
                    this.controls.addButton({type: "zoom-out", position: 11, identifier: "ZoomOut"});

                    this.controls.addButton({type: "refresh", position: 5, identifier: "Refresh"});
                    this.controls.addTextInput({value: "ws://localhost:9292", identifier: "Address"});
                    this.controls.finishedAddingControls();

            },

            //load function allows application to begin with a particular state.  Needed for remote site collaboration.
            load: function (date)
            {
                    //your load code here- update app based on this.state
            },

            draw: function (date)
            {
                    // application specific 'draw'

                    //this.ctx.fillText("FPS: " + (1000.0 / (date.getTime() - this.lastDate.getTime())).toFixed(0), 10, 20);
                  /*  var date = new Date();
                    var n = date.getTime();
                    var ld = this.lastDate.getTime();
                    if(!ld)
                            ld = n;
                    d3.svg.text("FPS: " + (1000.0 / (n - ld)).toFixed(0) );*/


            },

            resize: function (date)
            {
                    var resize = new Event("resize");
                    this.element.dispatchEvent(resize);
                    this.manager.reload();
                    this.refresh(date); //redraw after resize
            },

            event: function (eventType, position, user_id, data, date)
            {
                    // see event handling description below

                    if (eventType === "pointerPress" && (data.button === "left")) {

                            this.dragging = true;
                            this.position.x = position.x;
                            this.position.y = position.y;
                    }
                    if (eventType === "pointerMove" && this.dragging) {

                            var diff_y = this.position.y - position.y;
                            var diff_x = this.position.x - position.x;
                            this.drawer.scaleY(diff_y / 2);
                            this.manager.movePosNoDraw(diff_x);
                            this.drawer.drawLevel();
                            this.position.x = position.x;
                            this.position.y = position.y;
                            this.refresh(date);

                    }
                    if (eventType === "pointerRelease" && (data.button === "left")) {
                            this.dragging = false;
                            this.position.x = position.x;
                            this.position.y = position.y;
                    }

                    if (eventType === "pointerScroll") {
                            console.log("Scrooling! [%d]", data.wheelDelta);
                            this.manager.scaleX(data.wheelDelta);
			    this.refresh(date);
                    }

                    if (eventType === "widgetEvent") {
                            switch (data.identifier) {
                                    case "Back":
                                            this.manager.moveTile(-1);

                                            break;
                                    case "Forward":
                                            this.manager.moveTile(+1);

                                            break;
                                    case "Left":
                                            this.manager.movePos(-2);

                                            break;
                                    case "Right":
                                            this.manager.movePos(2);

                                            break;
                                    case "Up":
                                            this.drawer.moveY(+1);

                                            break;
                                    case "Down":
                                            this.drawer.moveY(-1);

                                            break;
                                    case "ZoomIn":
                                            this.manager.scaleX(-5);
                                            this.manager.draw();
                                            break;
                                    case "ZoomOut":
                                            this.manager.scaleX(+5);
                                            this.manager.draw();

                                            break;
                                    case "Reload":
                                            this.manager.reload();

                                            break;
                                    case "Refresh":
                                            this.manager.connect();

                                            break;
                                    case "Address":
                                        this.host = data.text;
                                   	this.openConnection();
					//this.refresh(date);
                                    break;
				    
                                    default:
                                            console.log("No handler for:", data.identifier);
                            }
                    }

                    // may need to update state here

                    // may need to redraw
		    this.refresh(date);
                    
            },

            move: function (date)
            {
                    // this.sage2_x, this.sage2_y give x,y position of upper left corner of app in global wall coordinates
                    // this.sage2_width, this.sage2_height give width and height of app in global wall coordinates
                    // date: when it happened
                    this.refresh(date);
            },

            quit: function ()
            {
                    // It's the end
                    this.log("Done");
            }
    });
