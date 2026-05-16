import json
import socket
from datetime import datetime

from flask import Flask, request

app = Flask(__name__)


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
    lines.extend(f"  {key!r} = {params[key]!r}" for key in sorted(params))
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


@app.route("/", methods=["GET", "POST"])
@app.route("/<path:subpath>", methods=["GET", "POST"])
def shelly_report(subpath: str = "") -> tuple[str, int]:
  path = request.full_path if request.query_string else request.path
  params = collect_params()
  log_report(request.method, path, params)
  return "OK", 200


if __name__ == "__main__":
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
