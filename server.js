const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
    port: PORT
});

let customer = null;
let agent = null;

function send(ws, data){

    if(
        ws &&
        ws.readyState === WebSocket.OPEN
    ){

        ws.send(
            JSON.stringify(data)
        );

    }

}

wss.on('connection', ws => {

    ws.on('message', raw => {

        let message;

        try{

            message = JSON.parse(
                raw.toString()
            );

        }catch(error){

            return;

        }

        if(message.type === 'register'){

            if(message.role === 'customer'){

                customer = ws;

            }

            if(message.role === 'agent'){

                agent = ws;

            }

            send(ws, {
                type:'registered',
                role:message.role
            });

            return;

        }

        if(message.type === 'call'){

            send(agent, {
                type:'incoming',
                name:message.name,
                offer:message.offer
            });

            return;

        }

        if(message.type === 'answer'){

            send(customer, {
                type:'answer',
                answer:message.answer
            });

            return;

        }

        if(message.type === 'candidate'){

            const target =
                ws === customer
                    ? agent
                    : customer;

            send(target, {
                type:'candidate',
                candidate:message.candidate
            });

            return;

        }

        if(message.type === 'end'){

            send(customer, {
                type:'ended'
            });

            send(agent, {
                type:'ended'
            });

            return;

        }

    });

    ws.on('close', () => {

        if(ws === customer){

            customer = null;

        }

        if(ws === agent){

            agent = null;

        }

    });

    ws.on('error', error => {

        console.error(
            'WebSocket error:',
            error
        );

    });

});

wss.on('listening', () => {

    console.log(
        `CallPilot signaling server running on port ${PORT}`
    );

});

wss.on('error', error => {

    console.error(
        'WebSocket server error:',
        error
    );

});