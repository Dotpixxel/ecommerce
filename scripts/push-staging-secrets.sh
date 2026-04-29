#!/bin/bash

# Cloudflare Staging Secret Push Script (Robust Version)
# Corrects issues with special characters and quoting.
# Includes value logging for transparency.

ENV_FILE=".env.staging"
APP_DIR="apps/web"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Hata: $ENV_FILE dosyası bulunamadı!"
  exit 1
fi

echo "🚀 Cloudflare Staging (raunk-butik-staging) projesine secret'lar yükleniyor..."
echo "--------------------------------------------------------"

# .env.staging dosyasını satır satır oku
while IFS= read -r line || [ -n "$line" ]; do
  # Boş satırları veya yorum satırlarını ( # ile başlayan ) atla
  if [[ -z "$line" ]] || [[ "$line" == \#* ]]; then
    continue
  fi

  # Eşitliğin sol tarafını (KEY) ve sağ tarafını (VALUE) ayır
  # İlk '=' karakterinden böl
  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # VALUE etrafındaki tırnakların (çift veya tek) temizlenmesi
  # Bash substring 1:-1 hatasını önlemek için uzunluk kontrolü
  if [[ ${#VALUE} -ge 2 ]]; then
    if [[ ($VALUE == \"*\" ) || ($VALUE == \'*\' ) ]]; then
      VALUE="${VALUE:1:${#VALUE}-2}"
    fi
  fi

  # Boş değerli değişkenleri atla
  if [ -z "$VALUE" ]; then
    echo "⚠️ $KEY değer (value) boş, atlanıyor..."
    continue
  fi

  echo "🔑 Yükleniyor: $KEY"
  echo "   Değer: $VALUE"
  
  # printf kullanarak değerin olduğu gibi (mangled olmadan) gönderilmesini sağla
  printf "%s" "$VALUE" | /Users/alikar/dev/raunk-butik/apps/web/node_modules/.bin/wrangler versions secret put "$KEY" --env staging --cwd "$APP_DIR"
  
  if [ $? -ne 0 ]; then
    echo "❌ Hata: $KEY yüklenirken bir sorun oluştu."
  else
    echo "✅ Başarılı: $KEY"
  fi
  echo "--------------------------------------------------------"
done < "$ENV_FILE"

echo "✅ Tüm secret'lar işlemi tamamlandı!"
