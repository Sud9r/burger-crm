# Security Policy

## Supported scope

This repository is a frontend-only portfolio prototype. It does not include a production API, authentication, payment processing, or a database server.

## Reporting a vulnerability

Please do not publish credentials, private customer information, or exploit details in a public issue. Use GitHub's private vulnerability reporting feature when it is enabled for the repository. If private reporting is unavailable, contact the repository maintainer through the contact method listed on the GitHub profile.

## Data and secrets

- Demo names, phone numbers, email addresses, orders, and business metrics are fictional.
- Do not commit `.env` files, API keys, access tokens, passwords, database URLs, or real customer records.
- Keep local secrets out of screenshots, logs, issues, and pull requests.
- The current prototype stores edits in the current browser's `localStorage`; this is not secure storage and must not be used for sensitive or production customer data.
