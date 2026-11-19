"""Tiny HTTP service for the backend: POST /classify {"text": "..."} -> {"category", "confidence"}.

Standard library only. The backend gives up after 3 s and falls back to manual selection (FR-AI-03).
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import joblib

MODEL = joblib.load(Path(__file__).parent / "model.joblib")
MIN_CONFIDENCE = 0.30  # below this, return no suggestion rather than a weak guess


def classify(text):
    if hasattr(MODEL, "predict_proba"):
        probs = MODEL.predict_proba([text])[0]
        i = probs.argmax()
        conf = float(probs[i])
        return {"category": MODEL.classes_[i] if conf >= MIN_CONFIDENCE else None, "confidence": round(conf, 3)}
    return {"category": MODEL.predict([text])[0], "confidence": None}


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/classify":
            return self._send(404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > 10_000:
                return self._send(413, {"error": "Too large"})
            text = str(json.loads(self.rfile.read(length) or b"{}").get("text", "")).strip()
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "Invalid JSON"})
        if not text:
            return self._send(400, {"error": "text is required"})
        self._send(200, classify(text))

    def _send(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Classifier on http://127.0.0.1:{port}/classify")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
