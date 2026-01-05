# Plugin Examples

This document provides complete, copy-paste-ready examples for common trading strategies and indicators.

## Table of Contents

1. [Simple Moving Average Alert](#simple-moving-average-alert)
2. [RSI Overbought/Oversold Alert](#rsi-overboughtoversold-alert)
3. [Price Threshold Alert](#price-threshold-alert)
4. [Volume Spike Detector](#volume-spike-detector)
5. [Bollinger Bands Breakout](#bollinger-bands-breakout)
6. [Multiple Timeframe Analysis](#multiple-timeframe-analysis)

---

## Simple Moving Average Alert

Detects when a fast moving average crosses a slow moving average and sends an email alert.

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
  
  if (previousFast <= previousSlow && currentFast > currentSlow) {
    return 'bullish';
  }
  
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
    crossover: crossover || 'none',
    emailSent,
    currentFastSma: fastSma[fastSma.length - 1],
    currentSlowSma: slowSma[slowSma.length - 1]
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `ticker`: Trading pair (default: BTCUSDT)
- `fastPeriod`: Fast SMA period (default: 10)
- `slowPeriod`: Slow SMA period (default: 20)
- `email`: Email address for alerts

---

## RSI Overbought/Oversold Alert

Monitors RSI and sends alerts when it enters overbought or oversold zones.

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

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

function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  const closePrices = candles.map(c => c.close);
  
  const rsiPeriod = args.getCallArgument('rsiPeriod', parseInt) || 14;
  const overbought = args.getCallArgument('overbought', parseFloat) || 70;
  const oversold = args.getCallArgument('oversold', parseFloat) || 30;
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  const rsi = calculateRsi(closePrices, rsiPeriod);
  const currentRsi = rsi[rsi.length - 1];
  
  let signal = null;
  let emailSent = false;
  
  if (currentRsi >= overbought) {
    signal = 'overbought';
    scheduleEmail(
      email,
      `${ticker} RSI is overbought: ${currentRsi.toFixed(2)} (threshold: ${overbought})`
    );
    emailSent = true;
  } else if (currentRsi <= oversold) {
    signal = 'oversold';
    scheduleEmail(
      email,
      `${ticker} RSI is oversold: ${currentRsi.toFixed(2)} (threshold: ${oversold})`
    );
    emailSent = true;
  }
  
  output({
    status: 'ok',
    ticker,
    rsi: currentRsi,
    signal,
    emailSent,
    overbought,
    oversold
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `ticker`: Trading pair
- `rsiPeriod`: RSI calculation period (default: 14)
- `overbought`: Overbought threshold (default: 70)
- `oversold`: Oversold threshold (default: 30)
- `email`: Email address for alerts

---

## Price Threshold Alert

Sends an alert when price crosses above or below a threshold.

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  
  if (candles.length < 2) {
    output({
      status: 'error',
      message: 'Not enough candles for analysis'
    });
    return;
  }
  
  const threshold = args.getCallArgument('threshold', parseFloat);
  const direction = args.getCallArgument('direction', (v: string) => v) || 'above'; // 'above' or 'below'
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  const currentPrice = candles[candles.length - 1].close;
  const previousPrice = candles[candles.length - 2].close;
  
  let triggered = false;
  let emailSent = false;
  
  if (direction === 'above' && previousPrice <= threshold && currentPrice > threshold) {
    triggered = true;
    scheduleEmail(
      email,
      `${ticker} crossed ABOVE ${threshold}. Current price: ${currentPrice}`
    );
    emailSent = true;
  } else if (direction === 'below' && previousPrice >= threshold && currentPrice < threshold) {
    triggered = true;
    scheduleEmail(
      email,
      `${ticker} crossed BELOW ${threshold}. Current price: ${currentPrice}`
    );
    emailSent = true;
  }
  
  output({
    status: 'ok',
    ticker,
    currentPrice,
    threshold,
    direction,
    triggered,
    emailSent
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `ticker`: Trading pair
- `threshold`: Price threshold (required)
- `direction`: 'above' or 'below' (default: above)
- `email`: Email address for alerts

---

## Volume Spike Detector

Detects unusual volume spikes compared to average volume.

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function calculateAverage(data: number[]): number {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  
  const volumePeriod = args.getCallArgument('volumePeriod', parseInt) || 20;
  const spikeMultiplier = args.getCallArgument('spikeMultiplier', parseFloat) || 2.0;
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  if (candles.length < volumePeriod + 1) {
    output({
      status: 'error',
      message: `Not enough candles. Need at least ${volumePeriod + 1}`
    });
    return;
  }
  
  const volumes = candles.map(c => c.volume);
  const currentVolume = volumes[volumes.length - 1];
  const historicalVolumes = volumes.slice(-volumePeriod - 1, -1);
  const avgVolume = calculateAverage(historicalVolumes);
  
  const volumeRatio = currentVolume / avgVolume;
  let spikeDetected = false;
  let emailSent = false;
  
  if (volumeRatio >= spikeMultiplier) {
    spikeDetected = true;
    scheduleEmail(
      email,
      `Volume spike detected for ${ticker}: Current volume ${currentVolume.toFixed(2)} is ${volumeRatio.toFixed(2)}x the ${volumePeriod}-period average (${avgVolume.toFixed(2)})`
    );
    emailSent = true;
  }
  
  output({
    status: 'ok',
    ticker,
    currentVolume,
    avgVolume,
    volumeRatio,
    spikeDetected,
    emailSent
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `ticker`: Trading pair
- `volumePeriod`: Period for average volume calculation (default: 20)
- `spikeMultiplier`: Multiplier for spike detection (default: 2.0)
- `email`: Email address for alerts

---

## Bollinger Bands Breakout

Detects when price breaks out of Bollinger Bands.

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function calculateSma(data: number[], period: number): number {
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateStdDev(data: number[], period: number): number {
  const slice = data.slice(-period);
  const mean = calculateSma(data, period);
  const squaredDiffs = slice.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / slice.length;
  return Math.sqrt(variance);
}

function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  const closePrices = candles.map(c => c.close);
  
  const period = args.getCallArgument('period', parseInt) || 20;
  const stdDevMultiplier = args.getCallArgument('stdDevMultiplier', parseFloat) || 2.0;
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  if (closePrices.length < period) {
    output({
      status: 'error',
      message: `Not enough data. Need at least ${period} candles`
    });
    return;
  }
  
  const sma = calculateSma(closePrices, period);
  const stdDev = calculateStdDev(closePrices, period);
  const upperBand = sma + (stdDev * stdDevMultiplier);
  const lowerBand = sma - (stdDev * stdDevMultiplier);
  const currentPrice = closePrices[closePrices.length - 1];
  
  let breakout = null;
  let emailSent = false;
  
  if (currentPrice > upperBand) {
    breakout = 'upper';
    scheduleEmail(
      email,
      `${ticker} broke above upper Bollinger Band: Price ${currentPrice} > Upper Band ${upperBand.toFixed(2)}`
    );
    emailSent = true;
  } else if (currentPrice < lowerBand) {
    breakout = 'lower';
    scheduleEmail(
      email,
      `${ticker} broke below lower Bollinger Band: Price ${currentPrice} < Lower Band ${lowerBand.toFixed(2)}`
    );
    emailSent = true;
  }
  
  output({
    status: 'ok',
    ticker,
    currentPrice,
    sma,
    upperBand,
    lowerBand,
    breakout,
    emailSent
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `ticker`: Trading pair
- `period`: Period for SMA and standard deviation (default: 20)
- `stdDevMultiplier`: Standard deviation multiplier (default: 2.0)
- `email`: Email address for alerts

---

## Multiple Timeframe Analysis

Analyzes the same indicator across different timeframes using piped data.

```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function calculateSma(data: number[], period: number): number {
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function run() {
  const args = FunctionArgs.get();
  
  // Analyze multiple tickers (each could represent different timeframes)
  const tickers = ['BTCUSDT_1H', 'BTCUSDT_4H', 'BTCUSDT_1D'];
  const period = args.getCallArgument('period', parseInt) || 20;
  const email = args.getCallArgument('email', (v: string) => v) || 'trader@example.com';
  
  const analysis: any = {};
  let allBullish = true;
  let allBearish = true;
  
  for (const ticker of tickers) {
    try {
      const candles = args.getCandles(ticker);
      const closePrices = candles.map(c => c.close);
      
      if (closePrices.length < period + 1) {
        continue;
      }
      
      const sma = calculateSma(closePrices, period);
      const currentPrice = closePrices[closePrices.length - 1];
      const trend = currentPrice > sma ? 'bullish' : 'bearish';
      
      analysis[ticker] = {
        price: currentPrice,
        sma,
        trend
      };
      
      if (trend !== 'bullish') allBullish = false;
      if (trend !== 'bearish') allBearish = false;
    } catch (error) {
      analysis[ticker] = { error: String(error) };
    }
  }
  
  let emailSent = false;
  
  if (allBullish) {
    scheduleEmail(
      email,
      `Strong bullish signal: All timeframes are above ${period}-period SMA`
    );
    emailSent = true;
  } else if (allBearish) {
    scheduleEmail(
      email,
      `Strong bearish signal: All timeframes are below ${period}-period SMA`
    );
    emailSent = true;
  }
  
  output({
    status: 'ok',
    analysis,
    signal: allBullish ? 'bullish' : (allBearish ? 'bearish' : 'mixed'),
    emailSent
  });
}

module.exports = { run };
```

**Configuration Parameters:**
- `period`: SMA period (default: 20)
- `email`: Email address for alerts

**Note:** This example assumes you're piping data from multiple sources/timeframes with different ticker identifiers.

---

## Testing Your Plugin

After copying any of these examples to `src/index.ts`, build the plugin:

```bash
npm run build
```

The resulting `dist/plugin.wasm` can be uploaded to Exchange Outpost for testing with real market data.

## Combining Examples

You can combine multiple indicators in a single plugin:

```typescript
function run() {
  const args = FunctionArgs.get();
  
  const ticker = args.getCallArgument('ticker', (v: string) => v) || 'BTCUSDT';
  const candles = args.getCandles(ticker);
  const closePrices = candles.map(c => c.close);
  
  // Calculate multiple indicators
  const sma20 = calculateSma(closePrices, 20);
  const sma50 = calculateSma(closePrices, 50);
  const rsi = calculateRsi(closePrices, 14);
  
  // Combine signals
  const smaBullish = sma20[sma20.length - 1] > sma50[sma50.length - 1];
  const rsiOversold = rsi[rsi.length - 1] < 30;
  
  const strongBuySignal = smaBullish && rsiOversold;
  
  // Send notification if strong signal
  if (strongBuySignal) {
    scheduleEmail(email, `Strong buy signal for ${ticker}: SMA bullish + RSI oversold`);
  }
  
  output({
    status: 'ok',
    ticker,
    signals: {
      smaBullish,
      rsiOversold,
      strongBuySignal
    }
  });
}
```

## Next Steps

1. Choose an example that fits your strategy
2. Copy it to `src/index.ts`
3. Customize parameters and logic
4. Build with `npm run build`
5. Test in Exchange Outpost
6. Iterate and improve!
