import { NextRequest } from 'next/server'
import { Kafka } from 'kafkajs'
import protobuf from 'protobufjs'

// Kafka configuration
const kafka = new Kafka({
  clientId: 'trending-pairs-consumer',
  brokers: ['34.107.31.9:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 5
  }
})

const consumer = kafka.consumer({ 
  groupId: 'trending-pairs-group',
  sessionTimeout: 6000,   // 6 seconds (reduced to fit broker limits)
  heartbeatInterval: 2000 // 2 seconds
})

// Global protobuf root and TradeEvent type
let protoRoot: protobuf.Root | null = null
let TradeEventType: protobuf.Type | null = null

// Initialize protobuf schema
async function initProtobuf() {
  if (!protoRoot) {
    try {
      // Define the proto schema inline to avoid file path issues
      const protoSchema = `
        syntax = "proto3";
        package bonding_curves;
        
        message TradeEvent {
          string platform = 2;
          string price_native = 3;
          double sol_amount = 4;
          int64 timestamp = 5;
          double token_amount = 6;
          string transaction_id = 7;
          uint32 trade_type = 8;
          string wallet_address = 9;
          uint64 processing_time_us = 10;
          uint64 slot = 11;
          string price_usd = 12;
          string base_mint = 13;
          string base_mint_symbol = 14;
          string base_mint_name = 15;
          string quote_mint = 16;
          string quote_mint_symbol = 17;
          string quote_mint_name = 18;
          double total_network_fee = 19;
          bytes pnl_mint_7d = 20;
          double current_sol_balance = 21;
          double current_token_balance = 22;
          string pool_address = 23;
          double current_supply = 24;
        }
        
        message PnlMetrics {
          double unrealized_pnl_usd = 1;
          double unrealized_pnl_pct = 2;
          double realized_pnl_usd = 3;
          double realized_pnl_pct = 4;
        }
        
        enum TradeType {
          TRADE_TYPE_UNSPECIFIED = 0;
          TRADE_TYPE_BUY = 1;
          TRADE_TYPE_SELL = 2;
        }
      `
      
      protoRoot = protobuf.parse(protoSchema).root
      TradeEventType = protoRoot.lookupType('bonding_curves.TradeEvent')
    } catch (error) {
      console.error('Failed to initialize protobuf schema:', error)
      throw error
    }
  }
  return { protoRoot, TradeEventType }
}

// Decode protobuf message
function decodeTradeEvent(buffer: Buffer) {
  if (!TradeEventType) {
    throw new Error('Protobuf not initialized')
  }
  
  try {
    const message = TradeEventType.decode(buffer)
    return TradeEventType.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
      defaults: true,
      arrays: true,
      objects: true
    })
  } catch (error) {
    console.error('Failed to decode protobuf message:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(data))
    },
    
    async pull(controller) {
      try {
        console.log('🔄 Starting Kafka connection...')
        
        // Initialize protobuf
        await initProtobuf()
        console.log('✅ Protobuf schema initialized')
        
        // Connect to Kafka
        console.log('🔌 Connecting to Kafka broker: 34.107.31.9:9092')
        await consumer.connect()
        console.log('✅ Kafka consumer connected')
        
        console.log('📡 Subscribing to topic: bonding-curve-events')
        await consumer.subscribe({ 
          topic: 'bonding-curve-events',
          fromBeginning: false 
        })
        console.log('✅ Subscribed to topic successfully')
        console.log('👂 Waiting for messages...')
        
        // Set up message handler
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              if (!message.value) {
                console.log('❌ No message value received')
                return
              }
              
              console.log('📨 Raw Kafka message received:')
              console.log('  Topic:', topic)
              console.log('  Partition:', partition)
              console.log('  Offset:', message.offset)
              console.log('  Key:', message.key?.toString())
              console.log('  Value size:', message.value.length, 'bytes')
              console.log('  Value (first 100 bytes):', message.value.slice(0, 100))
              console.log('  Value (hex):', message.value.slice(0, 50).toString('hex'))
              
              // Try to decode as JSON first (in case it's not protobuf)
              try {
                const jsonString = message.value.toString('utf8')
                console.log('🔍 Trying JSON decode:', jsonString.slice(0, 200))
                const jsonData = JSON.parse(jsonString)
                console.log('✅ Successfully decoded as JSON:', jsonData)
                
                // Send the JSON event to the client
                const data = `data: ${JSON.stringify(jsonData)}\n\n`
                controller.enqueue(encoder.encode(data))
                return
              } catch (jsonError) {
                console.log('❌ Not JSON, trying protobuf decode...')
              }
              
              // Try protobuf decoding
              try {
                const tradeEvent = decodeTradeEvent(message.value)
                console.log('✅ Successfully decoded protobuf:', tradeEvent)
                
                // Send the decoded event to the client
                const data = `data: ${JSON.stringify(tradeEvent)}\n\n`
                controller.enqueue(encoder.encode(data))
              } catch (protoError) {
                console.error('❌ Protobuf decode failed:', protoError)
                
                // Send raw data for debugging
                const debugData = {
                  type: 'debug',
                  raw_size: message.value.length,
                  raw_hex: message.value.slice(0, 100).toString('hex'),
                  raw_string: message.value.toString('utf8').slice(0, 200),
                  error: protoError instanceof Error ? protoError.message : String(protoError)
                }
                const data = `data: ${JSON.stringify(debugData)}\n\n`
                controller.enqueue(encoder.encode(data))
              }
              
            } catch (error) {
              console.error('💥 General error processing Kafka message:', error)
              const errorData = `data: ${JSON.stringify({ 
                type: 'error', 
                message: 'Failed to process message',
                details: error instanceof Error ? error.message : String(error)
              })}\n\n`
              controller.enqueue(encoder.encode(errorData))
            }
          },
        })
        
      } catch (error) {
        console.error('Kafka consumer error:', error)
        const errorData = `data: ${JSON.stringify({ 
          type: 'error', 
          message: 'Failed to connect to Kafka' 
        })}\n\n`
        controller.enqueue(encoder.encode(errorData))
      }
    },
    
    async cancel() {
      try {
        await consumer.disconnect()
      } catch (error) {
        console.error('Error disconnecting Kafka consumer:', error)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
