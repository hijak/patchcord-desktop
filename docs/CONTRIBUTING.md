# Contributing to Patchcord Documentation

Thank you for your interest in improving Patchcord documentation! This guide will help you get started.

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/patchcord/patchcord.git
   cd patchcord/frontend/docs
   ```

2. **Install Ruby** (if not already installed)
   ```bash
   # macOS
   brew install ruby

   # Ubuntu/Debian
   sudo apt install ruby-full

   # Windows
   Use RubyInstaller: https://rubyinstaller.org/
   ```

3. **Install dependencies**
   ```bash
   bundle install
   ```

4. **Run local server**
   ```bash
   bundle exec jekyll serve
   ```

5. **Open in browser**
   Navigate to `http://localhost:4000`

## Documentation Structure

```
docs/
├── _config.yml           # Jekyll configuration
├── _layouts/             # Page layouts
│   └── default.html
├── _includes/            # Reusable components
├── assets/               # Images and static files
│   └── themes/           # Theme screenshots
├── index.md              # Documentation home
├── getting-started.md    # Installation guide
├── configuration.md      # Settings guide
├── commands.md           # IRC commands
├── themes.md             # Theme gallery
└── troubleshooting.md    # Common issues
```

## Writing Guidelines

### Style Guide

- **Use clear, concise language**
- **Write in active voice**
- **Use second person ("you")**
- **Keep sentences short**
- **Use code blocks for commands**

### Formatting

#### Headings
```markdown
# Page Title (H1)
## Section (H2)
### Subsection (H3)
#### Detail (H4)
```

#### Code Blocks
````markdown
```bash
# Shell commands
pnpm install
```

```javascript
// JavaScript code
const x = 1;
```
````

#### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
```

#### Notes and Warnings
```markdown
> **Note:** Important information

> **Warning:** Potential issue

> **Danger:** Critical warning
```

### Front Matter

Every page must have front matter:

```yaml
---
layout: default
title: Page Title
nav_order: 1
---
```

### Navigation Order

Set `nav_order` to control page order:
- `1` - Home/Index
- `2` - Getting Started
- `3` - Configuration
- `4` - Commands
- `5` - Themes
- `6` - Troubleshooting

## Adding Images

1. Save images in `docs/assets/`
2. Use relative paths:
   ```markdown
   ![Description](assets/image.png)
   ```

## Internal Links

Use Jekyll's link syntax:

```markdown
[Page Name]({% link page.md %})
```

## Testing Changes

### Check Links
```bash
bundle exec jekyll build
```

### Validate Front Matter
```bash
bundle exec jekyll doctor
```

## Submitting Changes

1. **Fork the repository**

2. **Create a branch**
   ```bash
   git checkout -b docs/your-change
   ```

3. **Make your changes**

4. **Test locally**
   ```bash
   bundle exec jekyll serve
   ```

5. **Commit changes**
   ```bash
   git commit -m "docs: describe your change"
   ```

6. **Push and create PR**
   ```bash
   git push origin docs/your-change
   ```

## Commit Message Format

```
docs: [brief description]

[optional detailed explanation]

Fixes: #issue-number (if applicable)
```

Examples:
```
docs: add troubleshooting section for connection issues

docs: fix typo in getting-started guide

docs: update theme screenshots with new versions
```

## Review Process

1. Documentation team reviews PR
2. Feedback provided within 48 hours
3. Make requested changes
4. PR merged to main branch
5. Auto-deployed to GitHub Pages

## Common Issues

### Build Fails

**Problem:** `bundle exec jekyll serve` fails

**Solution:**
```bash
bundle update
bundle install
bundle exec jekyll serve
```

### Links Not Working

**Problem:** Internal links return 404

**Solution:** Use `{% link %}` syntax:
```markdown
[Link]({% link page.md %})
```

### CSS Not Loading

**Problem:** Custom styles not appearing

**Solution:** Check `_config.yml` and ensure theme is set correctly

## Questions?

- Open an issue for documentation problems
- Join #patchcord on Libera.Chat
- Email docs@patchcord.dev

## Thank You!

Your contributions make Patchcord better for everyone! 🎉
