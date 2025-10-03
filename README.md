# Math Times Tables App (Standalone)

A comprehensive React-based educational application for learning multiplication tables. This is a standalone version ready for independent deployment.

> **Note**: This app has been converted to a standalone version with all dependencies localized. It no longer requires the parent monorepo structure.

## Features

### Student Features
- **Placement Test**: Adaptive assessment to determine starting level
- **Practice Sessions**: 10-minute focused practice sessions
- **Progress Grid**: Visual 12×12 grid showing mastery progress
- **Real-time Feedback**: Immediate feedback on answers
- **Mastery Tracking**: 3 consecutive correct answers required for mastery

### Learning Coach Features
- **Student Dashboard**: View all students and their progress
- **Guardrail Settings**: Adjust difficulty levels (1-5, 1-9, 1-12)
- **Progress Analytics**: Detailed statistics and insights
- **Session History**: Track learning sessions and performance

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: Custom hooks with React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Manueltnc/learningboltz-math-app.git
   cd learningboltz-math-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173`

### Deployment

For detailed deployment instructions to Vercel or other platforms, see [STANDALONE-DEPLOYMENT.md](./STANDALONE-DEPLOYMENT.md).

## Project Structure

```
apps/math-app/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Authentication components
│   │   ├── student/         # Student-facing components
│   │   └── coach/           # Learning coach components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and configurations
│   ├── pages/               # Main application pages
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Key Components

### Student Components
- **PlacementTest**: Adaptive assessment component
- **PracticeGrid**: Practice session interface
- **MathProblem**: Individual problem display
- **ProgressGrid**: Visual progress tracking

### Coach Components
- **StudentDashboard**: Student management interface
- **GuardrailsSettings**: Difficulty level controls

### Custom Hooks
- **useAuth**: Authentication state management
- **useMathSession**: Session and problem management
- **useGridProgress**: Progress tracking and updates

## Learning Logic

### Placement Test
- 88 problems total
- 90% from 1-9 tables (73 problems)
- 10% from 10-12 tables (15 problems)
- Random selection and shuffling
- Time tracking per problem

### Practice Mode
- Loads student's current progress
- Prioritizes unmastered problems
- 10-minute session limit
- Incorrect answers are re-queued
- Real-time grid updates

### Mastery System
- 3 consecutive correct answers = mastery
- Color-coded progress grid:
  - Red: Not attempted
  - Yellow: 1 correct
  - Orange: 2 correct
  - Green: Mastered (3+ correct)

## Database Schema

The app uses the following Supabase tables:
- `students`: User profiles and metadata
- `learning_sessions`: Session tracking
- `math_progress`: Grid state and mastery
- `student_progress`: Overall progress statistics

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Contributing

1. Follow the established code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Include accessibility features
5. Test on multiple screen sizes

## License

This project is part of the Education Apps Unified platform.
