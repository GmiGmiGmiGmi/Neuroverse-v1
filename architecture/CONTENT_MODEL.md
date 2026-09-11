# Content model

## Products
Stable product landing metadata.

## Guides
Stable route/title/product metadata plus a future `content` block array. Existing specialised guide pages can be migrated one at a time.

## FAQs
Question/answer records with product, category and related route.

## Resources
Manuals, training, clinical resources, software and external links.

## Academy lessons
Metadata is separated from the video binary. `video_provider` can be `none`, `supabase`, `aws`, `youtube`, `vimeo` or `external` without changing the lesson URL.

## Content relations
A generic relation table supports future links such as:
- FAQ → related guide
- Academy lesson → NeuroStrip guide
- Guide → manual/resource
- FAQ → FAQ
