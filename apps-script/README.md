# Eka & Koi's Baby Shower Invitation

Static single-page invitation site for GitHub Pages. It uses plain HTML, CSS, vanilla JavaScript, GSAP, ScrollTrigger, and a lazy-loaded Three.js balloon scene.

## Google Sheets RSVP Setup

1. Create a new Google Sheet.
2. Go to Extensions -> Apps Script -> paste `apps-script/Code.gs`.
3. Deploy -> New deployment -> Web app -> Execute as: Me -> Who has access: Anyone -> Copy URL.
4. Paste the URL into `const APPS_SCRIPT_URL` in `js/main.js`.

Sheet columns:

Timestamp | Reference | Name | Guests | Message | Response

Pre-populate each invited row with `Reference`, `Name`, `Guests`, and `waiting` or blank in `Response`. The site writes back `attending` or `declined` when the guest submits. Send links as:

```text
https://your-site.github.io/your-repo/invite/?ref=santos-family
```

The current RSVP endpoint is already set to:

```text
https://script.google.com/macros/s/AKfycbwnml7G6X4RbHeowVwhOFNQan1hW1GXOBsPEqnVpzuR7Duxn5wYoX5yILOIGqmLUBxA/exec
```
