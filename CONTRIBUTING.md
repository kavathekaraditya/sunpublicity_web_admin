# Contributing to SunPublicity

Thank you for your interest in contributing to SunPublicity! This document provides guidelines and best practices for development.

## 📋 Development Setup

1. Follow the installation instructions in README.md
2. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Test thoroughly
5. Submit a pull request

## 🎯 Coding Standards

### JavaScript/React

- Use functional components with hooks
- Follow React best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused (< 300 lines)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects/arrays
- Use destructuring when possible
- Prefer `const` over `let`, avoid `var`

### File Organization

```
ComponentName.jsx       # Component file
├── Imports (grouped)
│   ├── React imports
│   ├── Third-party imports
│   ├── Local imports
├── Constants
├── Helper functions
├── Main component
└── Export
```

### Component Structure

```javascript
import { useState, useEffect } from 'react';
import { externalLib } from 'external-lib';
import { localUtil } from '../utils/localUtil';

// Constants
const CONSTANT_VALUE = 'value';

// Helper functions (if needed)
const helperFunction = () => {
  // ...
};

/**
 * Component description
 * @param {Object} props - Component props
 */
export default function ComponentName({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## 🔧 Development Workflow

### Before Starting

1. Pull latest changes: `git pull origin main`
2. Create feature branch: `git checkout -b feature/feature-name`
3. Install dependencies: `npm install`

### During Development

1. Run dev server: `npm run dev`
2. Make incremental commits with clear messages
3. Test your changes thoroughly
4. Run linter: `npm run lint`

### Before Submitting PR

1. Ensure all tests pass
2. Run production build: `npm run build`
3. Check for console errors/warnings
4. Update documentation if needed
5. Write clear PR description

## 🚫 What NOT to Do

- ❌ Don't commit `.env` files
- ❌ Don't commit `node_modules`
- ❌ Don't use `console.log` in production code
- ❌ Don't commit commented-out code
- ❌ Don't bypass error handling
- ❌ Don't hardcode sensitive data
- ❌ Don't create large components (> 500 lines)

## ✅ Best Practices

### Error Handling

```javascript
import { logger } from '../utils/logger';

try {
  // Your code
} catch (error) {
  logger.error('Operation failed', error);
  // Handle error gracefully
}
```

### Firebase Operations

```javascript
// Always handle loading and error states
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const data = await fetchFromFirebase();
  setData(data);
  setError(null);
} catch (err) {
  logger.error('Firebase fetch failed', err);
  setError(err.message);
} finally {
  setLoading(false);
}
```

### Component Props

```javascript
// Use destructuring and default values
export default function Component({
  title = 'Default Title',
  onSubmit,
  children,
}) {
  // Component logic
}
```

### State Management

```javascript
// Use functional updates for state that depends on previous state
setCount(prevCount => prevCount + 1);

// Use separate state variables for unrelated data
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

- [ ] Component renders correctly
- [ ] All user interactions work
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors/warnings
- [ ] Firebase operations work
- [ ] Navigation works correctly

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 📝 Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add lazy loading to images
fix: Resolve login authentication issue
docs: Update README with setup instructions
style: Format code with prettier
refactor: Simplify error handling logic
perf: Optimize dashboard loading time
```

## 🔍 Code Review Checklist

Before requesting review:

- [ ] Code follows style guidelines
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design verified
- [ ] No hardcoded values
- [ ] Comments added for complex logic
- [ ] No unused imports/variables
- [ ] Build succeeds without warnings

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, etc.
7. **Console Errors**: Any error messages

## 💡 Feature Requests

When suggesting features:

1. **Use Case**: Why is this needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Additional Context**: Screenshots, mockups, etc.

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Getting Help

- Check existing issues and PRs
- Read the documentation
- Ask in discussions
- Email: sunadvertise@gmail.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to SunPublicity! 🎉
