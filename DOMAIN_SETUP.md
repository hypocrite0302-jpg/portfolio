# GitHub Pages Domain Setup for imayank.online

This repo is already prepared with:
- `CNAME` set to `imayank.online`
- Canonical URL metadata in `index.html`
- `robots.txt` and `sitemap.xml`

## 1) Configure GitHub Pages in your repository
1. Open your repository on GitHub.
2. Go to **Settings -> Pages**.
3. Under **Build and deployment**, choose your publishing source (branch or GitHub Actions).
4. In **Custom domain**, set `imayank.online` and save.
5. Enable **Enforce HTTPS** once GitHub makes it available.

## 2) Configure DNS records at your domain provider
For apex/root (`@`) on GitHub Pages, add all four `A` records:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Optional IPv6 (`AAAA`) records:
- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

For `www`, add one `CNAME`:
- Host/Name: `www`
- Value/Target: `<your-github-username>.github.io`

Important:
- Do not use wildcard DNS records like `*.imayank.online`.
- Remove conflicting default parked/forwarding records if your DNS provider added them.

## 3) Verify DNS from Windows PowerShell
Run:

```powershell
Resolve-DnsName imayank.online -Type A
Resolve-DnsName imayank.online -Type AAAA
Resolve-DnsName www.imayank.online -Type CNAME
```

DNS propagation can take up to 24 hours.

## 4) Optional domain verification for takeover protection
In GitHub account settings:
- **Settings -> Pages -> Add domain**
- Add and verify `imayank.online` (GitHub will ask you to add a TXT challenge record)

Keep that TXT record in DNS after verification.

## 5) Contact form backend (security-first)
Do not put Discord/Slack webhook URLs in frontend JavaScript.
Keep webhook secrets only in a backend or serverless proxy.

If you want live form delivery instead of email fallback, set a secure API endpoint:

```html
<script>
  window.PORTFOLIO_SIGNAL_ENDPOINT = "https://your-endpoint.example/api/signal";
</script>
```

Without this, the form opens an email draft to `mayank@imayank.online`.

The frontend now rejects known direct webhook endpoints (for example `discord.com/api/webhooks/...`) to reduce accidental secret exposure.
