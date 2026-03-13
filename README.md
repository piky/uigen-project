# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Actions
    participant Database
    participant Auth

    User->>Client: Fill sign up form
    Client->>Actions: signUp(email, password)
    Actions->>Database: Check if user exists
    Database-->>Actions: User (or null)
    alt User exists
        Actions-->>Client: Error: Email already registered
    else User doesn't exist
        Actions->>Database: Hash password with bcrypt
        Actions->>Database: Create User record
        Database-->>Actions: User created
        Actions->>Auth: createSession(userId, email)
        Auth->>Auth: Sign JWT with jose
        Auth-->>Client: Set HTTP-only cookie (7 days)
        Client->>Client: Migrate anon work to user account
        Client->>User: Redirect to project page
    end

    User->>Client: Fill sign in form
    Client->>Actions: signIn(email, password)
    Actions->>Database: Find user by email
    Database-->>Actions: User (or null)
    alt User not found
        Actions-->>Client: Error: Invalid credentials
    else User found
        Actions->>Database: Compare password with bcrypt
        alt Invalid password
            Actions-->>Client: Error: Invalid credentials
        else Valid password
            Actions->>Auth: createSession(userId, email)
            Auth-->>Client: Set HTTP-only cookie
            Client->>User: Redirect to project page
        end
    end
```
