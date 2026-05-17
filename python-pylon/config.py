import os

SPIDER_METER_URL = os.environ.get("SPIDER_METER_URL", "").strip()
SPIDER_METER_TOKEN = os.environ.get("SPIDER_METER_TOKEN", "").strip()

try:
  import config_local  # type: ignore[import-not-found]

  if getattr(config_local, "SPIDER_METER_URL", ""):
    SPIDER_METER_URL = str(config_local.SPIDER_METER_URL).strip()
  if getattr(config_local, "SPIDER_METER_TOKEN", ""):
    SPIDER_METER_TOKEN = str(config_local.SPIDER_METER_TOKEN).strip()
except ImportError:
  pass

if not SPIDER_METER_URL:
  SPIDER_METER_URL = "http://localhost:5173"
