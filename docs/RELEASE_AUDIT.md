# BayouOps v1 Release Audit

## Packaging
- [ ] Clean folder structure
- [ ] No temp/debug files
- [ ] README finalized
- [ ] START_HERE finalized
- [ ] LICENSE included
- [ ] CHANGELOG included

## Install Flow
- [ ] ZIP extracts correctly
- [ ] Windows launch works
- [ ] SmartScreen instructions documented
- [ ] Operator can open docs and exports locally
- [ ] No install, service, scheduled task, or auto-start behavior added

## Demo Environment
- [ ] Healthy systems
- [ ] Warning systems
- [ ] Critical systems
- [ ] Reboot-required systems
- [ ] Stale systems
- [ ] Export-ready reports

## Runtime Behavior
- [ ] Startup is operator-triggered
- [ ] Export actions run on demand only
- [ ] Error messages are visible to the operator
- [ ] No telemetry, cloud sync, polling loop, watcher, or hidden background process

## Export Engine
- [ ] CSV export works
- [ ] HTML export works
- [ ] Executive demo pack export works
- [ ] Export folder auto-created
- [ ] Generated bundles are not committed unless intentionally approved

## Customer Configuration
- [ ] `config/lines-of-business.json` included when customer LOB names are needed
- [ ] Lines of Business can be renamed without code changes
- [ ] LOB aliases map older demo/imported names to current customer names
- [ ] Missing or malformed LOB config falls back safely

## Error Handling
- [ ] Empty CSV handled
- [ ] Invalid CSV handled
- [ ] Missing folders handled
- [ ] Offline mode handled
- [ ] Missing dashboard HTML explains the render command
- [ ] Missing demo dataset explains the generation command

## Windows Validation
- [ ] Windows 10 tested
- [ ] Windows 11 tested
- [ ] Fresh machine tested

## Linux Validation
- [ ] Fedora tested
- [ ] Export paths validated

## Documentation
- [ ] Quick start guide
- [ ] Screenshots updated
- [ ] Demo workflow documented
- [ ] Read-only statement added
- [ ] Customer delivery checklist included
- [ ] What BayouOps does and does not do is clear

## Scope Guardrails
- [ ] No database added
- [ ] No API or cloud service added
- [ ] No authentication system added
- [ ] No external dependency added without approval
