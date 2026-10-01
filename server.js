const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
    port: PORT
});

let kitchen = null;

function send(ws, data)
{

    if(
        ws &&
        ws.readyState === WebSocket.OPEN
    ){

        ws.send(
            JSON.stringify(data)
        );

    }

}


wss.on('connection', function(ws)
{
    ws.on('message', function(raw)
    {

        let message;

        try {

            message = JSON.parse(
                raw.toString()
            );

        } catch(error) {

            console.error(
                'Invalid JSON'
            );

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Kitchen registration
        |--------------------------------------------------------------------------
        */

        if(
            message.type === 'register' &&
            message.role === 'kitchen'
        ){

            kitchen = ws;

            /*
            | Reply to kitchen
            */

            send(kitchen, {

                type: 'kitchen_status',
                message: 'Kitchen Connected'

            });


            return;

        }

    });


    ws.on('close', function()
    {

        if(ws === kitchen){

            kitchen = null;

            console.log(
                'Kitchen disconnected'
            );

        }

    });


    ws.on('error', function(error)
    {

        console.error(
            'WebSocket error:',
            error
        );

    });

});


wss.on('listening', function()
{

    console.log(
        `WSS server running on port ${PORT}`
    );

});
