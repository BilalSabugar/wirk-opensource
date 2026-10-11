# Security Policy

## Supported Versions

We actively provide security patches for the following versions of WIRK:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The security and privacy of our users are of paramount importance. If you discover a security vulnerability within WIRK, please follow these steps:

1. **Do not disclose the issue publicly** on GitHub issues, social media, or public forums.
2. Email your findings directly to **bilal.07.04.07@gmail.com** with the subject line:  
   `[SECURITY] Vulnerability Report: WIRK`.
3. Please include:
   - A detailed description of the vulnerability.
   - Exact steps or proof-of-concept to reproduce the behavior.
   - Any suggested mitigations or fixes.

## Disclosure Process & Response Time

- **Initial Acknowledgement**: Within 48 hours.
- **Triage & Assessment**: Within 5 business days.
- **Remediation & Patch**: A fix will be developed and released promptly, followed by public attribution in release notes (unless you prefer to remain anonymous).

## Encryption Architecture

WIRK utilizes **AES-GCM-256** client-side encryption via the W3C Web Crypto API. Encryption keys are generated client-side and never leave the user's browser in Local-First mode.

Thank you for helping keep WIRK safe!
