// Espera a que la página web cargue completamente antes de ejecutar el código.
document.addEventListener("DOMContentLoaded", () => {
    // Genera un código aleatorio único para identificar a este jugador en el chat.
    const miId = Math.random().toString(36).substring(2, 10);
    // URL de conexión al servidor WebSocket (Asegúrate de poner tu IP real aquí).
    const wsUrl = `ws://192.168.1.2:8081/game`;
    // Crea la conexión en tiempo real con el servidor.
    const socket = new WebSocket(wsUrl);
    // Variable para almacenar qué color de fichas nos asignó el servidor.
    let miColor = null;
    // Bandera para bloquear el juego hasta que el oponente se conecte.
    let juegoIniciado = false;
    // Imprime un mensaje de éxito en la consola si se conecta al servidor.
    socket.onopen = () => console.log("WebSocket abierto exitosamente en:", wsUrl);
    // Muestra un mensaje de error en la consola si falla la conexión.
    socket.onerror = (err) => console.error("Error WS", err);
    // Avisa en la consola si la conexión con el servidor se cierra.
    socket.onclose = (event) => console.log("WebSocket cerrado", event);
    // Selecciona el elemento contenedor del tablero en el HTML.
    const board = document.getElementById('checkers-board');
    // Selecciona el texto de la pantalla que muestra el estado del rival.
    const statusRival = document.getElementById('opponent-name');
    // Guarda temporalmente la ficha que el jugador seleccionó para mover.
    let seleccionada = null;
    // Carga el archivo de sonido para reproducirlo en los movimientos.
    const audioMovimiento = new Audio('movimiento.mp3');
    // Función para encapsular la reproducción del sonido sin errores.
    function reproducirSonido() {
        // Reinicia el audio a 0 por si se reproduce muy rápido varias veces.
        audioMovimiento.currentTime = 0;
        // Intenta reproducir y oculta el error si el navegador bloquea el auto-play.
        audioMovimiento.play().catch(e => console.log("Interacción necesaria para sonido"));
    }
    
    // Selecciona el contenedor del menú lateral.
    const sidebar = document.getElementById('sidebar');
    // Muestra el menú lateral al hacer clic en el botón de hamburguesa.
    document.getElementById('menu-btn').addEventListener('click', () => sidebar.classList.add('active'));
    // Oculta el menú lateral al hacer clic en la X de cerrar.
    document.getElementById('close-btn').addEventListener('click', () => sidebar.classList.remove('active'));
    // Evento para mostrar las instrucciones al hacer clic en "Cómo jugar".
    document.getElementById('btn-how-to-play').addEventListener('click', (e) => {
        // Evita que la página intente recargarse al hacer clic en el enlace.
        e.preventDefault();
        // Muestra una ventana emergente con el texto.
        alert("Instrucciones: Mueve tus fichas en diagonal hacia adelante. Si saltas sobre una ficha rival, la capturas.");
    });

    // Evento para la configuración (futura funcionalidad).
    document.getElementById('btn-settings').addEventListener('click', (e) => {
        // Evita recargar la página.
        e.preventDefault();
        // Muestra el mensaje de aviso.
        alert("Configuración: Aquí puedes ajustar el volumen o cambiar el tema del tablero.");
    });

    // Evento para dar instrucciones sobre el chat.
    document.getElementById('btn-chat-room').addEventListener('click', (e) => {
        // Evita recargar la página.
        e.preventDefault();
        // Muestra el mensaje informativo.
        alert("Sala de Chat: Escribe en el cuadro de texto inferior para hablar con tu rival.");
    });

    // Evento para salir del juego.
    document.getElementById('btn-abandonar').addEventListener('click', (e) => {
        // Evita el comportamiento por defecto.
        e.preventDefault();
        // Pregunta confirmación; si el usuario acepta, recarga la página desconectándolo.
        if(confirm("¿Estás seguro de que quieres abandonar la partida?")) window.location.reload();
    });

    // Función encargada de dibujar los 64 cuadros y colocar las fichas.
    function createBoard() {
        // Bucle para crear las 8 filas (del 0 al 7).
        for (let r = 0; r < 8; r++) {
            // Bucle interno para crear las 8 columnas por cada fila.
            for (let c = 0; c < 8; c++) {
                // Crea un bloque div para representar una casilla.
                const cell = document.createElement('div');
                // Pinta la casilla oscura o clara dependiendo de sus coordenadas.
                cell.className = `cell ${(r + c) % 2 !== 0 ? 'dark' : 'light'}`;
                // Guarda el número de fila directamente en la casilla (HTML data-row).
                cell.dataset.row = r;
                // Guarda el número de columna (HTML data-col).
                cell.dataset.col = c;
                // Si la casilla es oscura y está en las primeras 3 o últimas 3 filas...
                if (((r + c) % 2 !== 0) && (r < 3 || r > 4)) {
                    // Crea un elemento div que será la ficha visual.
                    const piece = document.createElement('div');
                    // Asigna el color negro a las filas de arriba y blanco a las de abajo.
                    piece.className = `piece ${r < 3 ? 'black' : 'white'}`;
                    // Inserta la ficha dentro de la casilla.
                    cell.appendChild(piece);
                }
                // Agrega el evento para que la casilla responda a nuestros clics.
                cell.addEventListener('click', () => procesarClic(r, c, cell));
                // Añade la casilla terminada al tablero visual de la página.
                board.appendChild(cell);
            }
        }
    }

    // Lógica principal y validación de reglas cuando tocas una casilla.
    function procesarClic(r, c, cell) {
        // Bloquea cualquier intento de jugar si el rival no está conectado.
        if (!juegoIniciado) {
            // Informa el motivo en la consola oculta.
            console.log("Espera a que tu compañero se conecte a la partida.");
            // Detiene la ejecución aquí mismo.
            return;
        }

        // Busca si la casilla donde hicimos clic tiene una ficha adentro.
        const pieza = cell.querySelector('.piece');
        // Si no tenemos una ficha seleccionada aún, y la casilla clickeada tiene una...
        if (!seleccionada && pieza) {
            // Comprueba si la ficha tocada no es del color que nos toca jugar.
            if (!pieza.classList.contains(miColor)) {
                // Impide robarle el turno o mover las fichas del oponente.
                console.log("No puedes mover las fichas del rival.");
                return;
            }
        }

        // Si ya habíamos elegido una ficha antes (este clic es el destino a donde queremos ir).
        if (seleccionada) {
            // Extrae las coordenadas exactas de donde salió la ficha seleccionada.
            const origen = { r: parseInt(seleccionada.dataset.row), c: parseInt(seleccionada.dataset.col) };
            // Averigua si la ficha seleccionada es blanca o negra.
            const color = seleccionada.querySelector('.piece').classList.contains('white') ? 'white' : 'black';
            if (cell.querySelector('.piece')) {
                // Si la casilla está ocupada, cancela la selección.
                console.log("Movimiento inválido: La celda de destino está ocupada.");
                seleccionada = null;
                return;
            }

            // Calcula el movimiento real en las filas (positivo o negativo) para saber la dirección.
            const deltaR = r - origen.r;
            // Calcula la cantidad de filas avanzadas en número absoluto (sin signos).
            const diffR = Math.abs(deltaR);
            // Calcula la cantidad de columnas avanzadas en número absoluto.
            const diffC = Math.abs(c - origen.c);
            if (diffR !== diffC) {
                // Si se mueve recto como torre de ajedrez, lo bloquea.
                console.log("Movimiento inválido: Debes moverte en diagonal.");
                seleccionada = null;
                return;
            }

            // Las blancas siempre van de abajo hacia arriba (restan filas) y las negras de arriba a abajo (suman filas).
            if ((color === 'white' && deltaR > 0) || (color === 'black' && deltaR < 0)) {
                // Si la dirección es contraria a la permitida, bloquea el movimiento.
                console.log("Movimiento inválido: Las fichas normales no pueden retroceder.");
                seleccionada = null;
                return;
            }

            if (diffR > 2 || diffR === 0) {
                // Cancela si intentas cruzar todo el tablero de una vez.
                console.log("Movimiento inválido: Distancia no permitida.");
                seleccionada = null;
                return;
            }

            // Variable para almacenar a quién capturamos (si aplica).
            let fichaComida = null;
            if (diffR === 2) {
                // Calcula la fila exacta que quedó en medio del salto.
                const medioR = (r + origen.r) / 2;
                // Calcula la columna exacta que quedó en medio del salto.
                const medioC = (c + origen.c) / 2;
                // Busca la casilla central en el tablero HTML.
                const celdaMedio = document.querySelector(`[data-row="${medioR}"][data-col="${medioC}"]`);
                // Revisa si hay una ficha en esa casilla central.
                const piezaMedio = celdaMedio.querySelector('.piece');
                // Si la casilla central está vacía, o si la ficha que está ahí es nuestra...
                if (!piezaMedio || piezaMedio.classList.contains(color)) {
                    // Es un salto falso o suicida, por lo tanto, se bloquea.
                    console.log("Movimiento inválido: No hay pieza rival para capturar.");
                    seleccionada = null;
                    return;
                }
                // Si pasó la prueba, guardamos las coordenadas de la pieza enemiga derrotada.
                fichaComida = { r: medioR, c: medioC };
            }
            // Llegados aquí, el movimiento es legal. Verificamos conexión con el servidor.
            if (socket.readyState === WebSocket.OPEN) {
                // Actualiza visualmente el movimiento en nuestra pantalla de inmediato.
                cell.appendChild(seleccionada.querySelector('.piece'));
                // Si la jugada fue una captura...
                if (fichaComida) {
                    // Selecciona la casilla de la ficha devorada.
                    const celdaComida = document.querySelector(`[data-row="${fichaComida.r}"][data-col="${fichaComida.c}"]`);
                    // Destruye visualmente la ficha capturada de nuestro tablero.
                    if (celdaComida) celdaComida.querySelector('.piece')?.remove();
                }
                // Dispara el sonido clásico del movimiento de madera.
                reproducirSonido();
                // Construye el mensaje JSON y lo envía por WebSocket al otro jugador.
                socket.send(JSON.stringify({
                    // Indica el evento al servidor.
                    tipo: 'movimiento',
                    // Coordenadas de inicio.
                    origen,
                    // Coordenadas de destino legal.
                    destino: { r, c },
                    // Color de la pieza que se movió.
                    color,
                    // Datos de la ficha eliminada (o null si fue un avance normal).
                    fichaComida
                }));
            }
            // Borra la selección de la memoria para que podamos seguir jugando luego.
            seleccionada = null;
        // Si no teníamos nada seleccionado, pero tocamos una ficha válida de nuestro color...
        } else if (pieza) {
            // Guardamos esta casilla en memoria como nuestra ficha elegida para el próximo clic.
            seleccionada = cell;
        }
    }

    // Función que escucha y procesa todo lo que envía el servidor o el rival.
    socket.onmessage = (event) => {
        // Traduce el mensaje de texto JSON a variables útiles en Javascript.
        const data = JSON.parse(event.data);
        // Si el mensaje es la orden del servidor asignándonos un color...
        if (data.tipo === 'asignar_rol') {
            // Guardamos qué color somos.
            miColor = data.color;
            // Preparamos el texto en español para mostrarlo en pantalla.
            const textoStatus = miColor === 'white' ? "Fichas Blancas" : "Fichas Negras";
            // Lo inyectamos en el elemento del estado personal de la interfaz web.
            document.querySelector('.player-info.you strong').textContent = textoStatus;
            // Si nos tocó ser las piezas negras (que juegan desde arriba).
            if (miColor === 'black') {
                // Rotamos el tablero por CSS para tener nuestra perspectiva desde abajo.
                document.getElementById('checkers-board').classList.add('girado');
            }
        
        // Si el servidor nos notifica que la sala ya tiene a los 2 jugadores...
        } else if (data.tipo === 'inicio_juego') {
            // Levantamos la restricción y permitimos tocar el tablero.
            juegoIniciado = true;
            // Actualizamos la etiqueta del contrincante.
            statusRival.textContent = "¡Conectado!";
            // Le damos un color brillante para destacar que está listo.
            statusRival.style.color = "#d4af37";

        // Si el servidor detecta que el otro jugador cerró el navegador o perdió el WiFi...
        } else if (data.tipo === 'desconexion') {
            // Volvemos a bloquear el tablero porque no hay contra quién jugar.
            juegoIniciado = false;
            // Cambiamos el texto para informar la fuga del rival.
            statusRival.textContent = "Se ha desconectado...";
            // Pintamos el texto de rojo alarma.
            statusRival.style.color = "red";

        // Si recibimos un movimiento lícito del rival a través del socket...
        } else if (data.tipo === 'movimiento') {
            // Buscamos la casilla original de donde partió su ficha.
            const cOrigen = document.querySelector(`[data-row="${data.origen.r}"][data-col="${data.origen.c}"]`);
            // Buscamos la casilla a la que debe llegar su ficha.
            const cDestino = document.querySelector(`[data-row="${data.destino.r}"][data-col="${data.destino.c}"]`);
            // Hacemos sonar nuestro altavoz para saber que ya nos toca.
            reproducirSonido();

            // Verificamos que ambas casillas existan en nuestro tablero para evitar fallos.
            if (cOrigen && cDestino) {
                // Seleccionamos físicamente su ficha en nuestro HTML.
                const piezaMover = cOrigen.querySelector('.piece');
                // La trasladamos y aterrizamos en su nueva ubicación frente a nuestros ojos.
                if (piezaMover) cDestino.appendChild(piezaMover);
            }

            // Si además, su movimiento trajo la información de que nos devoró una pieza...
            if (data.fichaComida) {
                // Localizamos a nuestra ficha caída en desgracia.
                const cComida = document.querySelector(`[data-row="${data.fichaComida.r}"][data-col="${data.fichaComida.c}"]`);
                // La borramos de la existencia visual.
                if (cComida) cComida.querySelector('.piece')?.remove();
                // (Opcional) Lanzamos el confeti visual que instalaste para celebrar la captura.
                if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
            }

        // Si lo que recibimos por el socket fue un mensaje de chat...
        } else if (data.tipo === 'chat') {
            // Fabricamos una burbuja de chat flotante nueva (div).
            const div = document.createElement('div');
            // Le damos la clase 'me' (verde) si fuimos nosotros, o 'rival' (gris) si fue él.
            div.className = (data.senderId === miId) ? 'msg me' : 'msg rival';
            // Inyectamos el texto puro que escribió dentro de la burbuja.
            div.textContent = data.msg;
            // Colocamos la burbuja al final de la lista de mensajes en el menú.
            document.getElementById('chat-messages').appendChild(div);
            // Capturamos el contenedor grande del historial de chat.
            const chatMessages = document.getElementById('chat-messages');
            // Obligamos a la barra de scroll a bajar automáticamente hasta el último mensaje.
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    document.getElementById('send-msg-btn').addEventListener('click', () => {
        // Seleccionamos la barra de texto donde el jugador escribe.
        const input = document.getElementById('chat-input');
        // Verificamos que no esté enviando un mensaje vacío o lleno de espacios en blanco.
        if (input.value.trim() !== "") {
            // Comprobamos que seguimos conectados al servidor central de Java.
            if (socket.readyState === WebSocket.OPEN) {
                // Empaquetamos la información del chat y la disparamos por el socket.
                socket.send(JSON.stringify({
                    // Clasificamos este evento como puramente de 'chat'.
                    tipo: 'chat',
                    // Contenido del mensaje.
                    msg: input.value,
                    // Enviamos nuestra firma única para no confundir quién habló.
                    senderId: miId
                }));
                // Limpiamos la barra de texto para que el usuario pueda escribir de nuevo.
                input.value = '';
            }
        }
    }); 
    // Al finalizar de leer todo este código, dibujamos por primera vez el tablero inicial.
    createBoard();
});