# Future architecture contract

Neuroverse v5 is **static-first, backend-ready and provider-agnostic**.

## Separation of concerns
```
GitHub repository
  ├─ UI / templates
  ├─ local content fallback
  └─ current assets

Hosting provider
  ├─ GitHub Pages today, or
  └─ Netlify when desired

Content provider
  ├─ local JSON today
  └─ Supabase later

Authentication
  ├─ none today
  └─ Supabase Auth later

Media provider
  ├─ GitHub/local today
  ├─ Supabase Storage for editable support media
  └─ AWS/CloudFront for high-volume video if needed
```

The UI must not depend directly on one vendor. Provider-specific logic belongs under `/docs/src/services`.

## Stable identifiers
Content IDs are independent from filenames and storage paths. Examples:
- `neuronode-get-started`
- `faq-neuronode-why-won-t-my-neuronode-connect`
- `what-is-emg`

Do not reuse filenames as content IDs.

## Guide blocks
The `guides.content` JSONB column is reserved for the gradual move to a block-based authoring system. Suggested block types:
- heading
- paragraph
- steps
- image
- tip
- warning
- video
- resource-link
- related-content

The current specialised templates remain compatible while this migration happens incrementally.

## Admin permissions
Database roles already support `admin`, `editor`, `contributor`, `viewer`.
- admins/editors can publish
- contributors can create/update draft content
- viewers do not edit content

Role promotion is intentionally not exposed in browser code.
