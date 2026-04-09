#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://api.feriados.io/v1";

const COUNTRIES = ["cl","ar","uy","co","pe","bo","ec","cr","pa","py","mx"] as const;
type Country = typeof COUNTRIES[number];

function getApiKey(): string {
  const key = process.env.FERIADOS_API_KEY;
  if (!key) throw new Error("FERIADOS_API_KEY environment variable is not set. Get your key at https://feriados.io/dashboard");
  return key;
}

async function callApi(path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`feriados.io API error ${res.status}: ${body}`);
  }
  return res.json();
}

function country(c: string): string {
  return c.toUpperCase();
}

const server = new Server(
  { name: "feriados-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_holidays",
      description: "Get all public holidays for a country and year. Returns date, name, type and whether it's irrenunciable.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES, description: "Country code (cl, ar, mx, co, pe, uy, bo, ec, cr, pa, py)" },
          year:    { type: "integer", description: "Year, e.g. 2026" },
        },
        required: ["country", "year"],
      },
    },
    {
      name: "is_business_day",
      description: "Check if a date is a business day (not a weekend or public holiday) in a given country.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          date:    { type: "string", description: "Date in YYYY-MM-DD format" },
        },
        required: ["country", "date"],
      },
    },
    {
      name: "is_business_day_batch",
      description: "Check multiple dates at once. More efficient than calling is_business_day repeatedly. Free plan: max 31 dates.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          dates:   { type: "array", items: { type: "string" }, description: "Array of dates in YYYY-MM-DD format" },
        },
        required: ["country", "dates"],
      },
    },
    {
      name: "next_holiday",
      description: "Get the next public holiday from a given date (or from today if no date is provided).",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          date:    { type: "string", description: "Reference date in YYYY-MM-DD format (optional, defaults to today)" },
        },
        required: ["country"],
      },
    },
    {
      name: "add_business_days",
      description: "Add N business days to a date, skipping weekends and holidays. Useful for SLA deadlines and delivery estimates.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          date:    { type: "string", description: "Start date in YYYY-MM-DD format" },
          days:    { type: "integer", description: "Number of business days to add (use negative to subtract)" },
        },
        required: ["country", "date", "days"],
      },
    },
    {
      name: "business_days_between",
      description: "Count how many business days fall between two dates, excluding weekends and holidays.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          start:   { type: "string", description: "Start date in YYYY-MM-DD format" },
          end:     { type: "string", description: "End date in YYYY-MM-DD format" },
        },
        required: ["country", "start", "end"],
      },
    },
    {
      name: "last_business_day",
      description: "Get the last business day of the month for a given date. Useful for payroll and billing cutoffs.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: COUNTRIES },
          date:    { type: "string", description: "Any date within the target month in YYYY-MM-DD format" },
        },
        required: ["country", "date"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "get_holidays": {
        const { country: c, year } = args as { country: Country; year: number };
        result = await callApi(`/${country(c)}/holidays?year=${year}`);
        break;
      }
      case "is_business_day": {
        const { country: c, date } = args as { country: Country; date: string };
        result = await callApi(`/${country(c)}/is-business-day?date=${date}`);
        break;
      }
      case "is_business_day_batch": {
        const { country: c, dates } = args as { country: Country; dates: string[] };
        result = await callApi(`/${country(c)}/is-business-day/batch`, {
          method: "POST",
          body: JSON.stringify({ dates }),
        });
        break;
      }
      case "next_holiday": {
        const { country: c, date } = args as { country: Country; date?: string };
        const qs = date ? `?date=${date}` : "";
        result = await callApi(`/${country(c)}/next-holiday${qs}`);
        break;
      }
      case "add_business_days": {
        const { country: c, date, days } = args as { country: Country; date: string; days: number };
        result = await callApi(`/${country(c)}/business-days/add?date=${date}&days=${days}`);
        break;
      }
      case "business_days_between": {
        const { country: c, start, end } = args as { country: Country; start: string; end: string };
        result = await callApi(`/${country(c)}/business-days/between?start=${start}&end=${end}`);
        break;
      }
      case "last_business_day": {
        const { country: c, date } = args as { country: Country; date: string };
        result = await callApi(`/${country(c)}/last-business-day?date=${date}`);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
