# Deploy checklist

1. `./build.sh`
2. hPanel → File Manager → `public_html` → upload `release/truelink-site.zip` → Extract (overwrite).
3. Visit https://truelinksolutions.com, submit both forms with your own email, and check they
   show up in https://truelinksolutions.com/hq.

Old files from the previous PHP version (`api/`, `vendor/`, `default.php`) can be deleted from
`public_html`. They are no longer used.
