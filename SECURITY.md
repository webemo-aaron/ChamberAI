# Security Policy

## Supported Versions

The project currently supports the latest code on the `main` branch.
We recommend upgrading promptly when security fixes are released.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Report vulnerabilities to: security@chamberai.dev

Include as much of the following as possible:
- A description of the vulnerability and its impact
- Steps to reproduce
- A minimal proof of concept, if available
- Affected versions or commit hashes
- Any potential fixes or mitigations

We aim to acknowledge reports within 3 business days.

## Security Best Practices (Self-Hosting)

- Keep dependencies updated (`npm outdated`, `npm audit`).
- Run the API and worker behind a firewall or reverse proxy.
- Restrict emulator ports to trusted networks only.
- Store secrets in environment variables and restrict file permissions.
- Use TLS for all external traffic.

## Disclosure

We follow a coordinated disclosure process. Please allow us time to investigate
and ship a fix before public disclosure.
