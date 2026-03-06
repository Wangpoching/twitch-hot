#!/bin/bash

RESPONSE=$(curl -s -X POST 'https://id.twitch.tv/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials')

TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

cat > /你的專案路徑/config.js << EOF
const CONFIG = {
  TWITCH_TOKEN: 'Bearer $TOKEN',
  TWITCH_CLIENT_ID: 'YOUR_CLIENT_ID'
}
EOF

echo "Token renewed at $(date)"
```
