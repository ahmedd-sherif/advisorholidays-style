# advisorholidays-style

Brand stylesheet for https://advisorholidays.sa (The Advisor / ذا أدفايزر).

The site loads `advisor-brand.css` from jsDelivr through one `<link>` in the CMS custom head:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahmedd-sherif/advisorholidays-style@vX.Y.Z/advisor-brand.css">
```

To change the design: edit `advisor-brand.css`, commit, create a new tag (v1.0.1, v1.0.2, ...), push the tag, then update the tag in the CMS custom head link. jsDelivr caches tagged files permanently, so always release a new tag.
