import json
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

from flask import Flask, request

from config import SPIDER_METER_TOKEN, SPIDER_METER_URL

app = Flask(__name__)

REDACTED = "[redacted]"


def local_ip() -> str:
  try:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
      s.connect(("8.8.8.8", 80))
      return s.getsockname()[0]
  except OSError:
    return "127.0.0.1"


def port_is_free(port: int) -> bool:
  try:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
      s.bind(("0.0.0.0", port))
    return True
  except OSError:
    return False


def collect_params() -> dict[str, str]:
  """Parametres GET + corps POST (JSON ou form)."""
  params = {key: value for key, value in request.args.items()}

  if request.method == "POST":
    data = request.get_json(silent=True)
    if isinstance(data, dict):
      print("\n--- Corps JSON brut ---", flush=True)
      print(json.dumps(data, indent=2, ensure_ascii=False), flush=True)
      for key, value in data.items():
        if isinstance(value, dict) and "value" in value:
          params[key] = str(value["value"])
        else:
          params[key] = str(value)
    elif request.form:
      params.update({key: value for key, value in request.form.items()})
    elif request.data:
      print("\n--- Corps POST brut ---", flush=True)
      print(request.data.decode("utf-8", errors="replace"), flush=True)

  return params


def sanitize_params(params: dict[str, str]) -> dict[str, str]:
  return {
    key: REDACTED if key.lower() == "token" else value
    for key, value in params.items()
  }


def log_report(method: str, path: str, params: dict[str, str]) -> None:
  sep = "=" * 60
  headers = dict(request.headers)

  lines = [
    "",
    sep,
    f"[{datetime.now().isoformat(timespec='seconds')}] {method} {path}",
    sep,
    "",
    "--- Parametres ---",
  ]
  if params:
    lines.extend(f"  {key!r} = {params[key]!r}" for key in sorted(params, key=str.lower))
  else:
    lines.append("  (aucun)")

  lines.extend(["", "--- En-tetes HTTP ---"])
  lines.extend(f"  {key}: {headers[key]}" for key in sorted(headers))

  lines.extend([
    "",
    "--- JSON (copie pour tests) ---",
    json.dumps(params, indent=2, ensure_ascii=False),
    f"{sep}",
    "",
  ])
  print("\n".join(lines), flush=True)


def parse_float(value: str | None) -> float | None:
  if value is None or not str(value).strip():
    return None
  try:
    n = float(value)
  except ValueError:
    return None
  return n if n == n else None  # reject NaN


def extract_report_fields(params: dict[str, str]) -> tuple[float, float, str] | None:
  humidity = parse_float(params.get("hum"))
  temperature = parse_float(params.get("temp")) or parse_float(params.get("tmp"))
  if humidity is None or temperature is None:
    return None
  device_id = (params.get("id") or "unknown").strip() or "unknown"
  return humidity, temperature, device_id


def forward_report_to_spider_meter(
  humidity: float, temperature: float, device_id: str
) -> None:
  base = SPIDER_METER_URL.rstrip("/")
  query = urllib.parse.urlencode(
    {
      "hum": humidity,
      "temp": temperature,
      "id": device_id,
      "token": SPIDER_METER_TOKEN,
    }
  )
  url = f"{base}/report?{query}"
  try:
    with urllib.request.urlopen(url, timeout=10) as resp:
      body = resp.read(256).decode("utf-8", errors="replace").strip()
      print(
        f"[spider-meter] {resp.status} {url.split('token=', 1)[0]}token=[redacted]"
        + (f" → {body!r}" if body else ""),
        flush=True,
      )
  except urllib.error.HTTPError as exc:
    detail = exc.read(256).decode("utf-8", errors="replace").strip()
    print(
      f"[spider-meter] ERREUR HTTP {exc.code} pour /report"
      + (f" : {detail}" if detail else ""),
      flush=True,
    )
  except urllib.error.URLError as exc:
    print(f"[spider-meter] ERREUR reseau : {exc.reason}", flush=True)


@app.route("/", methods=["GET", "POST"])
@app.route("/<path:subpath>", methods=["GET", "POST"])
def shelly_report(subpath: str = "") -> tuple[str, int]:
  path = request.path
  params = collect_params()
  log_report(request.method, path, sanitize_params(params))

  if request.path.rstrip("/") == "/report":
    fields = extract_report_fields(params)
    if fields is None:
      print(
        "[spider-meter] Report ignore : hum et temp/tmp numeriques requis",
        flush=True,
      )
    else:
      forward_report_to_spider_meter(*fields)

  return "OK", 200


if __name__ == "__main__":
  if not SPIDER_METER_TOKEN:
    print(
      "ERREUR : SPIDER_METER_TOKEN manquant. "
      "Definissez-le dans config.local.py (voir config.example.py) ou en variable d'environnement.",
      flush=True,
    )
    raise SystemExit(1)

  port = 8080
  if not port_is_free(port):
    print(f"ERREUR : le port {port} est deja utilise.", flush=True)
    print("Arretez les anciens serveurs (Task Manager ou: netstat -ano | findstr :8080)", flush=True)
    raise SystemExit(1)

  ip = local_ip()
  print(f"Serveur Flask Shelly : http://{ip}:{port}/report", flush=True)
  print(f"Test local : http://127.0.0.1:{port}/report?tmp=22.5&hum=45", flush=True)
  print("Ctrl+C pour arreter\n", flush=True)
  app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
