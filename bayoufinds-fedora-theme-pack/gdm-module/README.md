Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# BayouFinds Aqua Pro GDM Module

This module stages BayouFinds Aqua Pro GDM login background support.

## Safety

Do not run this module during normal user-level theme installation.

This module is manual-only and is intentionally separate from `scripts/install-aqua-pro-user.sh`.

The GDM module:

- Does not modify Plymouth.
- Does not modify GRUB.
- Detects Fedora 42 before install.
- Prints a warning before install.
- Creates a backup before changing GDM-related files.
- Prints a rollback command.

## Manual Install Command

Do not run yet:

```bash
./gdm-module/scripts/install-gdm.sh
```

## Manual Rollback Command

```bash
./gdm-module/scripts/uninstall-gdm.sh
```
