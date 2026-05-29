# Linux Operational Health Export

BayouOps Suite Pro includes a lightweight Bash collector for generating local Linux operational health reports for small IT teams and administrators.

## Output

The script writes:

```text
exports/linux-health-report.txt
exports/linux-health-summary.csv
```

The TXT report is operator-readable. The CSV summary is a one-row machine-readable export for spreadsheets or downstream checks.

## Collected Fields

- Hostname
- OS release
- Kernel version
- Uptime
- Disk usage summary
- Top disk usage directories
- Failed systemd services, when systemd is available
- Reboot required indicator, when detectable
- Current user
- Timestamp

## Usage

Run from the project root:

```bash
bash linux/Linux_Health_Check.sh
```

Or make it executable:

```bash
chmod +x linux/Linux_Health_Check.sh
./linux/Linux_Health_Check.sh
```

## Fedora Notes

The collector is designed to work on Fedora Linux 42 using standard local tools such as `hostname`, `uname`, `date`, `df`, `du`, and `systemctl`.

If `needs-restarting` is installed, the script uses it to detect whether a reboot is required. If that command is missing, the report records reboot status as unknown unless a reboot marker file is present.

## Safety Notes

- Local-only collection
- Read-only commands
- No service changes
- No package changes
- No reboot actions
- No file deletions
- No administrator-only destructive behavior

Some disk usage or service details may be permission-limited for unprivileged users. The script suppresses permission noise and continues generating the report.
