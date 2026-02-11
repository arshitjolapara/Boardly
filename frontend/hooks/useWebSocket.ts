import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

export function useWebSocket(boardId: string | null, onMessage: (message: WebSocketMessage) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!boardId || typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Use current host and port, change http to ws
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // If we are on localhost, assume backend is at :8000
        const backendHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.hostname}:8000`
            : window.location.host;

        const wsUrl = `${protocol}//${backendHost}/api/v1/ws/${boardId}?token=${token}`;
        console.log('Connecting to WebSocket:', wsUrl);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                onMessage(message);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        socket.onclose = (event) => {
            console.log('WebSocket disconnected', event.reason);
            // Reconnect after 3 seconds if not closed cleanly
            if (event.code !== 1000 && boardId) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            socket.close();
        };
    }, [boardId, onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000); // Normal closure
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return {
        isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    };
}
