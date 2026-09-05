# Public-content safety rules

This repository is being prepared for a website that may become publicly accessible. Treat every committed file as potentially public, even before hosting is configured.

## Never commit

- Passwords, tokens, API keys, cookies, or `.env` files
- Passport, identity-card, visa, insurance, or payment documents
- Booking confirmations, ticket QR codes, reservation numbers, or exact room details
- Private photo albums or full-resolution originals
- Files that reveal a live location when that creates a personal risk

## Before publishing a photograph

- Confirm that every identifiable person has agreed to publication.
- Remove EXIF metadata, especially GPS coordinates and device identifiers.
- Export a web-sized derivative rather than the original file.
- Check mirrors, windows, screens, tickets, signs, and badges for accidental disclosure.

## External private albums

- Prefer access restricted to named accounts.
- A permanent “anyone with the link” URL is not private.
- Never place a storage-provider secret or API key in browser code.
- Assume that a URL included in generated HTML can be discovered from page source.
