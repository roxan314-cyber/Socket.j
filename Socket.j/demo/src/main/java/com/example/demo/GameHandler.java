package com.example.demo;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.io.IOException;

public class GameHandler extends TextWebSocketHandler {
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("Jugador conectado. ID: " + session.getId());
    }
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    String payload = message.getPayload();
    for (WebSocketSession s : sessions) {
        if (s.isOpen()) {
            s.sendMessage(new TextMessage(payload));
        }
    }
}
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("Jugador desconectado. ID: " + session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("Error en la conexión con " + session.getId() + ": " + exception.getMessage());
        if (session.isOpen()) {
            session.close();
        }
    }
}