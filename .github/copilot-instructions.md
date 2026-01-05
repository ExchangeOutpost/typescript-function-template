# GitHub Copilot Instructions for TypeScript Function Template

## Repository Context

This is a **TypeScript template for building Extism WebAssembly plugins** that work with the Exchange Outpost trading platform. The repository provides a pre-configured development environment for creating custom trading strategies and data processing functions.

## Core Architecture

### Technology Stack
- **TypeScript**: Main development language
- **Extism**: WebAssembly plugin system (host environment for plugins)
- **esbuild**: Fast JavaScript bundler
- **Exchange Outpost ABI**: Library for handling financial data, candles, and notifications

### Plugin Model
Plugins are compiled to WebAssembly (`.wasm`) files that run in the Extism host. The host provides:
- Input data through Exchange Outpost ABI's `FunctionArgs.get()` (JSON-formatted financial data)
- Output through Exchange Outpost ABI's `output()` function (JSON response)
- Limited JavaScript runtime (QuickJS with ES2020 support)

### Build Pipeline
1. TypeScript → JavaScript (via esbuild)
2. JavaScript → WebAssembly (via extism-js CLI)
3. Output: `dist/plugin.wasm` ready for deployment

## Key Files and Their Purpose

- **`src/index.ts`**: Main plugin entry point. Contains the `run()` function that gets called by Extism.
- **`src/index.d.ts`**: Type definitions for exports. Declare all exported functions here.
- **`esbuild.js`**: Build configuration. Must target ES2020 and output CommonJS format.
- **`tsconfig.json`**: TypeScript compiler options. Configured for Node environment.
- **`package.json`**: Dependencies and build scripts. Contains postinstall hook for ABI library.
- **`manifest.json`**: Plugin metadata for Exchange Outpost platform.
- **`binaryen/`**: WebAssembly optimization tools directory.

## Exchange Outpost ABI Usage

### Input Parsing
Always start with getting the FunctionArgs instance:

```typescript
const args = FunctionArgs.get();
```

### Getting Market Data

```typescript
// Get candlestick data for a ticker
const candles = args.getCandles('BTCUSDT');
const decimalCandles = args.getCandlesDecimal('BTCUSDT'); // High-precision

// Candle structure:
interface Candle {
  timestamp: number;  // Unix timestamp
  open: number;       // Opening price
  high: number;       // Highest price
  low: number;        // Lowest price
  close: number;      // Closing price
  volume: number;     // Trading volume
}
```

### Reading Arguments

```typescript
// String arguments
const ticker = args.getCallArgument('ticker', (v: string) => v);

// Numeric arguments
const period = args.getCallArgument('period', parseInt);
const threshold = args.getCallArgument('threshold', parseFloat);

// With defaults
const email = args.getCallArgument('email', (v: string) => v) || 'default@example.com';
```

### Sending Notifications

```typescript
import { scheduleEmail, scheduleWebhook } from "exchange-outpost-abi";

// Email notification
scheduleEmail('trader@example.com', 'Alert message');

// Webhook notification
scheduleWebhook('https://api.example.com/webhook', JSON.stringify({ data: 'value' }));
```

### Returning Output

```typescript
import { output } from "exchange-outpost-abi";

// Return JSON response
output({ 
  status: 'ok',
  result: yourData,
  // ... more fields
});
```

## Common Patterns

### Technical Indicator Calculation

```typescript
function calculateIndicator(prices: number[], period: number): number[] {
  const results: number[] = [];
  for (let i = 0; i <= prices.length - period; i++) {
    // Calculate indicator value
    const value = /* calculation */;
    results.push(value);
  }
  return results;
}
```

### Signal Detection

```typescript
function detectSignal(data: number[]): 'buy' | 'sell' | null {
  if (data.length < 2) return null;
  
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  
  if (/* buy condition */) return 'buy';
  if (/* sell condition */) return 'sell';
  return null;
}
```

### Conditional Alerts

