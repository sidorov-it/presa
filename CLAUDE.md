# Presa3 - Presentation Editor Project Guidelines

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces defined in `/src/types`
- **Imports**: Use absolute imports with `@/` prefix (e.g. `@/components/ui/Button`)
- **Component Structure**: React functional components with TypeScript interfaces
- **State Management**: Use Zustand store in `/src/store` with typesafe actions
- **Styling**: Use CSS modules (.module.css) and Tailwind CSS
- **Naming**: 
  - PascalCase for components and type interfaces
  - camelCase for functions, variables and props
  - Use descriptive names that indicate purpose
- **Error Handling**: Return empty values or fallbacks instead of throwing errors
- **Folder Structure**: Group components by domain/function in `/src/components`
- **File Organization**: One component per file with named exports