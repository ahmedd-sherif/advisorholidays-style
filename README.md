# advisorholidays-style

Brand stylesheet for https://advisorholidays.sa (The Advisor / ذا أدفايزر).

The site loads `advisor-brand.css` from jsDelivr through one `<link>` in the CMS custom head:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahmedd-sherif/advisorholidays-style@vX.Y.Z/advisor-brand.css">
```

To change the design: edit `advisor-brand.css`, commit, create a new tag (v1.0.1, v1.0.2, ...), push the tag, then update the tag in the CMS custom head link. jsDelivr caches tagged files permanently, so always release a new tag.

## B2B portal

https://b2b.advisorholidays.sa loads `advisor-b2b.css` the same way (first released in v1.1.0):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahmedd-sherif/advisorholidays-style@v1.1.0/advisor-b2b.css">
```

`advisor-b2b.css` is `advisor-brand.css` (v1.0.1) unchanged, followed by a marked "B2B additions" section for the B2B agency theme. When you change `advisor-brand.css`, copy the same change into the top part of `advisor-b2b.css` if the B2B portal should get it too. Each site has its own tag in its own custom head, so releasing a new tag for one site does not change the other.
