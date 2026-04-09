# feriados-mcp

MCP server for the [feriados.io](https://feriados.io) API. Query Latin American public holidays and business days directly from Claude.

## Prerequisites

- Node.js 18+
- A feriados.io API key — get one free at [feriados.io/dashboard](https://feriados.io/dashboard)

## Setup

### Claude Code

Add to your `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "feriados": {
      "command": "npx",
      "args": ["-y", "@feriados-io/mcp"],
      "env": {
        "FERIADOS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "feriados": {
      "command": "npx",
      "args": ["-y", "@feriados-io/mcp"],
      "env": {
        "FERIADOS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

No installation needed — `npx` downloads and runs the package automatically.

## Tools

| Tool | Description |
|---|---|
| `get_holidays` | All public holidays for a country and year |
| `is_business_day` | Check if a date is a business day |
| `is_business_day_batch` | Check multiple dates at once |
| `next_holiday` | Next public holiday from a given date |
| `add_business_days` | Add N business days to a date (skips weekends & holidays) |
| `business_days_between` | Count business days between two dates |
| `last_business_day` | Last business day of a given month |

## Supported countries

| Code | Country |
|---|---|
| `cl` | Chile |
| `ar` | Argentina |
| `mx` | Mexico |
| `co` | Colombia |
| `pe` | Peru |
| `uy` | Uruguay |
| `bo` | Bolivia |
| `ec` | Ecuador |
| `cr` | Costa Rica |
| `pa` | Panama |
| `py` | Paraguay |

## Example usage

Once configured, you can ask Claude things like:

- *"Is April 18 a business day in Chile?"*
- *"What are the public holidays in Mexico for 2026?"*
- *"Add 5 business days to today's date in Colombia."*
- *"How many business days are there between March 1 and March 31 in Argentina?"*

## Plans

The free plan includes 1,000 requests/month and supports up to 31 dates per batch request. See [feriados.io/pricing](https://feriados.io/pricing) for details on paid plans.

## License

MIT
