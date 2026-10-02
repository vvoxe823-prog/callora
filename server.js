const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
    port: PORT
});


/*
|--------------------------------------------------------------------------
| Kitchen
|--------------------------------------------------------------------------
*/

let kitchen = null;

/*
|--------------------------------------------------------------------------
| Customers
|--------------------------------------------------------------------------
*/

const customers = new Map();

let customerCounter = 1000;

/*
|--------------------------------------------------------------------------
| Send data
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| WebSocket connection
|--------------------------------------------------------------------------
*/

wss.on('connection', function(ws)
{

    /*
    |--------------------------------------------------------------------------
    | Message received
    |--------------------------------------------------------------------------
    */

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

            send(kitchen, {

                type: 'kitchen_status',
                message: 'Kitchen Connected'

            });


            /*
            | Send existing customers to kitchen
            */

            customers.forEach(function(
                customer,
                customerId
            ){

                send(kitchen, {

                    type: 'customer_connected',
                    customerId: customerId

                });

            });


            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Customer registration
        |--------------------------------------------------------------------------
        */

        if(
            message.type === 'register' &&
            message.role === 'customer'
        ){

            customerCounter++;

            const customerId =
                'customer_' +
                customerCounter;


            /*
            | Store customer WebSocket
            */

            customers.set(
                customerId,
                ws
            );


            /*
            | Store ID on WebSocket itself
            */

            ws.customerId =
                customerId;


            console.log(
                'Customer connected:',
                customerId
            );


            /*
            | Tell customer their ID
            */

            send(ws, {

                type: 'customer_registered',
                customerId: customerId

            });


            /*
            | Tell kitchen a new customer
            | has connected
            */

            send(kitchen, {

                type: 'customer_connected',
                customerId: customerId

            });


            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Customer sends message
        |--------------------------------------------------------------------------
        */

        if(
            message.type === 'message' &&
            ws.customerId
        ){

            console.log(
                ws.customerId +
                ': ' +
                message.text
            );


            /*
            | Send message to kitchen
            */

            send(kitchen, {

                type: 'customer_message',

                customerId:
                    ws.customerId,

                text:
                    message.text

            });


            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Kitchen sends message to customer
        |--------------------------------------------------------------------------
        */

        if(
            message.type === 'message' &&
            ws === kitchen
        ){

            const customerSocket =
                customers.get(
                    message.customerId
                );


            send(customerSocket, {

                type: 'kitchen_message',

                text:
                    message.text

            });


            return;

        }

    });


    /*
    |--------------------------------------------------------------------------
    | Connection closed
    |--------------------------------------------------------------------------
    */

    ws.on('close', function()
    {

        /*
        | Kitchen disconnected
        */

        if(ws === kitchen){

            kitchen = null;


            console.log(
                'Kitchen disconnected'
            );

        }


        /*
        | Customer disconnected
        */

        if(ws.customerId){

            const customerId =
                ws.customerId;


            customers.delete(
                customerId
            );


            console.log(
                'Customer disconnected:',
                customerId
            );


            /*
            | Tell kitchen
            */

            send(kitchen, {

                type: 'customer_disconnected',

                customerId:
                    customerId

            });

        }

    });


    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    ws.on('error', function(error)
    {

        console.error(
            'WebSocket error:',
            error
        );

    });

});


/*
|--------------------------------------------------------------------------
| Server started
|--------------------------------------------------------------------------
*/

wss.on('listening', function()
{

    console.log(
        `Bar chat server running on port ${PORT}`
    );

});
