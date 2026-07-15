import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'career-genie-clerk-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_clerk_status',
      description: 'Return the current Clerk-related local configuration for CareerGenie.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_clerk_setup_hint',
      description: 'Return a short setup hint for enabling Clerk auth in this project.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'get_clerk_status') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            installed: true,
            frontendSdk: '@clerk/react',
            backendSdk: '@clerk/backend',
            mode: 'demo-friendly-local-integration',
            note: 'Clerk is available for UI auth flow integration and can be extended with real credentials later.',
          }, null, 2),
        },
      ],
    };
  }

  if (name === 'get_clerk_setup_hint') {
    return {
      content: [
        {
          type: 'text',
          text: 'Add VITE_CLERK_PUBLISHABLE_KEY and a real Clerk backend secret only when you want production-grade session verification. The current project uses a lightweight local/demo auth path.',
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
