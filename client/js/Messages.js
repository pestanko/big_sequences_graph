/**
 * Created by Peter Stanko on 11/23/15.
 */

function Messages(message_window, message_controls, message_status)
{

        this.icfg = window.icfg;
        this.conf = window.config;
        this.log = Logger;
        this.events = [];
        this.messages = [];


        this.addMessage = function(message)
        {
                var msg_node = document.createElement("li");
                message_window.appendChild(msg_node);
        }



}



