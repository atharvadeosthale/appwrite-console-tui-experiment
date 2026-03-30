# Appwrite Console TUI

A terminal-native interface for the [Appwrite Console](https://appwrite.io), built with [OpenTUI](https://github.com/nickhudkins/opentui) and React. Designed to mirror the Appwrite Console dark mode as closely as possible while being fully interactive and keyboard/mouse driven.

```
 ◢ APPWRITE  /  Personal projects  / Appwrite Project  FRA              atharva@appwrite.io  Logout
────────────────────────────────────────────────────────────────────────────────────────────────────
   │                        │
 📊│ 🗄️ test                │  ←  hello  69ca5cff001f87cddf95
   │  📋 hello              │
 👥│                        │  Rows  Columns  Indexes  Activity  Usage  Settings
 🗄️│                        │ ────────────────────────────────────────────────────────────────────
 ⚡│                        │  + Create row    ↻ Refresh
 💬│                        │
 📁│                        │  #  $id                  title              $createdAt     $updatedAt
   │                        │  1  69ca623d0006623807cd  eedf               Mar 30, 4:52  Mar 30
 🌐│                        │  2  hello                 title              PM             PM
   │  + Create table        │
 ⚙️│────────────────────────│
   │  🔄 Backups            │
   │  📈 Usage              │ 2 rows                              ‹ Prev  1 / 1  Next ›
   │  ⚙️ Settings           │
```

## Features

### Authentication
- Email/password sign-in against any Appwrite instance
- Session persistence across restarts (`~/.config/appwrite-console-tui/state.json`)
- Cloud and self-hosted mode detection

### Organizations & Projects
- Browse and switch between organizations
- View project directory with search
- Create new organizations and projects

### Auth (Users)
- List users with name, email, status, registration date
- User detail inspector panel
- Create new users
- Search and filter

### Databases (Full Functionality)
- **Database list** with table/grid view toggle, search, pagination
- **Table list** within a database with security info
- **Rows tab** -- Spreadsheet-style grid with:
  - Row numbers
  - Dynamic columns from schema (`$id`, custom fields, `$createdAt`, `$updatedAt`)
  - Click to select, inline edit panel for modifying field values
  - Create/delete rows
  - Pagination with page navigation
- **Columns tab** -- View all columns with type, status, required, size, default. Create and delete columns.
- **Indexes tab** -- View all indexes with type, status, columns, orders. Create and delete indexes.
- **Activity tab** -- Table activity logs showing event, user, IP, time, client.
- **Usage tab** -- Row count totals and daily usage bar chart over 30 days.
- **Settings tab** -- View/edit table name, row security, enabled status. Delete table.
- **Sub-navigation sidebar** matching the console's secondary sidebar: database name, table list, create table, backups/usage/settings.
- Main sidebar collapses to icon-only mode when inside a database (matching console behavior).

### UI
- Dark mode color palette matching the Appwrite Console
- Responsive layout that adapts to terminal size (tested 80-200+ columns)
- Three-panel layout: sidebar + sub-navigation + content
- Single-line tabs, compact toolbar buttons, inline search
- Modal dialogs for all creation/edit flows
- Mouse support (click, hover states)
- Keyboard support via Kitty keyboard protocol

## Requirements

- [Bun](https://bun.sh) runtime
- A running Appwrite instance (default: `http://localhost:9501/v1`)
- A terminal with true-color and emoji support (iTerm2, Kitty, WezTerm, Ghostty, etc.)

## Quick Start

```bash
# Install dependencies
bun install

# Run the TUI (connects to localhost:9501 by default)
bun run dev

# Or specify a custom endpoint
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 bun run dev
```

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|---|---|---|
| `APPWRITE_ENDPOINT` | `http://localhost:9501/v1` | Appwrite API endpoint |
| `APPWRITE_CONSOLE_MODE` | auto-detected | `cloud` or `selfhosted` |
| `APPWRITE_MULTI_REGION` | `false` | Enable multi-region support |
| `APPWRITE_TUI_ALT_SCREEN` | `true` | Use alternate screen buffer |
| `APPWRITE_TUI_MOUSE` | `true` | Enable mouse support |

## Development

```bash
# Type check
bun run typecheck

# Run tests
bun test

# Run in headless mode (outputs a text frame for testing)
bun run dev:headless
```

## Architecture

```
src/
  index.tsx              CLI renderer setup, signal handling
  app/
    App.tsx              Root component, state management, API orchestration
    config.ts            Runtime configuration from environment
    types.ts             TypeScript interfaces and service contract
  components/
    primitives.tsx       Design system: Button, Tabs, DataTable, Modal, etc.
  features/
    screens.tsx          Screen components: Login, Organizations, Workspace
  sdk/
    service.ts           Appwrite SDK wrapper implementing ConsoleService
  state/
    persistence.ts       File-based session persistence
  theme/
    tokens.ts            Color palette and sidebar configuration
  utils/
    format.ts            Date/value formatting helpers
    schema.ts            Column schema validation and row builders
```

## Controls

- **Mouse**: Click to navigate, select, and interact with all elements
- **Keyboard**: Type in input fields, Enter to submit, Escape to cancel
- **Ctrl-C** twice within 2 seconds to quit

## License

Internal Appwrite experiment.
