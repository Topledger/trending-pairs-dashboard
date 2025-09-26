const WebSocket = require('ws')
const { Kafka } = require('kafkajs')
const protobuf = require('protobufjs')

const kafka = new Kafka({
  clientId: 'ws-kafka-consumer',
  brokers: ['34.107.31.9:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 5
  }
})

const consumer = kafka.consumer({ 
  groupId: 'ws-kafka-group',
  sessionTimeout: 6000,
  heartbeatInterval: 2000
})

// Initialize protobuf schema
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
`

let TradeEvent
let clients = new Set()

async function initProtobuf() {
  const root = protobuf.parse(protoSchema).root
  TradeEvent = root.lookupType('bonding_curves.TradeEvent')
  console.log('✅ Protobuf schema initialized')
}

async function startKafkaConsumer() {
  try {
    console.log('🔌 Connecting to Kafka...')
    await consumer.connect()
    console.log('✅ Kafka connected')
    
    await consumer.subscribe({ 
      topic: 'bonding-curve-events',
      fromBeginning: false 
    })
    console.log('✅ Subscribed to bonding-curve-events')
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return
        
        try {
          const decoded = TradeEvent.decode(message.value)
          const jsonObj = TradeEvent.toObject(decoded, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true,
            objects: true
          })
          
          // Broadcast to all connected clients
          const data = JSON.stringify(jsonObj)
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(data)
            }
          })
          
        } catch (error) {
          console.error('❌ Decode error:', error)
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Kafka error:', error)
    setTimeout(startKafkaConsumer, 5000) // Retry after 5 seconds
  }
}

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: 8082,
  perMessageDeflate: false
})

wss.on('connection', (ws) => {
  console.log('👋 Client connected')
  clients.add(ws)
  
  // Send connection confirmation
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }))
  
  ws.on('close', () => {
    console.log('👋 Client disconnected')
    clients.delete(ws)
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
    clients.delete(ws)
  })
})

console.log('🚀 WebSocket server started on port 8082')

// Initialize and start
async function start() {
  await initProtobuf()
  await startKafkaConsumer()
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  await consumer.disconnect()
  wss.close()
  process.exit(0)
})

start().catch(console.error)
