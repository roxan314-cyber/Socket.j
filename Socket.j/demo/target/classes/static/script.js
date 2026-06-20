document.addEventListener("DOMContentLoaded", () => {
    const socket = new WebSocket("ws://localhost:8080/game");
    socket.onopen = () => console.log("Conexión establecida con éxito");
    socket.onerror = (error) => console.error("Error de WebSocket:", error);
    const board = document.getElementById('checkers-board');
    let seleccionada = null;
    const audioMovimiento = new Audio('movimiento.mp3');
    function reproducirSonido() {
        audioMovimiento.currentTime = 0;
        audioMovimiento.play().catch(e => console.log("Audio requiere interacción"));
    }
    function animarDesaparicion(elemento) {
        elemento.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        elemento.style.opacity = "0";
        elemento.style.transform = "scale(0)";
        setTimeout(() => elemento.remove(), 600);
    }
    function createBoard() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(r + c) % 2 !== 0 ? 'dark' : 'light'}`;
                cell.dataset.row = r;
                cell.dataset.col = c;
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
            if (pieza) { seleccionada = cell; return; }

            socket.send(JSON.stringify({
                type: 'movimiento',
                origen: {
                },
                destino: { r: r, c: c }
            }));
            seleccionada = null;
        } else if (pieza) {
            seleccionada = cell;
        }
    }
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'movimiento') {
            const cOrigen = document.querySelector(`[data-row="${data.origen.r}"][data-col="${data.origen.c}"]`);
            const cDestino = document.querySelector(`[data-row="${data.destino.r}"][data-col="${data.destino.c}"]`);

            reproducirSonido();

            if (cOrigen && cDestino) {
                const piezaMover = cOrigen.querySelector('.piece');
                if (piezaMover) cDestino.appendChild(piezaMover);
            }
            if (data.fichaComida) {
                const cComida = document.querySelector(`[data-row="${data.fichaComida.r}"][data-col="${data.fichaComida.c}"]`);
                const piezaComida = cComida?.querySelector('.piece');
                if (piezaComida) {
                    animarDesaparicion(piezaComida);
                    if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 50, origin: { y: 0.7 } });
                }
            }
        } else if (data.type === 'chatMessage') {
            const chatMessages = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = 'msg rival';
            div.textContent = data.msg;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };
    createBoard();
    document.getElementById('btn-how-to-play').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Instrucciones: Mueve tus fichas en diagonal. Si saltas sobre una ficha rival, la capturas. ¡Gana quien elimine todas las piezas del oponente!");
    });
    document.getElementById('btn-settings').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Configuración: Aquí puedes ajustar el volumen o cambiar el tema del tablero.");
    });
    document.getElementById('btn-chat-room').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Sala de Chat: Escribe en el cuadro de texto inferior para hablar con tu rival.");
    });
    document.getElementById('btn-abandonar').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("¿Estás seguro de que quieres abandonar la partida?")) {
            window.location.reload();
        }
    });
});