```typescript
if (condition) {
  scheduleEmail(email, `Alert: ${message}`);
  return { status: 'alert_sent', message };
}
return { status: 'no_alert' };
```

## Code Generation Guidelines

### When Creating New Functions

1. **Always import from exchange-outpost-abi**:
   ```typescript
   import { FunctionArgs, scheduleEmail, scheduleWebhook, output } from "exchange-outpost-abi";
   ```

2. **Main function structure**:
   ```typescript
   function run() {
     const args = FunctionArgs.get();
     
     // Your logic here
     
     output({ /* result */ });
   }
   
   module.exports = { run };
   ```

3. **Update type definitions** in `src/index.d.ts`:
   ```typescript
   declare module "main" {
     export function run(): I32;
     export function newFunction(): I32; // Add new exports
   }
   ```

### Best Practices

1. **Error Handling**: Wrap risky operations in try-catch
   ```typescript
   try {
     const candles = args.getCandles(ticker);
   } catch (error) {
     output({ status: 'error', message: String(error) });
     return;
   }
   ```

2. **Validation**: Validate inputs and provide defaults
   ```typescript
   const period = args.getCallArgument('period', parseInt) || 20;
   if (period < 2) {
     output({ status: 'error', message: 'Period must be >= 2' });
     return;
   }
   ```

3. **Data Extraction**: Use map/filter for data processing
   ```typescript
   const closePrices = candles.map(c => c.close);
   const highPrices = candles.map(c => c.high);
   ```

4. **Minimal External Dependencies**: Avoid npm packages that require Node APIs not available in QuickJS

5. **Numeric Precision**: Use the decimal variants for high-precision calculations
   ```typescript
   const decimalCandles = args.getCandlesDecimal('BTCUSDT');
   ```

## Limitations and Constraints

### Runtime Constraints
- **No async/await**: QuickJS doesn't support async operations
- **ES2020 only**: No ES2021+ features
- **No native Node modules**: Can't use fs, path, http, etc.
- **Memory limits**: WASM plugins have memory constraints

### Build Constraints
- Must use CommonJS format (not ESM)
- Bundle size should be reasonable (<1MB)
- Target must be ES2020 or lower

## Testing Strategy

### Local Testing
```bash
# Build the plugin
npm run build

# Test with Extism CLI (if available)
extism call dist/plugin.wasm run --input '{"candles":{"BTCUSDT":[...]}}'
```

### Integration Testing
The plugin will be tested in the Exchange Outpost platform with real market data.

## Common Use Cases

### 1. Moving Average Strategy
Calculate MAs, detect crossovers, send alerts

### 2. Price Threshold Alert
Monitor price levels and trigger notifications

### 3. Volume Analysis
Analyze trading volume patterns

### 4. Technical Indicators
Implement RSI, MACD, Bollinger Bands, etc.

### 5. Multi-Timeframe Analysis
Analyze data across multiple timeframes

## Example Implementation Reference

The [SMA Alert plugin](https://github.com/ExchangeOutpost/sma-alert) is a complete reference implementation that demonstrates:
- SMA calculation
- Crossover detection
- Email notifications
- Proper input/output handling

## When User Asks For...

### "Create a trading strategy"
1. Parse input and get candles
2. Extract relevant price data
3. Calculate indicators
4. Detect signals
5. Send notifications if needed
6. Return results

### "Add an indicator"
1. Create calculation function
2. Test with sample data
3. Integrate into main run() function
4. Return indicator values in output

### "Add notifications"
1. Import scheduleEmail or scheduleWebhook
2. Add condition checking
3. Call notification function with message
4. Track notification status in output

### "Fix build errors"
1. Check ES2020 compatibility
2. Verify imports from exchange-outpost-abi
3. Ensure CommonJS format
4. Check type definitions

## Dependencies

- **exchange-outpost-abi**: Installed via postinstall script (git-based)
- **@extism/js-pdk**: Core Extism functionality
- **esbuild**: Build tool
- **typescript**: Language compiler

## Development Environment

The repository includes a Dev Container configuration for consistent development environment with all necessary tools pre-installed.
