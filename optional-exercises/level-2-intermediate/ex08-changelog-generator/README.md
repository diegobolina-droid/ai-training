# Exercise 08: Git Changelog Generator

## Descripción
Genera changelogs inteligentes y profesionales desde git commits usando LLMs.

## Objetivos
- Analizar commits entre versiones
- Categorizar cambios (features, fixes, breaking)
- Generar changelog markdown
- Detectar breaking changes automáticamente

## Quick Implementation

```python
import subprocess
from anthropic import Anthropic

class ChangelogGenerator:
    def get_commits(self, from_tag: str, to_tag: str = "HEAD"):
        result = subprocess.run(
            ['git', 'log', f'{from_tag}..{to_tag}', '--pretty=format:%H|%s|%b'],
            capture_output=True,
            text=True
        )
        return self.parse_commits(result.stdout)

    def generate_changelog(self, commits: List[Commit]):
        prompt = f"""
Generate a professional changelog from these commits:

{self.format_commits(commits)}

Categorize as:
- 🚀 Features
- 🐛 Bug Fixes
- 💥 Breaking Changes
- 📚 Documentation
- 🔧 Chores

Format:
## [Version X.Y.Z] - Date
### Category
- Description (commit hash)
"""

        return client.messages.create(
            model="claude-sonnet-4",
            messages=[{"role": "user", "content": prompt}]
        ).content[0].text
```

## Example Output

```markdown
## [2.0.0] - 2025-01-09

### 🚀 Features
- Add user authentication with OAuth2 (abc123f)
- Implement real-time notifications via WebSocket (def456a)
- Add dark mode support (ghi789b)

### 🐛 Bug Fixes
- Fix memory leak in background worker (jkl012c)
- Resolve race condition in cache invalidation (mno345d)

### 💥 Breaking Changes
- Remove deprecated `oldMethod()` - use `newMethod()` instead (pqr678e)
- Change API response format for /users endpoint (stu901f)

### 📚 Documentation
- Update README with new installation steps (vwx234g)
```

## Features
- [ ] Conventional commits parsing
- [ ] Breaking change detection
- [ ] Contributor attribution
- [ ] Release notes generation
- [ ] GitHub Releases integration

## Desafíos
1. Auto-version bumping (semver)
2. PR description generation
3. Multi-repo changelog aggregation

**Tiempo**: 3-4h
