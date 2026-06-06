Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# User-Level Install

BayouFinds Aqua Pro v1.2 includes a user-level installer for the current Fedora 42 GNOME account.

## Target Platform

- Fedora 42 Workstation
- GNOME desktop
- Adwaita icon theme available as fallback
- Firefox or another managed browser

## Review Before Installing

Open the local previews:

```bash
xdg-open assets/generated/icon-pack-v1/preview.html
xdg-open assets/generated/v1.0/preview.html
xdg-open assets/generated/v1.1/preview.html
xdg-open assets/generated/v1.2/preview.html
```

Run validation:

```bash
bash -n scripts/*.sh
./scripts/validate-aqua-pro-v1.0.sh
./scripts/validate-aqua-pro-v1.1.sh
./scripts/validate-aqua-pro-v1.2.sh
```

## User Install Command

Run only after review:

```bash
./scripts/install-aqua-pro-user.sh
```

The installer:

- Runs `scripts/backup-user-aqua-pro-settings.sh`.
- Copies the icon theme to `~/.local/share/icons/BayouFinds-Aqua-Pro`.
- Copies wallpaper assets to `~/.local/share/backgrounds/bayoufinds/`.
- Sets the current user's icon theme to `BayouFinds-Aqua-Pro`.
- Sets current user wallpaper and lock screen settings with absolute file URIs.
- Updates the user icon cache when `gtk-update-icon-cache` is available.
- Restarts Nautilus only with `nautilus -q` when available.

## Wallpaper And Lock Screen Install Plan

Review these staged assets:

- `wallpapers/bayoufinds-wallpaper-4k.png`
- `lockscreen/bayoufinds-lockscreen.png`

The v1.1 installer applies these only to the current user account.

## GDM And Plymouth

GDM and Plymouth assets are staged only:

- `login/gdm-background.png`
- `plymouth/bayoufinds/`

Do not modify GDM or Plymouth until a separate approved change window exists.

## Browser Homepage

See `docs/BROWSER_HOMEPAGE.md`.

## Dock Layout

See `docs/DOCK_LAYOUT.md`.
