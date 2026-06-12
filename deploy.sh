#!/usr/bin/env bash
# ============================================================
#  Vereda — deploy para GitHub Pages
#  Uso:  ./deploy.sh <seu-usuario-github> [nome-do-repo]
#  Ex.:  ./deploy.sh fabiomgomes vereda
# ============================================================
set -e

USER="$1"
REPO="${2:-vereda}"

if [ -z "$USER" ]; then
  echo "Uso: ./deploy.sh <seu-usuario-github> [nome-do-repo]"
  echo "Ex.: ./deploy.sh fabiomgomes vereda"
  exit 1
fi

# checagens
command -v git >/dev/null 2>&1 || { echo "Git não encontrado. Instale o git primeiro."; exit 1; }

echo "==> Inicializando repositório local..."
git init -q
git add index.html manifest.json sw.js icon-192.png icon-512.png
git commit -q -m "Vereda: app de hábitos (PWA)" || echo "   (nada novo para commitar)"
git branch -M main

REMOTE="https://github.com/$USER/$REPO.git"
echo "==> Apontando para $REMOTE"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

echo "==> Enviando para o GitHub..."
git push -u origin main

echo ""
echo "============================================================"
echo " Push concluído."
echo ""
echo " AGORA, no navegador (uma vez só):"
echo "   1. Abra  https://github.com/$USER/$REPO/settings/pages"
echo "   2. Em 'Source', selecione: Branch = main / (root)"
echo "   3. Salve. Aguarde ~1 minuto."
echo ""
echo " Seu app ficará em:"
echo "   https://$USER.github.io/$REPO/"
echo ""
echo " No Chrome do Android, abra essa URL → menu (⋮) →"
echo " 'Adicionar à tela inicial' / 'Instalar app'."
echo "============================================================"
