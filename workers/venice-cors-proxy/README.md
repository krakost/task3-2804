# Venice CORS proxy (Cloudflare Worker)

Ответы содержат **`Access-Control-Allow-Origin: *`**, чтобы фронт с любого домена мог вызывать разбор задачи через этот Worker.

Команды (из этой папки):

```bash
npx wrangler deploy
```

После деплоя укажите URL вида **`https://<ваш-субдомен>.workers.dev`** в переменной фронта **`VITE_VENICE_BREAKDOWN_URL`** (полный путь к Worker, если маршрут в корне — просто базовый URL + путь который вы повесите в Dash).

Этот шаблон проксирует **POST** целиком на `VENICE_UPSTREAM_URL` из `wrangler.toml` (можно переопределить в Dashboard → Settings → Variables).

Полный контекст (фронт, Vite proxy, env): **[docs/VENICE-BREAKDOWN.md](../docs/VENICE-BREAKDOWN.md)** · индекс документации: **[docs/README.md](../docs/README.md)**.
