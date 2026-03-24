# Minichain Dashboard

A modern React-based dashboard for interacting with a blockchain network. Built with Vite, React, and axios.

## Features

- **Dashboard** - View chain height, genesis hash, authorities, and pending transactions
- **Accounts** - Create accounts, check balances, mint tokens
- **Transactions** - Send transactions, view mempool, clear mempool
- **Blocks** - Produce blocks, view block history
- **Contracts** - Deploy and call smart contracts

## Prerequisites

- Node.js 18+
- A running Minichain backend server

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Create environment file:**

Create a `.env` file in the root directory:

```bash
VITE_API_URL=http://localhost:3000
```

Replace `http://localhost:3000` with your Minichain backend URL if different.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## API Endpoints

The dashboard integrates with these backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get blockchain status |
| `/api/init` | POST | Initialize blockchain |
| `/api/account/new` | POST | Create new account |
| `/api/account/balance` | POST | Get account balance |
| `/api/account/info` | POST | Get account details |
| `/api/account/list` | POST | List all accounts |
| `/api/account/mint` | POST | Mint tokens |
| `/api/tx/send` | POST | Send transaction |
| `/api/tx/list` | POST | List mempool transactions |
| `/api/tx/clear` | POST | Clear mempool |
| `/api/block/list` | POST | List blocks |
| `/api/block/info` | POST | Get block details |
| `/api/block/produce` | POST | Produce new block |
| `/api/contract/deploy` | POST | Deploy contract |
| `/api/contract/call` | POST | Call contract |

## Tech Stack

- React 18
- Vite
- axios
- CSS custom properties
