# CLAUDE.md

Project-specific rules for Business Japanese Skill. The global `.claude/CLAUDE.md` also applies.

## Project Identity

A **local AI desktop learning tool** for Chinese speakers learning business Japanese. Not SaaS, not a platform, not multi-user. Final deliverable: ZIP → unzip → run locally → enter API Key → start learning.

## Permanent Rules

### 1. Local First
All data in SQLite. No server. No login. No cloud.

### 2. AI Provider Agnostic
Abstract via `AIProvider` interface. UI must not know which provider. Support Anthropic + OpenAI-compatible. Do not create individual provider classes (ClaudeProvider, OpenAIProvider, etc.) unless the interface forces it.

### 3. Data First
Design the data model before writing business logic. If code introduces data without a defined type, stop.

### 4. Mock First
All pages run with Mock Data before SQLite or real AI are connected.

### 5. API Last
Real AI calls are the last thing to integrate. Until the learning loop works end-to-end with mocks, do not touch real APIs.

### 6. One Source of Truth
No duplicate state. Home, Notebook, Review, Quiz all consume the same `LearningDataContext`. No hardcoded counts or separately maintained lists.

### 7. UI / Data Separation
UI consumes data. Never directly calls AI or database. The stack: `UI → Context/Service → Provider/DB`.

### 8. Simple Before Powerful
No Manager, Controller, Factory, Builder, Repository, ServiceHelper classes. A file over 300 lines is the signal to split — not a reason to pre-split. Three SQLite tables max. No migration system until data is real.

### 9. One Screen, One Purpose
Home = overview. AIAnalyze = analyze. Notebook = knowledge base. Review = review. Quiz = test. No cross-page responsibilities.

### 10. Prompt Externalization
All prompts live in `src/prompts/` with versioned filenames (`analysis_v1.md`). Never hardcode prompts in application code.

### 11. Knowledge Base First
The core is not AI chat. It's the local knowledge base. The learning loop is:
```
Input → AI analysis → Select & save → Knowledge base → Review → Quiz → Mastery → Graduate
```
Any feature that does not strengthen this loop does not belong in MVP.

### 12. New Feature Gate
Before adding anything, answer:
1. What problem does it solve?
2. If deleted, does the product still work?
3. Does it strengthen the learning loop?

If any answer is "no/not sure," don't add it.

## Architecture Checklist (after every Phase)

After completing each Phase, output:
- □ New data structures?
- □ New database tables?
- □ New third-party dependencies?
- □ New configuration items?
- □ New prompts?
- □ New pages?
- □ Violates Local First?
- □ Violates Simple Before Powerful?
- □ Designed for future (not current) needs?
- □ If this Phase's additions were removed, does the product still run?

## Key Design Decisions

- `LearningItem` is lean: word, reading, ruby, meaning, partOfSpeech, category, example, exampleMeaning, sourceSentence, source, mastery, nextReviewDate, createdAt, archived. AI analysis fields (grammar, collocations, businessExplanation) are in `LearningPoint` and discarded after display.
- Mastery: RECOGNIZE → CAN_USE → PROFICIENT. SRS scheduling is separate.
- ReviewRecord: itemId, result (correct/incorrect), reviewedAt, duration. Statistics are derived, not stored.
- Settings: provider, model, apiKey, baseUrl, temperature, language.
- Directory: `src/components/ pages/ services/ providers/ database/ prompts/ types/ mock/ assets/ utils/`
- UI is confirmed. Do not redesign unless a bug is found.
