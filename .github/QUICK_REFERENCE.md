# Quick Reference Guide

## Essential Commands

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Output location
dist/plugin.wasm
```

## Basic Plugin Template

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function run() {
  // 1. Get args
  const args = FunctionArgs.get();
  
  // 2. Get parameters
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const email = args.getCallArgument('email', (v: string) => v);
  
  // 3. Get data
  const candles = args.getCandles(ticker);
  
  // 4. Your logic here
  // ...
  
  // 5. Return result
  output({ status: 'ok' });
}

module.exports = { run };
```

## API Cheat Sheet

### Get Candles

```typescript
const candles = args.getCandles('BTCUSDT');          // Regular precision
const decimalCandles = args.getCandlesDecimal('BTCUSDT'); // High precision
```

### Get Arguments

```typescript
const stringArg = args.getCallArgument('name', (v: string) => v);
const intArg = args.getCallArgument('period', parseInt);
const floatArg = args.getCallArgument('threshold', parseFloat);
const withDefault = args.getCallArgument('period', parseInt) || 20;
```

### Send Notifications

```typescript
scheduleEmail('email@example.com', 'Message');
scheduleWebhook('https://api.example.com/hook', JSON.stringify({ data: 'value' }));
```

### Access Candle Data

```typescript
candles.forEach(candle => {
  candle.timestamp  // Unix timestamp (seconds)
  candle.open       // Opening price
  candle.high       // Highest price
  candle.low        // Lowest price
  candle.close      // Closing price
  candle.volume     // Volume
});
```

## Common Calculations

### Extract Prices

```typescript
const closePrices = candles.map(c => c.close);
const highPrices = candles.map(c => c.high);
const lowPrices = candles.map(c => c.low);
const volumes = candles.map(c => c.volume);
```

### Simple Moving Average

```typescript
function calculateSma(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i <= data.length - period; i++) {
    const sum = data.slice(i, i + period).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}
```

### Exponential Moving Average

```typescript
function calculateEma(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  
  return ema;
}
```

### Standard Deviation

```typescript
function calculateStdDev(data: number[], period: number): number {
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / slice.length;
  return Math.sqrt(variance);
}
```

### RSI

```typescript
function calculateRsi(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
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

### Detect Crossover

```typescript
function detectCrossover(line1: number[], line2: number[]): 'above' | 'below' | null {
  if (line1.length < 2 || line2.length < 2) return null;
  
  const current1 = line1[line1.length - 1];
  const previous1 = line1[line1.length - 2];
  const current2 = line2[line2.length - 1];
  const previous2 = line2[line2.length - 2];
  
  if (previous1 <= previous2 && current1 > current2) return 'above';
  if (previous1 >= previous2 && current1 < current2) return 'below';
  return null;
}
```

## Error Handling

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

### Try-Catch

```typescript
try {
  const candles = args.getCandles(ticker);
  // ... your logic
} catch (error) {
  output({ 
    status: 'error', 
    message: String(error) 
  });
  return;
}
```

### Validate Parameters

```typescript
const period = args.getCallArgument('period', parseInt) || 20;
if (period < 2) {
  output({ 
    status: 'error', 
    message: 'Period must be >= 2' 
  });
  return;
}
```

## Output Format

### Success Response

```typescript
output({ 
  status: 'ok',
  ticker: 'BTCUSDT',
  signal: 'buy',
  confidence: 0.85,
  indicators: {
    sma: 42500,
    rsi: 35
  }
});
```

### Error Response

```typescript
output({ 
  status: 'error',
  message: 'Description of the error'
});
```

## Debugging

### Add Logs

```typescript
console.log('Candles received:', candles.length);
console.log('Current price:', candles[candles.length - 1].close);
console.log('Indicator value:', indicatorValue);
```

### Detailed Output

```typescript
output({ 
  status: 'ok',
  debug: {
    candlesCount: candles.length,
    firstCandle: candles[0],
    lastCandle: candles[candles.length - 1],
    parameters: { period, threshold }
  },
  result: yourResult
});
```

## Type Definitions

### Update src/index.d.ts

```typescript
declare module "main" {
  export function run(): I32;
  export function myNewFunction(): I32; // Add new exports
}
```

## Constraints & Limitations

### ❌ NOT Supported
- `async/await`
- `fetch()` or HTTP requests
- File system (`fs` module)
- Node.js built-in modules
- ES2021+ features

### ✅ Supported
- TypeScript/JavaScript (ES2020)
- Array methods (map, filter, reduce, etc.)
- Math operations
- JSON parsing/stringification
- console.log
- FunctionArgs.get() / output()

## File Structure

```
src/
  index.ts        # Main code (edit this)
  index.d.ts      # Type definitions (update when adding exports)
dist/
  index.js        # Compiled output (generated)
  plugin.wasm     # Final WASM plugin (generated)
esbuild.js        # Build config (don't change target or format)
package.json      # Dependencies (don't remove postinstall)
tsconfig.json     # TypeScript config
```

## Build Configuration

### package.json Scripts

```json
{
  "postinstall": "npx degit github:ExchangeOutpost/exchange-outpost-abi/typescript#0.1.3 node_modules/exchange-outpost-abi && cd node_modules/exchange-outpost-abi && npm install && npm run build",
  "build": "node esbuild.js && extism-js dist/index.js -i src/index.d.ts -o dist/plugin.wasm"
}
```

### esbuild.js Settings

```javascript
{
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  bundle: true,
  format: "cjs",        // Must be CommonJS
  target: ["es2020"],   // Must be ES2020 or lower
}
```

## Resources

- **README**: [Full documentation](../README.md)
- **Examples**: [Complete strategy examples](EXAMPLES.md)
- **Agent Context**: [AI agent guide](AGENT_CONTEXT.md)
- **Exchange Outpost ABI**: [GitHub](https://github.com/ExchangeOutpost/exchange-outpost-abi)
- **SMA Alert Example**: [GitHub](https://github.com/ExchangeOutpost/sma-alert)
- **Extism Docs**: [extism.org](https://extism.org/docs)

## Common Patterns

### Get Latest Value

```typescript
const currentPrice = candles[candles.length - 1].close;
const previousPrice = candles[candles.length - 2].close;
```

### Price Change Percentage

```typescript
const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
```

### Array Average

```typescript
const average = array.reduce((a, b) => a + b, 0) / array.length;
```

### Find Maximum/Minimum

```typescript
const highest = Math.max(...prices);
const lowest = Math.min(...prices);
```

### Last N Elements

```typescript
const last20Candles = candles.slice(-20);
const last20Prices = closePrices.slice(-20);
```

## Testing Input Example

When testing locally, your input should look like:

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
    "email": "trader@example.com",
    "threshold": "50000"
  }
}
```

---

**Quick Start**: Copy the basic template, add your logic, run `npm run build`, upload `dist/plugin.wasm` to Exchange Outpost!
