import { useEffect, useRef } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';

interface WebSocketMessage {
  type: 'queued' | 'processing' | 'completed' | 'error';
  assignmentId: string;
  position?: number;
  paperId?: string;
  message?: string;
}

export function useWebSocket(assignmentId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const { setGenerationStatus, fetchPaper } = useAssignmentStore();

  useEffect(() => {
    if (!assignmentId) return;

    function connect() {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;

        // Subscribe to assignment
        wsRef.current?.send(
          JSON.stringify({
            type: 'subscribe',
            assignmentId,
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.assignmentId === assignmentId) {
            switch (message.type) {
              case 'queued':
                setGenerationStatus('queued');
                console.log(`Position in queue: ${message.position}`);
                break;
              case 'processing':
                setGenerationStatus('processing');
                console.log('Paper generation started');
                break;
              case 'completed':
                setGenerationStatus('completed');
                console.log(`Paper generated: ${message.paperId}`);
                fetchPaper(assignmentId);
                break;
              case 'error':
                setGenerationStatus('error');
                console.error(`Error: ${message.message}`);
                break;
            }
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, delay);
        }
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [assignmentId, setGenerationStatus, fetchPaper]);

  return wsRef.current;
}
