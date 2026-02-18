# Patchcord Documentation

This directory contains the source for the Patchcord documentation site, deployed to GitHub Pages.

## Quick Links

- 📖 [View Documentation](https://patchcord.github.io)
- ✏️ [Contributing Guide](CONTRIBUTING.md)
- 🎨 [Theme Reference](themes.md)
- ⌨️ [Command Reference](commands.md)

## Directory Structure

```
docs/
├── _config.yml              # Jekyll configuration
├── _layouts/                # Page templates
│   └── default.html        # Main layout
├── _includes/              # Reusable components
├── assets/                 # Images and static files
│   └── themes/            # Theme screenshots
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── docs-issue.yml  # Issue template
├── index.md               # Documentation home
├── getting-started.md     # Installation & setup
├── configuration.md       # Settings guide
├── commands.md            # IRC commands
├── themes.md              # Theme gallery
├── troubleshooting.md     # Common issues
├── CONTRIBUTING.md        # Contribution guide
├── Gemfile                # Ruby dependencies
└── README.md              # This file
```

## Local Development

### Prerequisites

- Ruby 3.0 or higher
- Bundler (`gem install bundler`)

### Setup

```bash
# Install dependencies
bundle install

# Start local server
bundle exec jekyll serve

# Open in browser
# http://localhost:4000
```

### Build

```bash
# Production build
bundle exec jekyll build --baseurl ""

# Output in _site/
```

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

1. Go to repository Settings
2. Navigate to Pages
3. Select source branch (main)
4. Select folder (/docs)
5. Click Save

## Writing Documentation

### Page Template

```markdown
---
layout: default
title: Page Title
nav_order: 1
---

# Page Title

Content here...
```

### Navigation Order

| nav_order | Page |
|-----------|------|
| 1 | index.md (Home) |
| 2 | getting-started.md |
| 3 | configuration.md |
| 4 | commands.md |
| 5 | themes.md |
| 6 | troubleshooting.md |

### Internal Links

```markdown
[Getting Started]({% link getting-started.md %})
```

### Images

```markdown
![Description](assets/image.png)
```

## Style Guide

- Use clear, concise language
- Write in active voice
- Use second person ("you")
- Include code examples
- Add screenshots where helpful

## Testing

```bash
# Check for broken links
bundle exec jekyll build

# Validate configuration
bundle exec jekyll doctor
```

## Questions?

- Open an issue for documentation problems
- Join #patchcord on Libera.Chat
- Email docs@patchcord.dev

## License

Documentation is licensed under the same MIT License as the main project.
