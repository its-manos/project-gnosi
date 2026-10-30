# Completion history and future rankings

## Personal history

Each dated completion records a unique device/run event ID, lesson ID, device timestamp, whether the lesson was already completed on that device, correct-answer count, question count and a fingerprint of the quiz. No answer text or private account credentials are added to the event. A score is frozen at completion so later quiz edits do not rewrite past accuracy.

The completion flag, cleared attempt and event are committed in the same local document and sync revision. Events merge by immutable ID. Duplicate deliveries, repeated button taps and lost network acknowledgements do not create extra events. Replays keep separate event IDs while unique category coverage is based on completed lesson IDs.

If two devices independently record a first completion for the same lesson, chart classification chooses the earliest dated first-completion candidate, with event ID as tie-break. Other recorded completions of that lesson count as replays. This is based on recorded device state and clocks, not an assertion of independently verified historical order. Imports retain their original event identity and timestamps.

Day keys use Europe/Athens. Date arithmetic uses calendar days; weeks begin Monday and remain correct across daylight-saving changes and year boundaries. Accuracy covers completed, dated lesson attempts including replays; old undated attempts are excluded. Active days are the union of dated article completions and completed daily-quiz dates.

## Sync compatibility

The existing schema-version-1 learning document gains an optional activity map. Old documents load as an empty map; their completed IDs and bookmarks remain valid. New app versions preserve history through local saves and merge it on account sync.

Migration 005 preserves the server's existing activity map even when an older client submits a document without it. It validates event shape and rejects changes to an existing event ID. It keeps the existing account-bound RPC, optimistic revision checks and RLS. Upgrade all devices to see and create dated activity; older apps do not record new dated events.

History currently shares the existing 1 MiB sync-document limit. Events are not silently pruned. A dedicated activity table or pagination should precede a large public rollout of history and rankings.

## Leaderboard boundary

This update does not introduce a leaderboard or competitive points. Event timestamps and results are reported by the client. RPC shape validation and RLS protect account isolation and data consistency; they do not prove that a person answered legitimately or that their device clock is correct.

For a public leaderboard, add server-validated completion submissions tied to a published quiz version, server time, idempotent attempt IDs and a season. Decide eligibility and replay limits on the server. A weekly board should award each eligible lesson once, with replays counted as learning activity separately. Previously recorded personal-history events should not automatically become verified competitive scores.
