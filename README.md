# TypeScript Function Template

TypeScript template for building [Extism](https://extism.org/) plugins that work with the Exchange Outpost trading platform.

## Overview

This template provides a starting point for creating custom trading functions and data processing plugins using TypeScript. It's designed to work seamlessly with the Exchange Outpost ABI library, giving you access to candlestick data, notifications, and high-precision decimal arithmetic.

## Features

- 📦 Pre-configured build pipeline with esbuild
- 🔌 Extism WASM plugin support
- 📊 Access to candlestick data via Exchange Outpost ABI
- 🔔 Built-in notification system (webhooks and emails)
- 🛡️ Full TypeScript support with type definitions
- 🐳 Dev Container ready for quick setup
- 🚀 Automated build to WebAssembly

## Installation

### Using Dev Containers (Recommended)

1. Open this folder in VS Code
2. Install the "Dev Containers" extension
3. Click "Reopen in Container" when prompted
4. The container will automatically install dependencies and build tools

### Manual Setup

```bash
npm install
```

This will automatically fetch and install the Exchange Outpost ABI library during the postinstall phase.

## Quick Start

### 1. Implement Your Function

Edit [`src/index.ts`](src/index.ts) to implement your trading logic:

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function run() {
  // Parse input from the Exchange Outpost host
  const args = FunctionArgs.get();
  
  // Get candles for a ticker
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  
  // Extract closing prices
  const closePrices = candles.map(candle => candle.close);
  
  // Your custom logic here
  // ...
  
  // Return results
  output({ 
    status: 'ok',
    // your data here
  });
}

module.exports = { run };
```

### 2. Build Your Plugin

```bash
npm run build
```

This compiles your TypeScript to JavaScript and packages it as a WebAssembly plugin in `dist/plugin.wasm`.

### 3. Test Your Plugin

The generated `dist/plugin.wasm` file can be uploaded to Exchange Outpost or tested locally with Extism.

## Example: SMA Crossover Alert

Here's a complete example that detects Simple Moving Average crossovers and sends email notifications:

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function calculateSma(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i <= data.length - period; i++) {
    const sum = data.slice(i, i + period).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

function detectCrossover(fastSma: number[], slowSma: number[]): string | null {
  if (fastSma.length < 2 || slowSma.length < 2) {
    return null;
  }
  
  const currentFast = fastSma[fastSma.length - 1];
  const previousFast = fastSma[fastSma.length - 2];
  const currentSlow = slowSma[slowSma.length - 1];
  const previousSlow = slowSma[slowSma.length - 2];
  
  // Bullish crossover: fast crosses above slow
  if (previousFast <= previousSlow && currentFast > currentSlow) {
    return 'bullish';
  }
  
  // Bearish crossover: fast crosses below slow
  if (previousFast >= previousSlow && currentFast < currentSlow) {
    return 'bearish';
  }
  
  return null;
}

function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  const closePrices = candles.map(candle => candle.close);
  
  const fastPeriod = args.getCallArgument('fastPeriod', parseInt) || 10;
  const slowPeriod = args.getCallArgument('slowPeriod', parseInt) || 20;
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  const fastSma = calculateSma(closePrices, fastPeriod);
  const slowSma = calculateSma(closePrices, slowPeriod);
  const crossover = detectCrossover(fastSma, slowSma);
  
  let emailSent = false;
  
  if (crossover === 'bullish') {
    scheduleEmail(
      email,
      `Bullish crossover detected for ${ticker}: Fast MA (${fastPeriod}) crossed above Slow MA (${slowPeriod})`
    );
    emailSent = true;
  } else if (crossover === 'bearish') {
    scheduleEmail(
      email,
      `Bearish crossover detected for ${ticker}: Fast MA (${fastPeriod}) crossed below Slow MA (${slowPeriod})`
    );
    emailSent = true;
  }
  
  output({ 
    status: 'ok',
    ticker,
    fastPeriod,
    slowPeriod,
    crossover: crossover || 'none',
    emailSent,
    currentFastSma: fastSma[fastSma.length - 1],
    currentSlowSma: slowSma[slowSma.length - 1]
  });
}

module.exports = { run };
```

See the complete example at [https://github.com/ExchangeOutpost/sma-alert](https://github.com/ExchangeOutpost/sma-alert).

## Working with Exchange Outpost ABI

### Getting Candles

```typescript
// Get candles as numbers
const candles = args.getCandles('ETHUSDT');

// Get candles with decimal precision
const decimalCandles = args.getCandlesDecimal('ETHUSDT');

// Access candle properties
for (const candle of candles) {
  console.log(`Time: ${candle.timestamp}`);
  console.log(`Close: ${candle.close}`);
  console.log(`High: ${candle.high}`);
  console.log(`Low: ${candle.low}`);
  console.log(`Open: ${candle.open}`);
  console.log(`Volume: ${candle.volume}`);
}
```

### Reading Call Arguments

```typescript
// Get string argument
const ticker = args.getCallArgument('ticker', (v: string) => v);

// Get number argument
const period = args.getCallArgument('period', parseInt);

// Get float argument
const threshold = args.getCallArgument('threshold', parseFloat);

// With default value
const email = args.getCallArgument('email', (v: string) => v) || 'default@example.com';
```

### Sending Notifications

```typescript
// Schedule an email
scheduleEmail('trader@example.com', 'Your alert message here');

// Schedule a webhook
scheduleWebhook('https://api.example.com/alert', JSON.stringify({ 
  alert: 'price_change',
  value: 50000 
}));
```

## Project Structure

```
typescript-function-template/
├── src/
│   ├── index.ts        # Main plugin implementation
│   └── index.d.ts      # Type definitions
├── dist/               # Build output (generated)
│   ├── index.js        # Compiled JavaScript
│   └── plugin.wasm     # Final WASM plugin
├── binaryen/           # WebAssembly optimization tools
├── esbuild.js          # Build configuration
├── tsconfig.json       # TypeScript configuration
├── jsconfig.json       # JavaScript configuration
├── manifest.json       # Plugin manifest
└── package.json        # Project dependencies
```

## Build Process

The build process consists of two steps:

1. **TypeScript Compilation**: `esbuild` compiles TypeScript to JavaScript
2. **WASM Generation**: `extism-js` converts JavaScript to WebAssembly

Both steps are executed with:

```bash
npm run build
```

### Build Configuration

The build is configured in [`esbuild.js`](esbuild.js):
- Entry point: `src/index.ts`
- Output: `dist/index.js`
- Target: ES2020 (QuickJS compatibility)
- Format: CommonJS (required for Extism)

## Use Cases

- **Trading Strategies**: Implement algorithmic trading strategies
- **Technical Indicators**: Calculate custom indicators (SMA, EMA, RSI, etc.)
- **Alert Systems**: Monitor market conditions and trigger notifications
- **Data Processing**: Transform and analyze financial data
- **Multi-Strategy Systems**: Chain multiple plugins together

## Development Tips

### Type Safety

Update [`src/index.d.ts`](src/index.d.ts) when adding new exported functions:

```typescript
declare module "main" {
  export function run(): I32;
  export function yourNewFunction(): I32;
}
```

### Debugging

Add logging to help with debugging:

```typescript
console.log('Debug info:', { ticker, price });
```

Logs will be visible in the Exchange Outpost execution logs.

### Testing Locally

You can test your WASM plugin locally using the Extism CLI:

```bash
extism call dist/plugin.wasm run --input '{"candles":{"BTCUSDT":[...]}}'
```

## Documentation

For detailed API documentation:
- Exchange Outpost ABI: [https://github.com/ExchangeOutpost/exchange-outpost-abi](https://github.com/ExchangeOutpost/exchange-outpost-abi)
- Extism Documentation: [https://extism.org/docs](https://extism.org/docs)

## Examples

- **SMA Alert**: [https://github.com/ExchangeOutpost/sma-alert](https://github.com/ExchangeOutpost/sma-alert)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Exchange Outpost ABI Issues: [https://github.com/ExchangeOutpost/exchange-outpost-abi/issues](https://github.com/ExchangeOutpost/exchange-outpost-abi/issues)
- Extism Discord: [https://extism.org/discord](https://extism.org/discord)
