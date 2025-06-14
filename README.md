# ProjectPilot

A Jira-like project management application with a custom passcode authentication system.

## Features

- **Passcode Authentication**: Users register with email and name, and receive a generated passcode
- **Project Management**: Create and manage projects with tasks
- **Task Management**: Create, assign, and track tasks with status updates
- **Team Management**: Project creators can add team members

## Tech Stack

- Next.js
- React
- Tailwind CSS
- Supabase (PostgreSQL database)
- shadcn/ui components

## Setup Instructions

### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd projectpilot
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API to get your project URL and anon key
4. Create a `.env.local` file in the project root with the following:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Set up the database schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `scripts/schema.sql` from this project
3. Paste and run the SQL in the Supabase SQL Editor

### 5. Run the development server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Register as the first user (you'll automatically become the creator)
2. Create projects and tasks
3. Add team members (only available to the creator)
4. Manage your projects and tasks from the dashboard

## Development Mode

For development without a configured database:
- Register with any email/name to get a passcode
- Login with email: `test@example.com` and passcode: `test`

## License

[MIT](LICENSE)
