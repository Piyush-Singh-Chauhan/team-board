# TeamBoard Frontend

Modern, responsive React frontend for TeamBoard - a team collaboration board application.

## Features

-  Modern, responsive UI with Tailwind CSS
-  Mobile-first design
-  Drag and drop card management
-  Secure authentication (tokens in memory only)
-  Fast and performant with Vite
-  Smooth animations and transitions

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file** (optional)
   ```bash
   cp .env
   ```
   
   Set `VITE_API_URL` if your backend is running on a different URL (default: `http://localhost:5000/api`)

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - URL: `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## Project Structure

```
teamboard-frontend/
├── src/
│   ├── api/          # API client and functions
│   ├── components/   # React components
│   │   ├── auth/     # Authentication components
│   │   ├── board/    # Board and card components
│   │   ├── header/   # Header components (Nav, etc.)
│   │   └── ui/       # Reusable UI components
│   ├── context/      # React Context providers
│   ├── pages/        # Page components
│   ├── App.jsx       # Main app component with routing
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Features Implemented

-  User authentication (Login/Register)
-  Team management
-  Board management
-  Card creation and management
-  Drag and drop card reordering
-  Responsive design for all screen sizes
-  Token stored in memory (not localStorage)
-  Error handling and loading states
-  Modern UI with Tailwind CSS

## Technologies Used

- React 18
- React Router v6
- Vite
- Tailwind CSS
- @dnd-kit (drag and drop)
- Axios
- React Icons
- date-fns

## License

ISC
