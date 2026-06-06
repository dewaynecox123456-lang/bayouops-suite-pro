Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# System Files Modified

This document lists every system path the installer writes or updates.

## Backgrounds

- `/usr/share/backgrounds/bayoufinds/bayoufinds-wallpaper-4k.png`
- `/usr/share/backgrounds/bayoufinds/gdm-background.png`
- `/usr/share/backgrounds/bayoufinds/bayoufinds-lockscreen.png`

Purpose: desktop wallpaper, GDM background, and lock screen background.

## GNOME Shell Theme

- `/usr/share/themes/BayouFinds/gnome-shell/gnome-shell.css`

Purpose: BayouFinds dark shell styling with swamp green accents and steel blue highlights.

## Icon Theme

- `/usr/share/icons/BayouFinds/index.theme`
- `/usr/share/icons/BayouFinds/places/scalable/Folder-Green.svg`
- `/usr/share/icons/BayouFinds/places/scalable/Folder-Blue.svg`
- `/usr/share/icons/BayouFinds/places/scalable/Folder-Cypress.svg`
- `/usr/share/icons/BayouFinds/places/scalable/Folder-Copper.svg`
- `/usr/share/icons/BayouFinds/places/256/Folder-Green.png`
- `/usr/share/icons/BayouFinds/places/256/Folder-Blue.png`
- `/usr/share/icons/BayouFinds/places/256/Folder-Cypress.png`
- `/usr/share/icons/BayouFinds/places/256/Folder-Copper.png`

Purpose: BayouFinds folder accent icons that inherit remaining system icons from Adwaita.

## GDM Configuration

- `/etc/dconf/db/gdm.d/00-bayoufinds-background`

Purpose: sets the GDM background image and dark color preference for the login screen.

The installer runs:

```bash
sudo dconf update
```

## Plymouth

- `/usr/share/plymouth/themes/bayoufinds/bayoufinds.plymouth`
- `/usr/share/plymouth/themes/bayoufinds/bayoufinds.script`
- `/usr/share/plymouth/themes/bayoufinds/bayoufinds-emblem.png`

Purpose: BayouFinds boot splash theme.

The installer runs:

```bash
sudo plymouth-set-default-theme -R bayoufinds
```

## Terminal

- `/etc/profile.d/bayouops-profile.sh`
- `/etc/motd`

Purpose: BayouOps shell prompt and MOTD.

## Firefox

- `/usr/lib64/firefox/distribution/policies.json`

Purpose: sets Firefox homepage to `https://bayoufinds.com`.

## User Settings

The installer updates the current user's GNOME settings with `gsettings`:

- `org.gnome.desktop.interface color-scheme`
- `org.gnome.desktop.interface icon-theme`
- `org.gnome.desktop.background picture-uri`
- `org.gnome.desktop.background picture-uri-dark`
- `org.gnome.desktop.screensaver picture-uri`
- `org.gnome.shell.extensions.user-theme name`, only when the schema is available
