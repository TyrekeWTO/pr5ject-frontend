# Standing Rules

1. **Never chain build and deploy commands.** Run `sam build`, `sam deploy`, and `vercel --prod` as separate steps. Report each result before continuing to the next.

2. **Always commit before deploying.** Before any `sam deploy` or `vercel --prod`, run `git add . && git commit` in whichever repo changed, so there is always a restore point.

3. **Hard stop on "stop" or "report back."** If a task says "stop" or "report back before deploying," do not proceed to deploy steps — even if the remaining work seems straightforward.
