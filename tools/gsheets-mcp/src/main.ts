import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { TokenSource, configDir, consent } from './auth.ts'
import { Google } from './google.ts'
import { registerTools } from './tools.ts'

async function serve(): Promise<void> {
  const server = new McpServer(
    { name: 'gsheets', version: '1.0.0' },
    {
      instructions:
        'Google Sheets and Drive through the syafiqkit sign-in (scopes: spreadsheets, drive.file). Ranges are A1 with the sheet name (Tracker!F34). To reply in a shared tracker cell, read it with cells_read_rich and add your line with cell_append_line: values_update replaces whole cells and wipes other people\'s text colours. A cell holding a Drive file chip cannot be rewritten; hand the user the text to paste. In a merged block only the top-left cell shows, so reply there. Owners rename tabs: re-list with sheets_list when a sheet name stops working.',
    },
  )
  registerTools(server, new Google(new TokenSource()))
  await server.connect(new StdioServerTransport())
}

const [command, ...rest] = process.argv.slice(2)

if (command === 'auth') {
  const i = rest.indexOf('--client')
  await consent(i >= 0 ? rest[i + 1] : undefined).catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
} else if (command === 'check') {
  try {
    await new TokenSource().get()
    console.error(`gsheets: signed in (config ${configDir()})`)
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
} else if (command === undefined || command === 'serve') {
  await serve()
} else {
  console.error('usage: gsheets-mcp [serve | auth [--client <client.json>] | check]')
  process.exit(2)
}
