# MongoDB Auto-Seed Setup

This backend now checks MongoDB at startup. If fewer than 50 documents exist in the `chapters` collection, it automatically runs `seed.py` and populates chapters 1–50.

## Render environment variable

The behavior is controlled by:

```text
AUTO_SEED_DATABASE=true
```

If the variable is omitted, auto-seeding is enabled by default.

To disable it later, set:

```text
AUTO_SEED_DATABASE=false
```

The seed is idempotent and uses `replace_one(..., upsert=True)`, so it does not intentionally create duplicate chapter documents. Once 50 chapter documents exist, later Render restarts skip the seed.

## Important

`seed_strokes.py` is not run automatically. It is a separate, potentially heavier operation for Kanji stroke data.
