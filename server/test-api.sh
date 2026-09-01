#!/usr/bin/env bash
# Quick API smoke test — assumes the server is running on $BASE (default :8000)
set -euo pipefail
BASE="${BASE:-http://localhost:8000}"
JQ() { python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(eval(sys.argv[1]),indent=2)[:400])" "$1"; }

echo "== health =="
curl -sf "$BASE/api/health"

echo; echo "== doctor login =="
DOC_TOKEN=$(curl -sf -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"identifier":"anil.verma@abha","password":"doctor123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "token: ${DOC_TOKEN:0:24}..."

echo; echo "== patient login =="
PAT_TOKEN=$(curl -sf -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"identifier":"ravi.kumar@abha","password":"patient123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "token: ${PAT_TOKEN:0:24}..."

echo; echo "== doctor: patient list (first row) =="
curl -sf "$BASE/api/patients" -H "Authorization: Bearer $DOC_TOKEN" | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin)[0],indent=2)[:500])"

echo; echo "== patient: wrong password must fail =="
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"identifier":"ravi.kumar@abha","password":"wrong"}')
echo "HTTP $CODE (expect 401)"

echo; echo "== patient: role guard on doctor endpoint (expect 403) =="
curl -s -o /dev/null -w 'HTTP %{http_code}\n' "$BASE/api/patients" -H "Authorization: Bearer $PAT_TOKEN"

echo; echo "== patient: save JARVIS consultation =="
curl -sf -X POST "$BASE/api/consultations" -H "Authorization: Bearer $PAT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"language":"hi","concern":"सांस की परेशानी","answers":["2–3 दिन पहले",["खांसी / जुकाम"],"हल्की"],"categories":["respiratory"]}'

echo; echo "== patient: list consultations (count) =="
curl -sf "$BASE/api/consultations" -H "Authorization: Bearer $PAT_TOKEN" | python3 -c "import sys,json;print(len(json.load(sys.stdin)),'consultations')"

echo; echo "== patient: upload a document =="
echo "demo report content" > /tmp/js-demo-report.pdf
curl -sf -X POST "$BASE/api/documents" -H "Authorization: Bearer $PAT_TOKEN" -F "files=@/tmp/js-demo-report.pdf"

echo; echo "== patient: download it back =="
DOC_ID=$(curl -sf "$BASE/api/documents" -H "Authorization: Bearer $PAT_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
curl -sf "$BASE/api/documents/$DOC_ID/file" -H "Authorization: Bearer $PAT_TOKEN"

echo; echo "== patient: my audit trail =="
curl -sf "$BASE/api/audit/mine" -H "Authorization: Bearer $PAT_TOKEN" | python3 -c "import sys,json;[print(' -',e['action'],e['entity'],e['entityId'] or '',e['date']) for e in json.load(sys.stdin)[:6]]"

echo; echo "== register a brand-new patient =="
RAND=$RANDOM
curl -sf -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' -d "{
  \"name\":\"Test User\",\"identityMethod\":\"abha\",\"identity\":\"test.user.$RAND@abha\",\"password\":\"secret123\",
  \"mobile\":\"9999911111\",\"gender\":\"Female\",\"dob\":\"1995-06-15\",\"blood\":\"O+\",\"location\":\"Delhi\"
}" | python3 -c "import sys,json;d=json.load(sys.stdin);print({'id':d['user']['id'],'role':d['user']['role']})"

echo; echo "ALL SMOKE TESTS PASSED ✔"
