# Agent Context: TypeScript Function Template

## What This Repository Is

A **TypeScript template for creating trading strategy plugins** that run as WebAssembly modules in the Exchange Outpost trading platform. Plugins analyze market data (candlesticks) and can trigger notifications based on custom logic.

## Quick Understanding

### Input Flow
```
Exchange Outpost → JSON data → Your Plugin → JSON response → Exchange Outpost
```

### Plugin Lifecycle
```typescript
1. Host calls run()
2. Plugin gets args via FunctionArgs.get()
3. Plugin processes data using Exchange Outpost ABI
4. Plugin outputs result via output()
```

## Data Structures

### Input Format (from Exchange Outpost)
```json
{
  "candles": {
    "BTCUSDT": [
      {
        "timestamp": 1704067200,
        "open": 42000.5,
        "high": 42500.0,
        "low": 41800.0,
        "close": 42300.0,
        "volume": 125.5
      }
    ]
  },
  "callArguments": {
    "period": "20",
    "email": "user@example.com",
    "threshold": "50000"
  }
}
```

### Output Format (to Exchange Outpost)
```json
{
  "status": "ok",
  "result": "any data you want to return",
  "signals": ["buy", "sell"],
  "notifications_sent": true
}
```

## Key API Reference

### FunctionArgs Class
```typescript
// Get the instance
const args = FunctionArgs.get();

// Get candles for a symbol
const candles = args.getCandles('BTCUSDT');          // Returns Candle[]
const decimalCandles = args.getCandlesDecimal('BTCUSDT'); // High precision

// Get call arguments (from Exchange Outpost UI)
const period = args.getCallArgument('period', parseInt);
const email = args.getCallArgument('email', (v: string) => v);
```

### Candle Interface
```typescript
interface Candle {
  timestamp: number;  // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Notification Functions
```typescript
// Send email (queued by Exchange Outpost)
scheduleEmail(
  'recipient@example.com',
  'Your message here'
);

// Send webhook (queued by Exchange Outpost)
scheduleWebhook(
  'https://api.example.com/endpoint',
  JSON.stringify({ your: 'data' })
);
```

## Common Tasks

### Task: Calculate Simple Moving Average
```typescript
function calculateSma(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i <= prices.length - period; i++) {
    const sum = prices.slice(i, i + period).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

// Usage:
const closePrices = candles.map(c => c.close);
const sma20 = calculateSma(closePrices, 20);
```

### Task: Detect Price Crossover
```typescript
function detectCrossover(
  fastLine: number[],
  slowLine: number[]
): 'above' | 'below' | null {
  if (fastLine.length < 2 || slowLine.length < 2) return null;
  
  const currentFast = fastLine[fastLine.length - 1];
  const previousFast = fastLine[fastLine.length - 2];
  const currentSlow = slowLine[slowLine.length - 1];
  const previousSlow = slowLine[slowLine.length - 2];
  
  // Fast crosses above slow
  if (previousFast <= previousSlow && currentFast > currentSlow) {
    return 'above';
  }
  
  // Fast crosses below slow
  if (previousFast >= previousSlow && currentFast < currentSlow) {
    return 'below';
  }
  
  return null;
}
```

### Task: Check Price Threshold
```typescript
const currentPrice = candles[candles.length - 1].close;
const threshold = args.getCallArgument('threshold', parseFloat) || 50000;

if (currentPrice > threshold) {
  scheduleEmail(email, `Price ${currentPrice} exceeded threshold ${threshold}`);
}
```

### Task: Calculate RSI (Relative Strength Index)
```typescript
function calculateRsi(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // Calculate RSI for each period
  for (let i = period; i <= changes.length; i++) {
    const recentChanges = changes.slice(i - period, i);
    const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
    
    const rs = gains / (losses || 1);
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}
```

## Important Constraints

### ❌ NOT Available
- No `async/await`
- No `fetch()` or HTTP requests
- No file system access (`fs`)
- No Node.js built-in modules
- No ES2021+ features (BigInt methods, Promise.any, etc.)

### ✅ Available
- Basic JavaScript/TypeScript
- Array methods (map, filter, reduce, etc.)
- Math operations
- JSON parsing/stringification
- console.log for debugging
- FunctionArgs.get() and output() from Exchange Outpost ABI

## Build Command
```bash
npm run build
```

This produces `dist/plugin.wasm` ready for upload to Exchange Outpost.

## File Structure for Code Generation

When generating a trading strategy:

```typescript
// 1. Imports (always needed)
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

// 2. Helper functions (if needed)
function calculateIndicator(data: number[]): number[] {
  // implementation
}

// 3. Main run function (required)
function run() {
  // Get args
  const args = FunctionArgs.get();
  
  // Get data
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  
  // Your logic
  // ...
  
  // Output result
  output({ 
    status: 'ok',
    // your fields
  });
}

// 4. Export (always needed)
module.exports = { run };
```

## Real-World Example

The [SMA Alert](https://github.com/ExchangeOutpost/sma-alert) repository contains a complete, working example that:
1. Calculates two moving averages (fast and slow)
2. Detects when they cross over
3. Sends an email notification on crossover
4. Returns detailed status information

Study this example when implementing similar strategies.

## Debugging Tips

### Add Logging
```typescript
console.log('Candles received:', candles.length);
console.log('Current price:', candles[candles.length - 1].close);
```

Logs appear in Exchange Outpost execution logs.

### Validate Input
```typescript
if (!candles || candles.length === 0) {
  output({ 
    status: 'error', 
    message: 'No candles received' 
  });
  return;
}
```

### Return Detailed Status
```typescript
output({ 
  status: 'ok',
  processedCandles: candles.length,
  lastPrice: candles[candles.length - 1].close,
  signalGenerated: signal !== null,
  signal: signal
});
```

## Exchange Outpost ABI Version

This template is configured for Exchange Outpost ABI v0.1.3 (via package.json postinstall script). Update the version tag in package.json if needed:

```json
"postinstall": "npx degit github:ExchangeOutpost/exchange-outpost-abi/typescript#0.1.3 ..."
```

## Related Resources

- [Exchange Outpost ABI Documentation](https://github.com/ExchangeOutpost/exchange-outpost-abi)
- [Extism Documentation](https://extism.org/docs)
- [SMA Alert Example](https://github.com/ExchangeOutpost/sma-alert)
