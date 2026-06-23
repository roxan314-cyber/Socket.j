// Define el paquete de configuración.
package com.example.socket;

// Importa la anotación para clases de configuración.
import org.springframework.context.annotation.Configuration;
// Importa la anotación que enciende el WebSocket.
import org.springframework.web.socket.config.annotation.EnableWebSocket;
// Importa la interfaz para configurar sockets.
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
// Importa el registro de rutas de sockets.
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

// Indica que esta clase aporta configuraciones al proyecto.
@Configuration
// Habilita las funciones de WebSocket en el servidor.
@EnableWebSocket
// Implementa la interfaz de configuración de Spring.
public class WebSocketConfig implements WebSocketConfigurer {

     // Sobrescribe el método de la interfaz padre.
    @Override
    // Método para registrar las rutas del socket.
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Vincula la ruta "/game" con GameHandler y permite conexiones externas.
        registry.addHandler(new GameHandler(), "/game").setAllowedOrigins("*");
    }
}