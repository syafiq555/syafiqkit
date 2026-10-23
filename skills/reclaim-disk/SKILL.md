---
name: reclaim-disk
description: Free disk space on a developer's Mac: measure where the space went, show a plan of what rebuilds itself (package caches, build output, Docker build cache, simulator and IDE leftovers, app temp files) and clear it once confirmed, and ask item by item before anything personal. Use when the user says "check my laptop storage", "disk is full", "free up space", "low on storage", "what's eating my disk", "clean my mac", "System Data is huge", "Docker is taking too much space", or asks how developers clean their Mac. Not for shrinking a doc or code ("clean up this file" is condense-claude-md, condense-task-doc or code-simplifier), and not for a server's disk (that is a remote-ops task, not this Mac).
---

# Reclaim Disk

Free the most space for the least risk. Almost all of a developer's disk is things that rebuild themselves, so the job is telling those apart from the few things that don't. Nothing is deleted before the user has seen the plan: deletion here is permanent, not to Trash, so "regenerable" decides how an item is labelled, never whether to ask.

This is for macOS. On another OS, say so and stop. Skip silently any tool that isn't installed. At almost no free space, some cleanup commands fail for lack of room, so make emptying the Trash or deleting a downloaded installer the plan's first row and wait for a yes.

## 1. Measure before deleting

Start from the number the user feels: free space on the Data volume (`df -h /System/Volumes/Data` on macOS; `/` reports only the sealed system volume). Then size the top of the home folder, `~/Library` one level down, and every projects folder the user works in (ask or look for `~/Herd`, `~/code`, `~/Projects`, `~/dev`). Run `du` in a few broad batched calls, not one per folder, and sort by size; the answer is almost always five or six items.

`du` on a Docker VM disk (`Docker.raw`) reports blocks actually used, while `ls` shows the sparse maximum, so quote the `du` figure. Inside home and outside it should roughly add up to the volume's used figure; a large gap points at Time Machine local snapshots (`tmutil listlocalsnapshots /`) or simulator runtimes mounted under `/Library/Developer/CoreSimulator`.

Then present the plan as one table (item, size, class from step 2, what the user will notice afterwards) and get the user's pick of batches in one question before running anything that deletes: an `rm`, `clean` or `prune`, an app's cleanup job, a snapshot thin.

## 2. Three classes, three rules

**Regenerable: offer it in batches.** Package-manager caches, build output, IDE and simulator derived data, Docker build cache and unused images. The cost is a re-download or a slower next build. Check a repo's build folder is really gitignored output (`git check-ignore`) before deleting it, and list Docker images that would go: a private-registry image needs credentials to pull again. 📖 `references/ecosystems.md` has the command per tool and the trap each one carries.

**App-owned temp files: let the app delete them.** A web app's temp folder of generated PDFs or exports often already has a cleanup job that runs on a scheduler, and the scheduler never runs on a laptop, so the folder grows for months. Find the job (grep the scheduler for "temp" or "cleanup") and read it: confirm it deletes only from the local folder you measured, and that the app's environment doesn't point its storage disk or database at a shared or remote server. Then run it once (`php artisan tinker --execute='dispatch_sync(new App\Jobs\X)'`, or the framework's equivalent). That applies the app's own retention rule instead of inventing one, and leaves anything the app still considers live.

**Data: report, and ask item by item.** Docker volumes (local databases live there), an app's uploaded-files storage, iPhone backups (`~/Library/Application Support/MobileSync/Backup`), Photos, Mail and chat apps' media, the Trash, Claude Code's `~/.claude/projects` and `file-history` (conversation resume and rewind), a repo's uncommitted work, and anything personal in Downloads or Documents: DB dumps, archives, project zips. List these with size and date and let the user choose each one. A name that looks like a cache is not evidence: a folder under `storage/app` is usually customer uploads.

## 3. Doing it safely

Check what is running before clearing a tool's cache (a daemon, a build, an open simulator). `flutter clean` and `rm -rf node_modules` leave tracked files alone, so a repo's uncommitted edits survive them, but say the repo had some.

Docker needs its daemon: if it was off, start it, prune, then quit it again. Prune build cache and unused images only, never `--volumes`. Current Docker Desktop hands freed space back to macOS by itself, so re-measure `Docker.raw` with `du` after a short wait before reaching for older reclaim recipes.

Re-run the `df` from step 1 after each batch, so every report states free space before and after, in GB.

## 4. Stopping it coming back

Ask what made each large item grow: a temp folder whose cleanup needs a scheduler, a plugin or tool cache with no pruning, an AI tool's cache of old versions. Each is usually a one-line fix somewhere, worth more than the space, so name the fix and its owner rather than only deleting.

For a recurring sweep across many repos, Mole (`github.com/tw93/Mole`, `mo clean --dry-run`, then `mo purge` for `node_modules`, `build`, `.dart_tool` and the like) is the community's current tool of choice. It deletes permanently, not to Trash, and `clean` empties the Trash unless told otherwise, so run its dry run first.

## Report

Lead with free space before and after. Then one table: what was cleared (the path or command, so the user can tell later what went), size freed, what the user will notice (slower first build, a re-download, `npm install` before a repo runs). Then what was deliberately kept and why, and anything still waiting for the user's call.
