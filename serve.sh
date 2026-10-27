#!/usr/bin/env bash
# Local preview for the Setun Labs landing page.
cd "$(dirname "$0")"
exec python3 -m http.server 8000
