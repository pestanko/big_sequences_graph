var big_graph = SAGE2_App.extend(
    {
            init: function (data)
            {
                    // data: contains initialization parameters, such as `x`, `y`, `width`, `height`, and `date`
                    this.SAGE2Init("div", data);
                    this.element.id = "container";


                    this.resizeEvents = "continuous"; //see below for other options

                    // initialize your variables
                    this.container_name = "container";
                    this.host = "ws://localhost:10888/";
                    this.drawer = new D3Drawer("#" + this.container_name);
                    this.manager = new ApplicationManager(this.host, this.drawer);
                    this.element.style.backgroundColor = "#DDD";

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
                    this.controls.addButton({type: "loop", position: 4, identifier: "Reload"});
                    this.controls.addButton({type: "refresh", position: 5, identifier: "Refresh"});

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
                    this.log("Draw");
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

                            var x = position.x + this.element.getElementsByTagName("svg")[0].scrollLeft;

                            var y = position.y + this.element.getElementsByTagName("svg")[0].scrollTop;

                            console.log(x, y);
                            this.element.elementFromPoint(x, y).click();
                    }
                    if (eventType === "pointerMove") {
                    }
                    if (eventType === "pointerRelease" && (data.button === "left")) {
                    }

                    if (eventType === "pointerScroll") {
                            this.drawer.scaleX(data.wheelDelta);
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
                                            this.manager.moveLevel(+1);
                                            break;
                                    case "Down":
                                            this.manager.moveLevel(-1);
                                            break;
                                    case "ZoomIn":
                                            this.manager.scaleX(-500);
                                        this.manager.draw();

                                            break;
                                    case "ZoomOut":
                                            this.manager.scaleX(500);
                                            this.manager.draw();

                                            break;
                                    case "Reload":
                                            this.manager.reload();
                                            break;
                                    case "Refresh":
                                            this.manager.connect();
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
