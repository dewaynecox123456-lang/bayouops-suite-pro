Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# Install Planning

BayouFinds Aqua Pro v1.0 is delivered as an installable desktop standard package, but this repository task does not install it.

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
```

Run validation:

```bash
bash -n scripts/*.sh
./scripts/validate-aqua-pro-v1.0.sh
```

## User-Local GNOME Icon Theme Install Plan

The safest install path for evaluation is user-local and does not require sudo:

```bash
mkdir -p ~/.local/share/icons
cp -a assets/icons/BayouFinds-Aqua-Pro ~/.local/share/icons/
```

Then select the icon theme through GNOME Tweaks, or plan a controlled `gsettings` change:

```bash
gsettings set org.gnome.desktop.interface icon-theme 'BayouFinds Aqua Pro'
```

Do not run that command until the operator has approved the change.

## Wallpaper And Lock Screen Install Plan

Review these staged assets:

- `wallpapers/bayoufinds-wallpaper-4k.png`
- `lockscreen/bayoufinds-lockscreen.png`

For user-local testing, use GNOME Settings to select the wallpaper and lock screen image manually.

## GDM And Plymouth

GDM and Plymouth assets are staged only:

- `login/gdm-background.png`
- `plymouth/bayoufinds/`

Do not modify GDM or Plymouth until a separate approved change window exists.

## Browser Homepage

See `docs/BROWSER_HOMEPAGE.md`.

## Dock Layout

See `docs/DOCK_LAYOUT.md`.
