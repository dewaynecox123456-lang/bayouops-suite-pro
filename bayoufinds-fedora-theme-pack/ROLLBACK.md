Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# User-Level Rollback

BayouFinds Aqua Pro v1.1 creates a user settings backup before applying current-account changes.

## Rollback Command

Run:

```bash
./scripts/uninstall-aqua-pro-user.sh
```

Or pass a specific backup:

```bash
./scripts/uninstall-aqua-pro-user.sh backups/user-aqua-pro-YYYYMMDD-HHMMSS
```

The rollback script restores previous GNOME settings when backup values are available.

## GDM And Plymouth

This v1.1 package stages GDM and Plymouth assets only. If those assets are later applied by a separate approved process, rollback must follow that process and its backup record.

## Package Files

The rollback script removes only:

```bash
~/.local/share/icons/BayouFinds-Aqua-Pro
~/.local/share/backgrounds/bayoufinds
```
