var big_graph = SAGE2_App.extend( {
    init: function(data) {
        // data: contains initialization parameters, such as `x`, `y`, `width`, `height`, and `date` 
        this.SAGE2Init("div", data);
        this.element.id = "container";

        this.resizeEvents = "continuous";//see below for other options

        // initialize your variables
        this.container_name = "container";
        this.host = "ws://localhost:10888/";
        this.drawer = new D3_handle( "#" + this.container_name);
        this.manager = new ApplicationManager(this.host, this.drawer);
        this.element.style.backgroundColor= "#DDD";


        this.initWidgets();

    },

    initWidgets: function()
    {
        var plusButton = {
            "state": 0,
            "from":"m 0 -6 l 0 12 m 6 -6 l -12 0", //svg paths
            "to":"m 6 0 l -12 0 m 6 6 l 0 -12",
            "width":12,
            "height":12,
            "fill":"none",
            "strokeWidth": 1,
            "delay": 600,
            "textual":false,
            "animation":true
        };
        this.controls.addButtonType("minus", plusButton)

        var minusButton = {
            "state": 0,
            "from":"m 0 -6 l 0 12 m 6 -6 l -12 0", //svg paths
            "to":"m 6 0 l -12 0 m 6 6 l 0 -12",
            "width":12,
            "height":12,
            "fill":"none",
            "strokeWidth": 1,
            "delay": 600,
            "textual":false,
            "animation":true
        };
        this.controls.addButtonType("minus", minusButton);

        this.controls.addButton({type:"plus", sequenceNo:1, id:"plus"});
        this.controls.addButton({type:"minus", seqeunceNo:2, id:"minus"});

    },

    //load function allows application to begin with a particular state.  Needed for remote site collaboration. 
    load: function(date) {
        //your load code here- update app based on this.state
    },

    draw: function(date) {
        // application specific 'draw'
        this.log("Draw");
    },

    resize: function(date) {
        var resize = new Event("resize");
        this.element.dispatchEvent(resize);
        this.refresh(date); //redraw after resize
    },

    event: function(type, position, user, data, date) {
        // see event handling description below

        // may need to update state here

        // may need to redraw 
        this.refresh(date);
    },

    move: function(date) {
        // this.sage2_x, this.sage2_y give x,y position of upper left corner of app in global wall coordinates
                // this.sage2_width, this.sage2_height give width and height of app in global wall coordinates
                // date: when it happened
        this.refresh(date);
       },

    quit: function() {
        // It's the end
                                 this.log("Done");
    }
});