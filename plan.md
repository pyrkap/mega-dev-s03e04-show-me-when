# sched-prod incident board — plan

The on-call board for sched-prod. One page, one list: tonight's incidents, newest first, so on-call sees
what just broke and takes it.

## Flows

| flow | who | what happens |
|------|-----|--------------|
| `open-board` | on-call | opens the board; sees tonight's incidents |
| `ack-incident` | on-call | picks an incident on the board and acks it — "I've got this one" |
| `watch-board` | on-call | keeps the board open; polling discovers arrivals; clicks "N new" to merge them without reloading |

## Requirements

- **R1 — revised by product after step-one recording at 00:12.** The visible list stays still. New incidents are queued behind an "N new" bar; only clicking that bar merges them at the top, newest first. Merely showing the bar must not shift existing rows.
- **R2** Each incident row has an **Ack** button. Ack sends the ack (`api.ack(id)`) and marks the row acked.
- **R3** Show a loader until incidents load.
- **R4** The board fetches every 2 seconds while open, including while arrivals are queued. Fetching updates the pending count, not the visible list's order. Ack remains attached to its incident row.
- **R5** Times show in the viewer's local time; day before month for EU locales (dd/mm).
- **R6** The page names its build: `<meta name="build" content="<git sha>">` in the head and the same sha in the footer.

## Hooks (pinned — tests and the replay rely on them)

| `data-testid` | element |
|---------------|---------|
| `board` | the board's main area |
| `loader` | the loader (gone once incidents load) |
| `empty` | what shows when there are no incidents |
| `incident-list` | the list |
| `incident-row` | one incident row, with `data-id="<incident id>"` |
| `ack` | the Ack button in a row |
| `acked` | the acked mark in a row |
| `build-sha` | the sha in the footer |
| `new-bar` | button showing "N new"; merges queued arrivals only on click |

## Product decision

"Read it. Watched it at 00:12. The list holds still while it is on screen; a \"N new\" bar brings new incidents in on click. Ack stays on the row. Change the plan, rebuild, and send a proof of the new build. — product"

The recorded pointer targeted INC-9543, but immediate top insertion moved INC-9141 under it and that incident received the Ack. The approved change replaces automatic insertion with an explicit merge. It does not stop polling or change the incident API, receipts, stored UTC values, or Ack ID binding. Queue and Ack marks are page-local, as before; a reload starts a fresh view.

## Done

Every issue in `issues/` delivered, deployed to a public https address, and shown working.
