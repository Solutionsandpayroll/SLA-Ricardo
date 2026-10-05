from flask import Flask, render_template_string, redirect, url_for, send_file
import threading
import time
import json
import os
import csv
from datetime import datetime
from graph_client import GraphClient
from groq_client import GroqClient
from config import EMAIL_COUNT

app = Flask(__name__)

PROGRESS_FILE = "output/classification_progress.json"

state = {
    "status": "waiting",
    "user_code": None,
    "verification_uri": None,
    "user": None,
    "progress": 0,
    "total": 0,
    "results": [],
    "metrics": None,
    "cost": None,
    "error": None
}

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"results": [], "processed_subjects": []}

def save_progress():
    os.makedirs("output", exist_ok=True)
    data = {
        "results": state["results"],
        "processed_subjects": [r["subject"] for r in state["results"]],
        "user": state["user"],
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

AUTH_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 1 - Clasificación Binaria</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #0078d4; letter-spacing: 3px; }
        .btn { background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #005a9e; }
        .status { color: #666; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0078d4; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Prueba 1 - Clasificación Binaria</h1>
    <div class="info">
        <strong>✓ Groq (gratuito):</strong> 30 requests/min, ~14,400/día.<br>
        Procesando {{ email_count }} correos.
    </div>
    <div class="box">
        <h2>Paso 1: Autenticación</h2>
        <p>1. Abre este enlace:</p>
        <p><a href="{{ verification_uri }}" target="_blank" class="btn">Abrir página de autenticación</a></p>
        <p>2. Ingresa este código:</p>
        <p class="code">{{ user_code }}</p>
    </div>
    <p class="status">Esperando autenticación...</p>
    <script>
        setTimeout(function() { location.reload(); }, 3000);
    </script>
</body>
</html>
"""

PROGRESS_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 1 - Procesando...</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; }
        .progress-bar { background: #e0e0e0; height: 30px; border-radius: 4px; overflow: hidden; margin: 20px 0; }
        .progress-fill { background: #0078d4; height: 100%; transition: width 0.3s; }
        .status { font-size: 18px; color: #333; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Clasificando correos con Groq...</h1>
    <p class="status">Autenticado como: <strong>{{ user }}</strong></p>
    
    <div class="info">
        <strong>Progreso:</strong> {{ progress }} de {{ total }} correos procesados
        <div class="progress-bar">
            <div class="progress-fill" style="width: {{ (progress / total) * 100 }}%"></div>
        </div>
    </div>

    <p>La página se actualizará automáticamente.</p>
    <script>
        setTimeout(function() { location.reload(); }, 2000);
    </script>
</body>
</html>
"""

RESULTS_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 1 - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #0078d4; }
        .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .label { font-weight: bold; }
        .value { color: #0078d4; }
        .highlight { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .btn { background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px 5px; }
    </style>
</head>
<body>
    <h1>Resultados - Clasificación Binaria</h1>
    <p>Autenticado como: <strong>{{ user }}</strong></p>
    
    <div class="section">
        <h3>Clasificación</h3>
        <div class="metric">
            <span class="label">Total correos procesados:</span>
            <span class="value">{{ metrics.total }}</span>
        </div>
        <div class="metric">
            <span class="label">Solicitudes:</span>
            <span class="value">{{ metrics.solicitudes }} ({{ "%.1f"|format((metrics.solicitudes / metrics.total) * 100) }}%)</span>
        </div>
        <div class="metric">
            <span class="label">No solicitudes:</span>
            <span class="value">{{ metrics.no_solicitudes }} ({{ "%.1f"|format((metrics.no_solicitudes / metrics.total) * 100) }}%)</span>
        </div>
    </div>

    <div class="section">
        <h3>Rendimiento</h3>
        <div class="metric">
            <span class="label">Latencia promedio:</span>
            <span class="value">{{ "%.2f"|format(metrics.avg_latency) }} ms</span>
        </div>
    </div>

    <div class="section">
        <h3>Uso de tokens</h3>
        <div class="metric">
            <span class="label">Tokens de entrada:</span>
            <span class="value">{{ "{:,}".format(cost.input_tokens) }}</span>
        </div>
        <div class="metric">
            <span class="label">Tokens de salida:</span>
            <span class="value">{{ "{:,}".format(cost.output_tokens) }}</span>
        </div>
    </div>

    <div class="section">
        <h3>Costo</h3>
        <div class="highlight">
            <p><strong>Groq Free Tier:</strong> $0.00</p>
            <div class="metric">
                <span class="label">Costo por correo:</span>
                <span class="value">$0.00</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>Proyección (si fuera pagado)</h3>
        <div class="highlight">
            <p>Basado en tokens usados por correo:</p>
            <div class="metric">
                <span class="label">Tokens promedio por correo:</span>
                <span class="value">{{ "%.0f"|format((cost.input_tokens + cost.output_tokens) / metrics.total) }}</span>
            </div>
            <div class="metric">
                <span class="label">Tokens mensuales estimados (226 correos):</span>
                <span class="value">{{ "{:,}".format(((cost.input_tokens + cost.output_tokens) / metrics.total * 226)|int) }}</span>
            </div>
        </div>
    </div>

    <a href="/download" class="btn">Descargar CSV</a>
    <a href="/reset" class="btn" style="background: #dc3545;">Reiniciar</a>
</body>
</html>
"""

ERROR_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { background: #fee; color: #c00; padding: 20px; border-radius: 8px; border: 1px solid #fcc; }
        .btn { background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Error</h1>
    <div class="error">{{ error }}</div>
    <a href="/" class="btn">Volver al inicio</a>
</body>
</html>
"""

def run_classification():
    try:
        # Cargar progreso previo
        prev_progress = load_progress()
        state["results"] = prev_progress.get("results", [])
        processed_subjects = set(prev_progress.get("processed_subjects", []))
        
        # Autenticación
        client = GraphClient()
        flow = client.app.initiate_device_flow(scopes=client._get_scopes())
        
        if "user_code" not in flow:
            state["error"] = "Error al iniciar device code flow"
            state["status"] = "error"
            return
        
        state["user_code"] = flow["user_code"]
        state["verification_uri"] = flow["verification_uri"]
        state["status"] = "authenticating"
        
        result = client.app.acquire_token_by_device_flow(flow)
        
        if "access_token" not in result:
            state["error"] = f"Error de autenticación: {result.get('error_description', 'Unknown')}"
            state["status"] = "error"
            return
        
        client.token = result["access_token"]
        client.user = client._get_user_info()
        state["user"] = f"{client.user['displayName']} ({client.user['mail']})"
        
        # Leer correos
        emails = client.get_emails(count=EMAIL_COUNT)
        state["total"] = len(emails)
        
        # Filtrar correos ya procesados
        pending_emails = [e for e in emails if e["subject"] not in processed_subjects]
        
        state["status"] = "processing"
        state["progress"] = len(state["results"])
        
        # Clasificar con Groq
        groq = GroqClient()
        
        for email in pending_emails:
            result = groq.classify_email(
                subject=email["subject"],
                body=email["body"],
                sender=email["from"]
            )
            
            state["results"].append({
                "subject": email["subject"],
                "from": email["from"],
                "date": email["date"],
                "classification": result["classification"]
            })
            
            state["progress"] = len(state["results"])
            save_progress()
        
        # Calcular métricas finales
        solicitudes = sum(1 for r in state["results"] if r["classification"] == "SOLICITUD")
        no_solicitudes = len(state["results"]) - solicitudes
        avg_latency = sum(r["latency_ms"] for r in groq.call_history) / len(groq.call_history) if groq.call_history else 0
        
        state["metrics"] = {
            "total": len(state["results"]),
            "solicitudes": solicitudes,
            "no_solicitudes": no_solicitudes,
            "avg_latency": avg_latency
        }
        
        state["cost"] = groq.get_cost_estimate()
        state["status"] = "completed"
        
    except Exception as e:
        state["error"] = str(e)
        state["status"] = "error"

@app.route("/")
def index():
    if state["status"] == "waiting" or state["status"] == "authenticating":
        if state["user_code"]:
            return render_template_string(AUTH_HTML, 
                user_code=state["user_code"],
                verification_uri=state["verification_uri"],
                email_count=EMAIL_COUNT)
        return "<h1>Iniciando...</h1><script>setTimeout(() => location.reload(), 1000);</script>"
    
    elif state["status"] == "processing":
        return render_template_string(PROGRESS_HTML,
            user=state["user"],
            progress=state["progress"],
            total=state["total"])
    
    elif state["status"] == "completed":
        return render_template_string(RESULTS_HTML,
            user=state["user"],
            metrics=state["metrics"],
            cost=state["cost"])
    
    elif state["status"] == "error":
        return render_template_string(ERROR_HTML, error=state["error"])

@app.route("/download")
def download():
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = f"output/clasificacion_{timestamp}.csv"
    
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        if state["results"]:
            writer = csv.DictWriter(f, fieldnames=state["results"][0].keys())
            writer.writeheader()
            writer.writerows(state["results"])
    
    return send_file(csv_path, as_attachment=True)

@app.route("/reset")
def reset():
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
    state["results"] = []
    state["status"] = "waiting"
    return redirect(url_for("index"))

if __name__ == "__main__":
    thread = threading.Thread(target=run_classification, daemon=True)
    thread.start()
    app.run(host="0.0.0.0", port=5000, debug=False)
