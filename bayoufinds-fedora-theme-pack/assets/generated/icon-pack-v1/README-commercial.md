Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# BayouFinds Aqua Pro Icon Pack v1

BayouFinds Aqua Pro Icon Pack v1 is a polished folder icon concept set for personal Fedora/GNOME workstation customization.

## Style

- macOS-inspired rounded folder forms
- Glossy aqua finish
- Professional BayouFinds/BayouOps identity accents
- Transparent PNG exports
- Editable SVG source files
- No gaming or RGB styling

## Included Icons

- `folder-default-cypress`: default folder, Cypress Gray
- `folder-bayoufinds`: BayouFinds folder, Bayou Green
- `folder-bayouops`: BayouOps folder, Bayou Green with subtle emblem accent
- `folder-projects`: projects folder, Bayou Green
- `folder-infrastructure`: infrastructure folder, River Blue
- `folder-archives`: archives folder, Copper

## Included Formats

- SVG source files in this directory
- PNG exports under:
  - `png/256/`
  - `png/512/`
  - `png/1024/`
- Product preview images under `previews/`
- Local preview page: `preview.html`

## Fedora/GNOME Personal Install Notes

These assets are mockup icon files, not an automated installer.

To use an icon for a specific folder in GNOME Files:

1. Right-click the folder.
2. Select `Properties`.
3. Click the folder icon in the properties dialog.
4. Choose one of the PNG files from `png/512/` or `png/1024/`.
5. Close the dialog.

For a personal icon theme experiment:

1. Create a user-local icon theme directory:

```bash
mkdir -p ~/.local/share/icons/BayouFinds-Aqua-Pro/places/scalable
mkdir -p ~/.local/share/icons/BayouFinds-Aqua-Pro/places/256
```

2. Copy SVG and PNG files into that user-local theme directory.
3. Create an `index.theme` file for your local icon theme.
4. Select the theme with GNOME Tweaks or:

```bash
gsettings set org.gnome.desktop.interface icon-theme 'BayouFinds-Aqua-Pro'
```

This package does not run those commands automatically.

## Safety

This package does not install anything, does not require sudo, and does not modify GDM, Plymouth, dconf, or system theme paths.

See `LICENSE-personal-use.txt` for usage terms.
