#!/usr/bin/env bash
set -e

podman start krufts.cafe > /dev/null
trap 'echo "Stopping podman database..."; podman stop krufts.cafe > /dev/null' EXIT

until podman exec krufts.cafe pg_isready -q 2> /dev/null; do sleep 0.5; done

bun run dev:app
