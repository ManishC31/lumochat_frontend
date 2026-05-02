# LumoChat — Frontend

The React frontend for LumoChat, a real-time messaging application. Built with Vite, TypeScript, shadcn/ui, and Socket.io.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| State / data fetching | TanStack React Query |
| Real-time | Socket.io client |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + CSS variables (theming) |

## Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui primitives (button, dialog, input, …)
│   ├── chat/
│   │   ├── ChatSidebar.tsx       # Contact list, search, connection requests
│   │   ├── ChatArea.tsx          # Message thread + send form
│   │   └── ContactDetailPanel.tsx# Shared media viewer for a conversation
│   ├── PreviewSection.tsx        # Left-side branding panel on the auth page
│   ├── ProtectedRoute.tsx        # Redirects unauthenticated users to /
│   └── ChatBubble.tsx            # Individual message bubble
├── pages/
│   ├── Authentication.tsx        # Login / register page (tabs)
│   ├── Chat.tsx                  # Main chat layout (sidebar + area + detail panel)
│   └── NotFound.tsx              # 404 fallback
├── contexts/
│   └── AuthContext.tsx           # Auth state, current user, socket lifecycle
├── services/                     # Thin wrappers around the REST API
│   ├── auth.ts                   # signup, signin, signout
│   ├── connections.ts            # get contacts, send/accept/reject requests
│   ├── message.ts                # send message, fetch messages, fetch media
│   └── user.ts                   # get profile, update profile
├── hooks/
│   ├── use-mobile.tsx            # Responsive breakpoint hook
│   └── use-toast.ts              # Toast notification hook
├── config/
│   └── backend.ts                # Base API URL (reads VITE_BACKEND_URL)
└── lib/
    └── utils.ts                  # cn() helper (clsx + tailwind-merge)
```

## How It Was Built

### Authentication
The auth page (`Authentication.tsx`) has two tabs — **Sign In** and **Sign Up** — powered by React Hook Form with Zod validation schemas. On success the server returns a JWT stored in `localStorage`; `AuthContext` stores the decoded user object in React state and makes it available app-wide.

### Routing & Protection
React Router v6 with three routes:
- `/` — Authentication page (redirects to `/chat` if already logged in)
- `/chat` — Main chat interface, wrapped in `ProtectedRoute`
- `*` — 404 page, also behind `ProtectedRoute`

### Real-time Messaging
`AuthContext` opens a Socket.io connection on login and tears it down on logout. Events handled:

| Event (client ← server) | Effect |
|---|---|
| `newMessage` | Appends the message to the active conversation |
| `getOnlineUsers` | Updates the online-user set shown as green dots |
| `typing` | Shows the "… is typing" indicator |
| `stop_typing` | Hides the typing indicator |

The socket is authenticated via the JWT from `localStorage`, passed in the handshake `auth` object and verified by the server before the connection is accepted.

### Message Pagination
`ChatArea` fetches messages in pages of 15 using `offset` + `limit` query params. An `IntersectionObserver` on the top sentinel element triggers the next page load as the user scrolls up, prepending older messages without re-rendering the whole list.

### Media Support
Messages can include a file attachment (image, video, or audio). The send form uses a hidden `<input type="file">` and submits a `multipart/form-data` request. Images are previewed inline; audio files use a custom `<audio>` player; videos use `<video>`.

`ContactDetailPanel` shows all shared media for a conversation grouped into **Images**, **Videos**, and **Audio** tabs, with a full-screen lightbox for images.

### UI & Theming
Built on shadcn/ui components over a CSS-variable token system. The palette is defined in `index.css` as HSL variables, making it straightforward to swap themes. Tailwind utility classes handle layout and spacing. Animations (`animate-fade-in`, `animate-scale-in`, `animate-float`) are defined as custom Tailwind keyframes.

## Getting Started

### Prerequisites
- Node.js 18+
- The backend running on port `9090` (or set `VITE_BACKEND_URL`)

### Install & run

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

### Environment variables

Create a `.env` file in this directory:

```env
VITE_BACKEND_URL=http://localhost:9090
```

### Other scripts

```bash
npm run build       # production build → dist/
npm run preview     # preview production build locally
npm run lint        # ESLint
npm run test        # Vitest unit tests
npm run test:watch  # Vitest in watch mode
```

## Key Dependencies

```
react, react-dom            # UI runtime
react-router-dom            # client-side routing
@tanstack/react-query       # server state, caching, pagination
socket.io-client            # real-time messaging
react-hook-form + zod       # form validation
shadcn/ui (radix-ui)        # accessible component primitives
tailwindcss                 # utility-first styling
sonner                      # toast notifications
lucide-react                # icon set
date-fns                    # date formatting
```
