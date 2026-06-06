Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# BayouFinds Aqua Pro v1.2 Fedora 42 GNOME Desktop Standard

BayouFinds Aqua Pro v1.2 is a user-level Fedora 42 GNOME desktop standard for BayouFinds/BayouOps workstations.

It includes a user-account installer, backup, rollback, validation, folder icons, file-type icons, wallpaper support, and lock screen support.

## Included

- GNOME icon theme staging: `assets/icons/BayouFinds-Aqua-Pro/`
- User-level install script: `scripts/install-aqua-pro-user.sh`
- User-level rollback script: `scripts/uninstall-aqua-pro-user.sh`
- Bayou Green default folders
- Bayou Green BayouFinds, BayouOps, and Projects folders
- River Blue Infrastructure folders
- Copper Archives folders
- File-type icons for PowerShell, shell, JSON, YAML, Markdown, PDF, archives, images, web files, Node/package files, and BayouOps reports
- Wallpaper and lock screen assets
- GDM login assets staged for review only
- Plymouth boot assets staged for review only
- Browser homepage documentation
- Dock layout documentation
- Home directory folder mockup
- Product screenshots
- Validation script
- Release notes
- BayouFinds Aqua Pro Standards Guide

## Safety

This v1.2 package does not install anything by itself.

The provided installer is user-level only:

- No sudo commands are required.
- No GDM configuration is modified.
- No Plymouth configuration is modified.
- No `/usr/share` paths are modified.
- Only the current user's GNOME settings are changed when `scripts/install-aqua-pro-user.sh` is run.

## Preview

Open these local preview files:

- `assets/generated/icon-pack-v1/preview.html`
- `assets/generated/folder-mockups/preview.html`
- `assets/generated/v1.0/preview.html`
- `assets/generated/v1.1/preview.html`
- `assets/generated/v1.2/preview.html`

## Documentation

- `INSTALL.md`
- `ROLLBACK.md`
- `RELEASE_NOTES.md`
- `docs/ASSET_MANIFEST.md`
- `docs/FILE_TYPE_ICONS.md`
- `docs/BROWSER_HOMEPAGE.md`
- `docs/DOCK_LAYOUT.md`
- `docs/STAGING_ONLY.md`
- `docs/standards/BayouFinds-Aqua-Pro-Standards-Guide.md`

## Packages

- `dist/bayoufinds-aqua-pro-v1.0-fedora42.zip`
- `dist/bayoufinds-aqua-pro-v1.0-fedora42.tar.gz`
- `dist/bayoufinds-aqua-pro-v1.1-fedora42-user-install.zip`
- `dist/bayoufinds-aqua-pro-v1.1-fedora42-user-install.tar.gz`
- `dist/bayoufinds-aqua-pro-v1.2-green-folders-user-install.zip`
- `dist/bayoufinds-aqua-pro-v1.2-green-folders-user-install.tar.gz`
