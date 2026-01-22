# Code Review

Perform comprehensive code review.

**Check for:**
- No console.log statements
- Proper error handling
- No `any` types in TypeScript
- No hardcoded values
- Performance issues
- Security concerns
- Follows project patterns

**Output format:**
### ✅ Looks Good
- [items]

### ⚠️ Issues Found
- **[Severity]** [File:line] - [Issue]
  - Fix: [Suggestion]

### 📊 Summary
- Files reviewed: X
- Critical: X
- Warnings: X