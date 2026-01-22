# Learning Opportunity

Shift to teaching mode.

**Target audience:** Technical person learning to code, mid-level understanding.

**Three-level explanation:**

**Level 1: Core Concept**
- What this is and why it exists
- Problem it solves
- When to use it

**Level 2: How It Works**
- Mechanics underneath
- Tradeoffs
- Edge cases
- How to debug

**Level 3: Deep Dive**
- Implementation details
- Performance implications
- Related patterns
- Senior engineer perspective

Use concrete examples from the current codebase.
```

---

## Step 4: Using Slash Commands

After creating these files:

1. **In Cursor chat, type `/`**
2. **You'll see your commands in dropdown**
3. **Select one** (like `/explore`)
4. **It loads the prompt automatically**

---

## Quick Setup in Cursor

**Give Claude this prompt:**
```
Create a .cursorrules folder in the project root.

Inside it, create these slash command files:
1. explore.md
2. create-plan.md
3. execute.md
4. review.md
5. learning.md

Use the standard Zevi workflow prompts for each.

Show me when done.
```

---

## Your Custom Commands

**You can also create commands specific to YOUR workflow:**

**`/knee-feature.md`** - For knee capacity specific features
**`/framework-check.md`** - Validate against your framework
**`/mvp-scope.md`** - Check if feature fits MVP

---

## Alternative: Cursor Composer Rules

Cursor also has `.cursorrules` file (singular) in root:

**File:** `.cursorrules`
```
# Knee Capacity Development Rules

## Project Context
This is a personal knee tracking app for managing osteoarthritis through Keith Barr protocols.

## Code Style
- Vanilla JavaScript (no frameworks)
- Modular architecture (src/ folder)
- LocalStorage for data
- Mobile-first design

## When Building Features
1. Always explore before implementing
2. Create plan before coding
3. Review code before committing
4. Update documentation

## Restrictions
- No emoji in user-facing text
- All text must be UTF-8 safe
- Test on mobile viewport
- Keep bundle size small