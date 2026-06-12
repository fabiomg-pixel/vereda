# Vereda — colocar no celular (PWA via GitHub Pages)

Tempo estimado: ~5 minutos na primeira vez.

## O que você precisa
- Uma conta no GitHub (você já tem, do site do PlasmoVet).
- Git instalado no computador (ou usar a interface web do GitHub — ver "Caminho B").

---

## Caminho A — com o script (1 comando)

1. Crie um repositório **vazio** no GitHub chamado `vereda`
   (https://github.com/new — não marque "Add README").

2. No computador, dentro da pasta do app, rode:

   ```bash
   chmod +x deploy.sh
   ./deploy.sh SEU_USUARIO vereda
   ```

   Troque `SEU_USUARIO` pelo seu login do GitHub.

3. O script faz o push. Depois, **só uma vez**, ative o Pages:
   - Vá em `https://github.com/SEU_USUARIO/vereda/settings/pages`
   - Em **Source**: Branch = `main`, pasta = `/ (root)` → **Save**
   - Espere ~1 minuto.

4. Seu app estará em:
   ```
   https://SEU_USUARIO.github.io/vereda/
   ```

---

## Caminho B — sem terminal (arrastar arquivos)

1. Crie o repositório `vereda` em https://github.com/new
2. Clique em **uploading an existing file** e arraste estes 5 arquivos:
   `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`
3. **Commit changes**.
4. Ative o Pages igual ao passo 3 do Caminho A.

---

## Instalar no Android

1. Abra `https://SEU_USUARIO.github.io/vereda/` no **Chrome** do celular.
2. Menu **⋮** → **Adicionar à tela inicial** (ou aparece um banner "Instalar app").
3. Confirme. O ícone do Vereda aparece na tela inicial.
4. Abre em tela cheia, sem barra de navegador, e funciona **offline**.

> Os dados ficam salvos só no aparelho (não vão para a nuvem).

---

## Atualizar o app depois

Mudou algo no código? Suba de novo:

```bash
git add -A && git commit -m "ajuste" && git push
```

(ou arraste os arquivos de novo no Caminho B).
O app instalado puxa a versão nova sozinho ao reabrir — o `sw.js` cuida disso.
Se quiser forçar, suba o número da versão dentro do `sw.js` (`vereda-v2` → `vereda-v3`).
