# GitHub Agent Files - Documentation Index

This repository includes comprehensive documentation to help AI agents and developers understand and use the TypeScript Function Template for Exchange Outpost.

## Documentation Files

### 📄 [README.md](../README.md)
**Main repository documentation**

Complete overview of the template including:
- Installation instructions
- Quick start guide
- API documentation
- Working with Exchange Outpost ABI
- Project structure
- Build process
- Use cases and examples

**Best for**: Understanding the repository, getting started, and comprehensive reference.

---

### 🤖 [.github/copilot-instructions.md](.github/copilot-instructions.md)
**GitHub Copilot specific instructions**

Detailed technical guidance for GitHub Copilot including:
- Repository context and architecture
- Technology stack details
- Build pipeline explanation
- Exchange Outpost ABI usage patterns
- Code generation guidelines
- Best practices and constraints
- Common use cases
- When user asks for specific features

**Best for**: GitHub Copilot understanding project context and generating appropriate code.

---

### 🎯 [.github/AGENT_CONTEXT.md](.github/AGENT_CONTEXT.md)
**AI Agent quick reference**

Condensed, focused information for AI agents:
- What this repository is
- Data structures (input/output formats)
- Key API reference with examples
- Common tasks with code snippets
- Important constraints
- Real-world example reference
- Debugging tips

**Best for**: AI agents needing quick, actionable information without extensive reading.

---

### 💡 [.github/EXAMPLES.md](.github/EXAMPLES.md)
**Complete plugin examples**

Full, copy-paste-ready implementations:
1. Simple Moving Average Alert
2. RSI Overbought/Oversold Alert
3. Price Threshold Alert
4. Volume Spike Detector
5. Bollinger Bands Breakout
6. Multiple Timeframe Analysis

Each example includes:
- Complete, working code
- Configuration parameters
- Explanation of functionality
- Ready to use in `src/index.ts`

**Best for**: Starting a new strategy, learning by example, or adapting existing patterns.

---

### ⚡ [.github/QUICK_REFERENCE.md](.github/QUICK_REFERENCE.md)
**Cheat sheet and quick lookup**

Fast reference for common operations:
- Essential commands
- Basic plugin template
- API cheat sheet
- Common calculations (SMA, EMA, RSI, etc.)
- Error handling patterns
- Output formats
- Debugging techniques
- Type definitions
- Constraints summary

**Best for**: Quick lookups during development, copy-paste snippets, refreshing memory.

---

## File Organization

```
typescript-function-template/
├── README.md                          # Main documentation
├── .github/
│   ├── copilot-instructions.md       # GitHub Copilot instructions
│   ├── AGENT_CONTEXT.md              # AI agent quick reference
│   ├── EXAMPLES.md                    # Complete plugin examples
│   ├── QUICK_REFERENCE.md            # Cheat sheet
│   └── INDEX.md                       # This file
├── src/
│   ├── index.ts                       # Plugin implementation
│   └── index.d.ts                     # Type definitions
└── ...
```

## Usage Guide

### For Developers
1. Start with [README.md](../README.md) for complete understanding
2. Review [EXAMPLES.md](EXAMPLES.md) to see working implementations
3. Use [QUICK_REFERENCE.md](QUICK_REFERENCE.md) during development

### For AI Agents (GitHub Copilot, etc.)
1. Read [copilot-instructions.md](copilot-instructions.md) for project context
2. Reference [AGENT_CONTEXT.md](AGENT_CONTEXT.md) for quick lookups
3. Use [EXAMPLES.md](EXAMPLES.md) when generating similar code

### For Quick Tasks
- Need a command? → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Need an example? → [EXAMPLES.md](EXAMPLES.md)
- Need API details? → [README.md](../README.md) or [AGENT_CONTEXT.md](AGENT_CONTEXT.md)

## Key Concepts Summary

### What This Template Does
Creates WebAssembly plugins for the Exchange Outpost trading platform that:
- Analyze candlestick market data
- Calculate technical indicators
- Detect trading signals
- Send email and webhook notifications

### Technology Stack
- **Language**: TypeScript
- **Runtime**: Extism (QuickJS, ES2020)
- **Build**: esbuild + extism-js
- **ABI**: Exchange Outpost ABI library

### Development Flow
```
Edit src/index.ts → Run npm run build → Upload dist/plugin.wasm → Test in Exchange Outpost
```

### Core Pattern
```typescript
import { FunctionArgs, scheduleEmail, output } from "exchange-outpost-abi";

function run() {
  const args = FunctionArgs.get();
  const candles = args.getCandles('BTCUSDT');
  // Your logic here
  output({ status: 'ok' });
}

module.exports = { run };
```

## Related Resources

- **Exchange Outpost ABI**: [GitHub Repository](https://github.com/ExchangeOutpost/exchange-outpost-abi)
- **SMA Alert Example**: [GitHub Repository](https://github.com/ExchangeOutpost/sma-alert)
- **Extism**: [Official Documentation](https://extism.org/docs)

## Contributing

When adding new documentation:
1. Keep it focused and actionable
2. Include working code examples
3. Update this index file
4. Cross-reference related sections

## Support

For questions or issues:
- Review the appropriate documentation file above
- Check [Exchange Outpost ABI Issues](https://github.com/ExchangeOutpost/exchange-outpost-abi/issues)
- Consult [Extism Documentation](https://extism.org/docs)

---

**Last Updated**: January 5, 2026

**Documentation Version**: 1.0.0
