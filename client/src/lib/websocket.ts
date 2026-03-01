/**
 * WebSocket client for real-time property search interpretations
 * This module provides a singleton WebSocket connection for the application
 */

import { useEffect, useState } from 'react';

// WebSocket singleton instance
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
const messageListeners: Function[] = [];
const MAX_RECONNECT_DELAY = 5000;

/**
 * Initialize WebSocket connection
 */
export function initWebSocket() {
  if (socket) return;
  
  try {
    // Create WebSocket with the correct protocol and path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      
      // Clear any reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Notify all listeners
        messageListeners.forEach(listener => {
          listener(data);
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      
      // Clean up the socket
      socket = null;
      
      // Attempt to reconnect
      if (!reconnectTimer) {
        const delay = Math.floor(Math.random() * MAX_RECONNECT_DELAY) + 1000;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          initWebSocket();
        }, delay);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
  }
}

/**
 * Send a message through the WebSocket
 */
export function sendMessage(message: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket not connected, attempting to reconnect');
    initWebSocket();
    // Queue the message to be sent on connection
    setTimeout(() => sendMessage(message), 1000);
    return;
  }
  
  try {
    socket.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
  }
}

/**
 * Add a message listener
 */
export function addMessageListener(listener: Function) {
  messageListeners.push(listener);
  return () => {
    const index = messageListeners.indexOf(listener);
    if (index !== -1) {
      messageListeners.splice(index, 1);
    }
  };
}

/**
 * Hook for using WebSocket search interpretation
 */
export function useWebSocketSearch() {
  const [searchInterpretation, setSearchInterpretation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize WebSocket
    initWebSocket();
    
    // Add message listener
    const removeListener = addMessageListener((data: any) => {
      if (data.type === 'search_interpretation') {
        setSearchInterpretation(data.data);
        setIsLoading(false);
        setError(null);
      } else if (data.type === 'error') {
        setError(data.message);
        setIsLoading(false);
      }
    });
    
    // Clean up
    return () => {
      removeListener();
    };
  }, []);
  
  // Function to send search query
  const searchProperties = (query: string) => {
    setIsLoading(true);
    setError(null);
    
    sendMessage({
      type: 'property_search',
      query
    });
  };
  
  return {
    searchInterpretation,
    isLoading,
    error,
    searchProperties
  };
}