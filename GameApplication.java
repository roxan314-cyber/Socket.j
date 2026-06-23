// Define el paquete principal de tu aplicación Java.
package com.example.socket;

// Importa la clase necesaria para ejecutar Spring Boot.
import org.springframework.boot.SpringApplication;
// Importa la anotación que auto-configura el servidor.
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Le indica a Java que este es el punto de inicio de una aplicación Spring Boot.
@SpringBootApplication
// Define la clase pública que contendrá el método principal.
public class GameApplication {
    // Es el método principal que se ejecuta al arrancar el programa.
    public static void main(String[] args) {
        // Inicializa y levanta el servidor web y WebSocket.
        SpringApplication.run(GameApplication.class, args);
    }
}