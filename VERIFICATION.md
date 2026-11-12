# Acceptance and evidence

The shipped plan and ready issues were the agreement for step one. The revised `plan.md` records product's step-two decision: freeze the visible list, queue arrivals behind "N new", merge only on click, keep Ack on its row.

| Requirement | Check | Evidence |
| --- | --- | --- |
| Revised R1: list stays still until explicit merge | Assert queued count and unchanged first ID; click new-bar, assert new first ID | `tests/browser.mjs` |
| R2: Ack targets its row and marks only on success | Failure/retry; request ID and cursor; persisted mark across polling | `tests/browser.mjs` |
| R3: loader until initial response | Delayed initial response; error/recovery; empty state | `tests/browser.mjs` |
| R4: refresh every 2 seconds | Browser waits for next polls without reloading | `tests/browser.mjs`, real-board recording |
| R5: local times and full UTC datetime | Berlin/en-GB and Auckland/en-NZ, including date rollover | `tests/format.test.mjs`, `tests/browser.mjs` |
| R6: build SHA | Build script stamps source commit in meta and footer | `scripts/build.mjs`, deployed-board recording |
| Interaction safety | Aim at existing Ack, fetch arrival, click original screen coordinates, assert intended ID | `tests/pointer-race.mjs`, live new-build recording |

## Run

- `npm test` — dependency-free Node tests.
- `npm run serve` — uses Python already installed on the machine; no implicit npm install.
- `node tests/browser.mjs` — requires Playwright plus Chromium already installed. Set `PLAYWRIGHT_PACKAGE` to the absolute path to an existing package.json providing Playwright if it is not installed in this repository. Set `PLAYWRIGHT_BROWSERS_PATH` to its existing browser cache when necessary.
- `node tests/pointer-race.mjs` — regression check using fixed pointer coordinates, not a locator that follows moved rows. This failed on step one's build (got INC-arriving instead of INC-intended); it must pass on the new build.
- `npm run build -- /path/to/output` — requires a committed Git tree; stamps its HEAD SHA. Run only on a clean source tree for publication.

Mocked API checks isolate UI behavior. They do not prove the live service works. The published-board recording and sealed course receipt supply that separate evidence. Raw session and receipt logs stay outside this source repository.

## Release gate

Do not describe the Challenge as solved until the course accepts step two. Keep source SHA, recording URL, precise timestamp, and the receipt from the recorded Ack together. Preserve the original course workflow unchanged. Review product's response before changing the agreement. Previous source commits and the publication branch provide rollback points; rolling back a page does not undo acknowledgements already sent to the course API.
