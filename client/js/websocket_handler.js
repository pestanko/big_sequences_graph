_this.data /**
 * Created by wermington on 12.7.2015.
 */


function ws_client(host)
{
    var wsocket = new WebSocket(host);

    wsocket.onopen = function(event)
    {
        console.log("Websocket connected to " + host)

    }

    wsocket.onmessage = function(event)
    {
        var message = JSON.parse(event.data)

        switch (message.type)
        {
            case "get":
                break;

            case "set":
                break;
            case "sync":
                break;
        }

    }

    wsocket.onerror = function(event)
    {
        var message = event.data
        console.log("ERROR: " +  message)
    }

    wsocket.onclose = function(event)
    {
        console.log("Websocket closed connection")
    }


    function getTile(tileNo)
    {
        // TODO
    }

}



