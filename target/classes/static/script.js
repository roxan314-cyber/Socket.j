document.addEventListener("DOMContentLoaded", () => {
    const miId = Math.random().toString(36).substring(2, 10);

    const socket = new WebSocket("ws://localhost:8081/juego");
        socket.onopen = () => console.log("WebSocket abierto");
        socket.onerror = (err) => console.log("Error WS", err);
        socket.onclose = (event) => console.log("WebSocket cerrado", event);
    const board = document.getElementById('checkers-board');
    let seleccionada = null;
    const audioMovimiento = new Audio('movimiento.mp3'); 

    function reproducirSonido() {
        audioMovimiento.currentTime = 0;
        audioMovimiento.play().catch(e => console.log("Interacción necesaria para sonido"));
    }

    const sidebar = document.getElementById('sidebar');
    document.getElementById('menu-btn').addEventListener('click', () => sidebar.classList.add('active'));
    document.getElementById('close-btn').addEventListener('click', () => sidebar.classList.remove('active'));

    document.getElementById('btn-how-to-play').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Instrucciones: Mueve tus fichas en diagonal. Si saltas sobre una ficha rival, la capturas.");
    });
    document.getElementById('btn-settings').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Configuración: Aquí puedes ajustar el volumen o cambiar el tema del tablero (próximamente).");
    });
    document.getElementById('btn-chat-room').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Sala de Chat: Escribe en el cuadro de texto inferior para hablar con tu rival.");
    });
    document.getElementById('btn-abandonar').addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm("¿Estás seguro de que quieres abandonar la partida?")) window.location.reload(); 
    });

    function createBoard() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(r + c) % 2 !== 0 ? 'dark' : 'light'}`;
                cell.dataset.row = r; cell.dataset.col = c;

                if ((r + c) % 2 !== 0 && (r < 3 || r > 4)) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${r < 3 ? 'black' : 'white'}`;
                    cell.appendChild(piece);
                }
                cell.addEventListener('click', () => procesarClic(r, c, cell));
                board.appendChild(cell);
            }
        }
    }

    function procesarClic(r, c, cell) {
        const pieza = cell.querySelector('.piece');
        if (seleccionada) {
            const origen = { r: parseInt(seleccionada.dataset.row), c: parseInt(seleccionada.dataset.col) };
            const color = seleccionada.querySelector('.piece').classList.contains('white') ? 'white' : 'black';
            
            const diffR = Math.abs(r - origen.r);
            const diffC = Math.abs(c - origen.c);
            let fichaComida = (diffR === 2 && diffC === 2) ? 
                { r: (r + origen.r) / 2, c: (c + origen.c) / 2 } : null;

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ 
                    tipo: 'movimiento', 
                    origen, 
                    destino: { r, c }, 
                    color,
                    fichaComida 
                }));
            } else {
                console.warn('No se puede enviar el movimiento: WebSocket no está abierto.');
            }
            seleccionada = null;
        } else if (pieza) {
            seleccionada = cell;
        }
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.tipo === 'movimiento') {
            const cOrigen = document.querySelector(`[data-row="${data.origen.r}"][data-col="${data.origen.c}"]`);
            const cDestino = document.querySelector(`[data-row="${data.destino.r}"][data-col="${data.destino.c}"]`);
            reproducirSonido();

            if (cOrigen && cDestino) {
                const piezaMover = cOrigen.querySelector('.piece');
                if (piezaMover) cDestino.appendChild(piezaMover);
            }

            if (data.fichaComida) {
                const cComida = document.querySelector(`[data-row="${data.fichaComida.r}"][data-col="${data.fichaComida.c}"]`);
                if (cComida) cComida.querySelector('.piece')?.remove();
                if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
            }
        } else if (data.tipo === 'chat') {
            const div = document.createElement('div');
            // NUEVO: Verificamos si el mensaje lo enviamos nosotros o el rival usando el ID
            div.className = (data.senderId === miId) ? 'msg me' : 'msg rival'; 
            div.textContent = data.msg;
            document.getElementById('chat-messages').appendChild(div);

            // NUEVO: Hacemos scroll automático para ver el mensaje más reciente
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    document.getElementById('send-msg-btn').addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        if (input.value.trim() !== "") {
            if (socket.readyState === WebSocket.OPEN) {
                // NUEVO: Adjuntamos nuestro ID al enviar el mensaje
                socket.send(JSON.stringify({ 
                    tipo: 'chat', 
                    msg: input.value,
                    senderId: miId
                }));
                input.value = '';
            } else {
                console.warn('No se puede enviar el mensaje: WebSocket no está abierto.');
            }
        }
    });

    createBoard();
});