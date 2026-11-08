# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

Please email `opensource@itzyk.top` with:

- Affected version / commit
- Reproduction steps
- Impact assessment

Do **not** open a public Issue for undisclosed vulnerabilities or paste real API keys.

## Local Data

API keys are stored only on the user's machine under the OS config directory
(`zhishu-gemini-desktop/settings.json`, mode `0600`) and are never committed to git.
Use the in-app「清除」button or delete that file to wipe local credentials.
