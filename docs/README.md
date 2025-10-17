# Documentation Index

Welcome to the Artful Space Crochet Tracker documentation. This directory contains comprehensive technical documentation for the project.

## Documentation Structure

### 📋 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
**Start here for a high-level understanding of the project.**

- Project description and purpose
- Key features overview
- Development platform information
- User experience highlights
- Data storage approach
- Development philosophy

**Best for**: Product managers, new developers, stakeholders

---

### 🛠️ [TECH_STACK.md](./TECH_STACK.md)
**Complete list of technologies, frameworks, and tools used.**

- Core technologies (React Native, Expo, TypeScript)
- UI and styling libraries
- Media and device features
- State management solutions
- Platform support details
- Configuration files reference

**Best for**: Developers evaluating the tech stack, architecture decisions

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**Deep dive into the application architecture and design patterns.**

- Project structure and file organization
- Architectural patterns (routing, state management, data flow)
- Component hierarchy
- Navigation structure
- Styling system
- Type safety approach
- Performance considerations
- Error handling

**Best for**: Developers working on the codebase, code reviews

---

### 📊 [DATA_MODELS.md](./DATA_MODELS.md)
**Complete TypeScript interface definitions and data structures.**

- Core entities (Project, InventoryItem, User)
- Detailed type definitions (YarnDetails, HookDetails, NotionDetails)
- Data relationships
- Validation rules
- Usage examples

**Best for**: Developers implementing features, database design, API integration

---

### 📦 [LIBRARIES.md](./LIBRARIES.md)
**Comprehensive reference of all dependencies.**

- Complete library listing with versions
- Purpose and documentation links for each library
- Category breakdown (48 total dependencies)
- Bundle size impact analysis
- Update strategy
- License compliance

**Best for**: Dependency audits, updates, troubleshooting, security reviews

---

## Quick Reference

### Project Statistics

```
Framework:              Expo + React Native
Language:               TypeScript 5.8.3
React Version:          19.0.0
React Native Version:   0.79.1
Total Dependencies:     48 (43 prod, 5 dev)
Lines of Code:          ~15,000+ (estimated)
Platforms:              iOS, Android, Web
```

### Main Tech Stack at a Glance

```
UI Framework:           React Native 0.79.1
Navigation:             Expo Router 5.0.3
State Management:       Context API + Zustand
Storage:                AsyncStorage
Styling:                NativeWind (Tailwind)
Icons:                  Lucide React Native
AI:                     Google Generative AI
i18n:                   i18n-js
Type Checking:          TypeScript (strict mode)
```

### Directory Structure Quick Map

```
app/          → All screens and routes (Expo Router)
components/   → Reusable UI components
hooks/        → Custom React hooks and context providers
types/        → TypeScript type definitions
constants/    → App-wide constants (colors, typography, avatars)
translations/ → i18n translation files
assets/       → Static assets (images, icons)
docs/         → Project documentation (you are here!)
```

---

## For New Developers

### Getting Started Checklist

1. ✅ Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for context
2. ✅ Review [TECH_STACK.md](./TECH_STACK.md) to understand technologies
3. ✅ Study [ARCHITECTURE.md](./ARCHITECTURE.md) to understand structure
4. ✅ Reference [DATA_MODELS.md](./DATA_MODELS.md) when working with data
5. ✅ Check [LIBRARIES.md](./LIBRARIES.md) when adding dependencies

### Essential Reading Order

**Day 1**: PROJECT_OVERVIEW.md → ARCHITECTURE.md (sections 1-3)
**Day 2**: TECH_STACK.md → ARCHITECTURE.md (sections 4-10)
**Day 3**: DATA_MODELS.md → LIBRARIES.md
**Ongoing**: Reference documentation as needed

---

## For Specific Tasks

### Adding a New Feature
1. Check [DATA_MODELS.md](./DATA_MODELS.md) for existing types
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for patterns
3. Reference [TECH_STACK.md](./TECH_STACK.md) for available libraries

### Updating Dependencies
1. Check [LIBRARIES.md](./LIBRARIES.md) for current versions
2. Review compatibility with Expo SDK version
3. Test on all platforms (iOS, Android, Web)

### Debugging
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow
2. Review [DATA_MODELS.md](./DATA_MODELS.md) for data structure
3. Reference [LIBRARIES.md](./LIBRARIES.md) for library docs

### UI/UX Changes
1. Review constants/colors.ts and constants/typography.ts
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for styling system
3. Ensure platform-specific considerations (iOS/Android/Web)

---

## Contributing to Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Keep up-to-date with code changes
- Use Markdown formatting consistently
- Link between documents when relevant

### When to Update Documentation

- Adding new features or major changes
- Introducing new dependencies
- Changing data models or types
- Modifying architecture patterns
- Updating tech stack versions

---

## External Resources

### Official Documentation
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Project Resources
- [Main README](../README.md) - Setup and running instructions
- [Rork Platform](https://rork.com) - App builder platform

---

## Document Maintenance

**Last Updated**: 2025-10-17
**Maintained By**: Development Team
**Review Frequency**: Monthly or on major changes

### Change Log

- **2025-10-17**: Initial documentation created
  - PROJECT_OVERVIEW.md
  - TECH_STACK.md
  - ARCHITECTURE.md
  - DATA_MODELS.md
  - LIBRARIES.md
  - README.md (this file)

---

## Need Help?

If you can't find what you're looking for in these docs:

1. Check the main [README.md](../README.md) for setup instructions
2. Search the codebase for examples
3. Review component implementations in `/components` and `/app`
4. Check library documentation in [LIBRARIES.md](./LIBRARIES.md)
5. Contact the development team

---

**Happy Coding! 🧶**
