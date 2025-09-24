'use client'

import React, { useState, useRef, useEffect } from 'react'

interface WebSocketTesterProps {
  selectedDex?: 'pump-fun' | 'meteora-dbc'
}

const WebSocketTester: React.FC<WebSocketTesterProps> = ({ selectedDex = 'pump-fun' }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [messageToSend, setMessageToSend] = useState('{"action": "subscribe", "channel": "trending-pairs"}')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const connect = () => {
    try {
      wsRef.current = new WebSocket('ws://34.107.31.9/ws/trending-pairs')
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        addMessage('✅ Connected to WebSocket')
      }
      
      wsRef.current.onmessage = (event) => {
        addMessage(`📨 Received: ${event.data}`)
      }
      
      wsRef.current.onclose = (event) => {
        setIsConnected(false)
        addMessage(`❌ Disconnected: ${event.code} ${event.reason}`)
      }
      
      wsRef.current.onerror = (error) => {
        addMessage(`🚨 Error: ${error}`)
      }
    } catch (err) {
      addMessage(`🚨 Connection failed: ${err}`)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageToSend)
      addMessage(`📤 Sent: ${messageToSend}`)
    } else {
      addMessage('🚨 WebSocket not connected')
    }
  }

  const addMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setMessages(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearMessages = () => {
    setMessages([])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">WebSocket Tester</h2>
      
      {/* Connection Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={connect}
          disabled={isConnected}
          className={`px-4 py-2 rounded transition-colors ${
            isConnected 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className={`px-4 py-2 rounded transition-colors ${
            !isConnected 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Disconnect
        </button>
        <div className={`px-3 py-2 rounded text-sm ${
          isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Send Message */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">Message to Send:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={messageToSend}
            onChange={(e) => setMessageToSend(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            placeholder="Enter JSON message..."
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              !isConnected 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Send
          </button>
        </div>
      </div>

      {/* Quick Send Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => {
            const message = `{"action": "subscribe", "dex": ["${selectedDex}"], "categories": ["NEW", "MIGRATING", "MIGRATED"]}`
            setMessageToSend(message)
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(message)
              addMessage(`📤 Sent: ${message}`)
            }
          }}
          className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition-colors"
        >
          Subscribe {selectedDex === 'pump-fun' ? 'Pump-Fun' : 'Meteora-dbc'}
        </button>
        <button
          onClick={() => {
            const message = '{"action": "subscribe", "dex": "*", "categories": ["*"]}'
            setMessageToSend(message)
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(message)
              addMessage(`📤 Sent: ${message}`)
            }
          }}
          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded transition-colors"
        >
          Subscribe All Categories
        </button>
        <button
          onClick={() => setMessageToSend('{"action": "ping"}')}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          Ping
        </button>
        <button
          onClick={() => setMessageToSend('{"action": "get_trending_pairs"}')}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          Get Trending
        </button>
      </div>

      {/* Messages */}
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-gray-400 text-sm">Messages:</h3>
        <button
          onClick={clearMessages}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div className="bg-gray-800 border border-gray-600 rounded p-3 h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm">No messages yet...</div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="text-green-400 text-xs font-mono mb-1 break-all">
              {message}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default WebSocketTester
