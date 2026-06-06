Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

# Rollback Planning

BayouFinds Aqua Pro v1.0 package creation does not modify system state, so no rollback is required after unpacking, previewing, or validating the package.

## If A User-Local Icon Theme Was Applied Later

If an operator later applies the icon theme manually, rollback is:

```bash
gsettings reset org.gnome.desktop.interface icon-theme
rm -rf ~/.local/share/icons/BayouFinds-Aqua-Pro
```

Run those commands only after confirming they match the local workstation change record.

## If Wallpaper Or Lock Screen Was Applied Later

Use GNOME Settings to restore the previous wallpaper and lock screen image.

## GDM And Plymouth

This v1.0 package stages GDM and Plymouth assets only. If those assets are later applied by a separate approved process, rollback must follow that process and its backup record.

## Package Files

Removing the unpacked package directory is enough to remove staged package files:

```bash
rm -rf bayoufinds-fedora-theme-pack
```

Only remove local package files when they are no longer needed.
