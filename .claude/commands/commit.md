Stage and commit all current changes to the ShopNext repository.

First, show what has changed:
```bash
cd C:\Users\Sardar Umar\Desktop\company-test
git status
git diff --stat
```

Then stage everything and commit:
```bash
git add -A
git commit -m "$ARGUMENTS"
git push origin main
```

If $ARGUMENTS is empty, use a descriptive message based on what changed, e.g.:
- "add notifications system and improve checkout UI"
- "fix placeholder image 404 errors"
- "add docker-compose and dockerfiles"

Always verify git status is clean after committing.
