Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# GDM Safety Notes

The BayouFinds Aqua Pro GDM module is staged only.

It must not be run automatically by any user-level install script.

Manual installation requires a separate approval decision because it writes GDM configuration paths.

## Immutable Fedora Warning

Fedora immutable systems such as Silverblue, Kinoite, and other rpm-ostree variants may mount `/usr` or `/usr/share` read-only.

On those systems, the GDM module is not supported in active install mode. The installer must exit without applying GDM changes and leave the user theme untouched.

Preview-only staging may be created under:

- `~/.local/share/backgrounds/bayoufinds-gdm-staged/`

That directory is only for reviewing the GDM background assets. It is not active GDM configuration and does not change the login screen.

## No Boot Changes

This module does not modify:

- Plymouth
- GRUB
- Bootloader configuration

## Manual Review

Review these scripts before running:

- `gdm-module/scripts/backup-gdm.sh`
- `gdm-module/scripts/install-gdm.sh`
- `gdm-module/scripts/uninstall-gdm.sh`
- `gdm-module/scripts/validate-gdm.sh`
