// Ubicación del archivo en el proyecto.
package com.example.socket;

// Importa los estados de cierre de conexión.
import org.springframework.web.socket.CloseStatus;
// Importa el formato de mensaje de texto (JSON).
import org.springframework.web.socket.TextMessage;
// Importa la clase que representa a un usuario conectado.
import org.springframework.web.socket.WebSocketSession;
// Importa la clase base para manejar mensajes.
import org.springframework.web.socket.handler.TextWebSocketHandler;

// Importa la lista dinámica.
import java.util.ArrayList;
// Importa la interfaz de la lista.
import java.util.List;

// Extiende la clase base para crear nuestro propio gestor.
public class GameHandler extends TextWebSocketHandler {

    // Crea una lista vacía para guardar a los jugadores.
    private final List<WebSocketSession> sessions = new ArrayList<>();

    // Sobrescribe el método de conexión.
    @Override
    // Se ejecuta cuando un jugador entra.
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Añade al nuevo jugador a la lista de sesiones.
        sessions.add(session);
        // Imprime en la consola el ID del jugador.
        System.out.println("Jugador conectado. ID: " + session.getId());

        // Asigna blanco al jugador impar y negro al par.
        String miColor = (sessions.size() % 2 != 0) ? "white" : "black";
        // Crea un JSON con el color.
        String msjRol = String.format("{\"tipo\": \"asignar_rol\", \"color\": \"%s\"}", miColor);
        // Le envía por socket el JSON al jugador recién conectado.
        session.sendMessage(new TextMessage(msjRol));

        // Revisa si hay dos o más jugadores conectados.
        if (sessions.size() >= 2) {
            // Prepara mensaje de inicio.
            String msjInicio = "{\"tipo\": \"inicio_juego\", \"mensaje\": \"¡El rival se ha conectado!\"}";
            // Recorre todos los jugadores conectados.
            for (WebSocketSession s : sessions) {
                // Si están conectados, les avisa que el juego empezó.
                if (s.isOpen()) s.sendMessage(new TextMessage(msjInicio));
            }
        }
    }

    // Sobrescribe el método de recepción de mensajes.
    @Override
    // Se ejecuta al recibir data.
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Extrae el texto (JSON) que envió el jugador.
        String payload = message.getPayload();
        
        // Revisa toda la lista de jugadores.
        for (WebSocketSession webSocketSession : sessions) {
            // Verifica que no sea el mismo que envió el mensaje.
            if (webSocketSession.isOpen() && !webSocketSession.getId().equals(session.getId())) {
                // Reenvía el mensaje al rival.
                webSocketSession.sendMessage(new TextMessage(payload));
            }
        }
    }

    // Sobrescribe el método de desconexión.
    @Override
    // Ejecuta al perder conexión.
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Elimina al jugador desconectado de la lista.
        sessions.remove(session);
        // Avisa por consola.
        System.out.println("Jugador desconectado. ID: " + session.getId());
        // Mensaje de aviso.
        String msjDesconexion = "{\"tipo\": \"desconexion\", \"mensaje\": \"Tu rival se ha desconectado.\"}";
        // Recorre los jugadores restantes.
        for (WebSocketSession s : sessions) {
            // Les envía la alerta de abandono.
            if (s.isOpen()) s.sendMessage(new TextMessage(msjDesconexion)); 
        }
    }
}