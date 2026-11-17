#!/bin/bash
# Push the current branch from a shared checkout, then move the local branch to what was pushed.
#
# usage: sync-push.sh [--no-push] [remote]
#
# --no-push only re-syncs: it moves the local branch onto the remote when every local commit
# is already there, refuses (exit 1) when that would need replaying commits the remote lacks,
# and leaves a branch that is only ahead untouched (exit 0, nothing pushed).
# A branch that is only ahead is pushed as-is, never rewritten.
#
# 1. Replays local commits the remote lacks onto the remote tip with merge-tree/commit-tree
#    (no file, index or branch touched), dropping any whose change the remote already holds.
# 2. Pushes that tip.
# 3. Moves the local branch to it, rewriting only the paths whose content changed, and only
#    where the working file and index entry still match the old or the new version. A path a
#    peer has edited differently stops step 3; the push stands and the branch stays put.
#
# Exit: 0 synced, 1 refused before anything changed (conflict, detached HEAD, no remote branch),
#       2 pushed but local branch not moved (peer edits on a changed path, listed on stderr).
set -euo pipefail
export GIT_LITERAL_PATHSPECS=1
cd "$(git rev-parse --show-toplevel)"

push=1
if [ "${1:-}" = "--no-push" ]; then push=0; shift; fi
remote="${1:-origin}"

branch=$(git symbolic-ref --short -q HEAD) || { echo "detached HEAD: check out a branch first" >&2; exit 1; }
gitdir=$(git rev-parse --git-dir)
for f in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
	[ -e "$gitdir/$f" ] && { echo "a merge, cherry-pick, revert or rebase is in progress here; finish it first" >&2; exit 1; }
done

private="refs/sync-push/$$"
trap 'git update-ref -d "$private" 2>/dev/null || true' EXIT
git fetch -q "$remote" "+refs/heads/$branch:$private" || { echo "no $remote/$branch to sync with" >&2; exit 1; }
upstream=$(git rev-parse "$private")
if git config "remote.$remote.url" >/dev/null; then git update-ref "refs/remotes/$remote/$branch" "$upstream"; fi
old=$(git rev-parse HEAD)

if git merge-base --is-ancestor "$upstream" "$old"; then
	if [ "$push" = 1 ] && [ "$old" != "$upstream" ]; then git push -q "$remote" "$old:refs/heads/$branch"; fi
	echo "local $branch is $(git rev-list --count "$upstream..$old") ahead of $remote; $([ "$push" = 1 ] && echo pushed || echo 'nothing pushed (--no-push)')"
	exit 0
fi

if [ -n "$(git rev-list --merges --right-only "$upstream...$old")" ]; then
	echo "local $branch holds merge commits $remote lacks; replaying would drop them. Integrate by hand; do not force-push" >&2
	exit 1
fi

new=$upstream
replayed=0
for c in $(git rev-list --reverse --topo-order --no-merges --right-only --cherry-pick "$upstream...$old"); do
	if ! tree=$(git merge-tree --write-tree --merge-base="$c^" "$new" "$c" 2>/dev/null); then
		echo "$(git log -1 --format='%h %s' "$c") conflicts with $remote/$branch; nothing was changed. Resolve it by hand against $remote/$branch; do not force-push" >&2
		exit 1
	fi
	tree=${tree%%$'\n'*}
	[ "$tree" = "$(git rev-parse "$new^{tree}")" ] && continue
	new=$(git log -1 --format=%B "$c" | \
		GIT_AUTHOR_NAME="$(git log -1 --format=%an "$c")" \
		GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae "$c")" \
		GIT_AUTHOR_DATE="$(git log -1 --format=%aI "$c")" \
		git commit-tree "$tree" -p "$new")
	replayed=$((replayed + 1))
done
dropped=$(( $(git rev-list --count --no-merges --right-only "$upstream...$old") - replayed ))

if [ "$push" = 0 ] && [ "$replayed" -gt 0 ]; then
	echo "local $branch holds $replayed commit(s) $remote lacks; run without --no-push to push them. Nothing was changed" >&2
	exit 1
fi
if [ "$push" = 1 ] && [ "$new" != "$upstream" ]; then
	git push -q "$remote" "$new:refs/heads/$branch"
fi
echo "replayed $replayed, already on $remote $dropped, tip $(git rev-parse --short "$new")"

[ "$new" = "$old" ] && { echo "local $branch already at tip"; exit 0; }

blob() { local e; e=$(git ls-tree "$1" -- "$2" | awk 'NR==1{print $1" "$3}'); echo "${e:-absent}"; }
filemode=$(git config --bool core.fileMode || echo true)
same() { if [ "$filemode" = true ]; then [ "$1" = "$2" ]; else [ "${1##* }" = "${2##* }" ]; fi; }
worktree() {
	if [ -L "$1" ]; then echo "120000 $(readlink -n -- "$1" | git hash-object --stdin)"
	elif [ -d "$1" ]; then echo directory
	elif [ -f "$1" ]; then
		local h; h=$(git hash-object -- "$1" 2>/dev/null) || { echo unreadable; return; }
		if [ -x "$1" ]; then echo "100755 $h"; else echo "100644 $h"; fi
	elif [ -e "$1" ]; then echo unreadable
	else echo absent; fi
}
write=()
remove=()
blocked=()
changed=()
while IFS= read -r -d '' p; do
	changed+=("$p")
	ob=$(blob "$old" "$p")
	nb=$(blob "$new" "$p")
	case "${ob%% *}/${nb%% *}" in 040000/*|*/040000|160000/*|*/160000) blocked+=("$p (folder or submodule change: integrate by hand)"); continue ;; esac
	if [ -n "$(git ls-files -u -- "$p")" ]; then blocked+=("$p (unmerged)"); continue; fi
	wt=$(worktree "$p")
	ix=$(git ls-files -s -- "$p" | awk -v p="$p" -F'\t' '$2==p{split($1,a," "); print a[1]" "a[2]; exit}')
	ix=${ix:-absent}
	if ! same "$ix" "$ob" && ! same "$ix" "$nb"; then blocked+=("$p (staged)"); continue; fi
	if same "$wt" "$nb"; then continue; fi
	if same "$wt" "$ob"; then
		if [ "$nb" = absent ]; then remove+=("$p"); else write+=("$p"); fi
		continue
	fi
	blocked+=("$p")
done < <(git diff -z --name-only --no-renames "$old" "$new")

if [ "${#blocked[@]}" -gt 0 ]; then
	echo "$remote/$branch is at $(git rev-parse --short "$new"), but local $branch stays at $(git rev-parse --short "$old"): these paths hold edits matching neither side:" >&2
	printf '  %s\n' "${blocked[@]}" >&2
	echo "Re-run with --no-push once those paths are committed or match a side; never reset or stash a peer's work to clear them" >&2
	exit 2
fi

git update-ref -m "sync-push: move to pushed tip" "refs/heads/$branch" "$new" "$old"
[ "${#write[@]}" -gt 0 ] && git checkout -q "$new" -- "${write[@]}"
[ "${#remove[@]}" -gt 0 ] && rm -f -- "${remove[@]}"
[ "${#changed[@]}" -gt 0 ] && git reset -q -- "${changed[@]}"
echo "local $branch moved $(git rev-parse --short "$old") -> $(git rev-parse --short "$new") (${#write[@]} files written, ${#remove[@]} removed)"
