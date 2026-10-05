from flask import Flask, render_template_string, redirect, url_for, send_file
import threading
import time
import json
import os
import csv
from datetime import datetime
from graph_client import GraphClient
from groq_client import GroqClient

app = Flask(__name__)

PRUEBA1_FILE = "output/classification_progress.json"
PRUEBA2_FILE = "output/extraction_progress.json"

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

def load_prueba1():
    if not os.path.exists(PRUEBA1_FILE):
        return []
    with open(PRUEBA1_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Filtrar solo solicitudes
    return [r for r in data.get("results", []) if r.get("classification") == "SOLICITUD"]

def load_prueba2():
    if os.path.exists(PRUEBA2_FILE):
        with open(PRUEBA2_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"results": [], "processed_subjects": []}

def save_prueba2():
    os.makedirs("output", exist_ok=True)
    data = {
        "results": state["results"],
        "processed_subjects": [r["subject"] for r in state["results"]],
        "user": state["user"],
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(PRUEBA2_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

AUTH_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 2 - Extracción de Información</title>
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
    <h1>Prueba 2 - Extracción de Información</h1>
    <div class="info">
        <strong>Objetivo:</strong> Extraer de los correos clasificados como SOLICITUD:<br>
        • Cliente (nombre)<br>
        • País<br>
        • Tipo de proceso<br>
        • Correo del cliente<br>
        <br>
        <strong>Correos a procesar:</strong> {{ email_count }} solicitudes detectadas en Prueba 1
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
    <title>Prueba 2 - Procesando...</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; }
        .progress-bar { background: #e0e0e0; height: 30px; border-radius: 4px; overflow: hidden; margin: 20px 0; }
        .progress-fill { background: #0078d4; height: 100%; transition: width 0.3s; }
        .status { font-size: 18px; color: #333; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Extrayendo información...</h1>
    <p class="status">Autenticado como: <strong>{{ user }}</strong></p>
    
    <div class="info">
        <strong>Progreso:</strong> {{ progress }} de {{ total }} solicitudes procesadas
        <div class="progress-bar">
            <div class="progress-fill" style="width: {{ (progress / total) * 100 if total > 0 else 0 }}%"></div>
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
    <title>Prueba 2 - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
        h1 { color: #0078d4; }
        .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .label { font-weight: bold; }
        .value { color: #0078d4; }
        .highlight { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .btn { background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #0078d4; color: white; }
        tr:hover { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Resultados - Extracción de Información</h1>
    <p>Autenticado como: <strong>{{ user }}</strong></p>
    
    <div class="section">
        <h3>Resumen</h3>
        <div class="metric">
            <span class="label">Total de solicitudes procesadas:</span>
            <span class="value">{{ metrics.total }}</span>
        </div>
        <div class="metric">
            <span class="label">Extracciones exitosas:</span>
            <span class="value">{{ metrics.successful }} ({{ "%.1f"|format((metrics.successful / metrics.total) * 100) if metrics.total > 0 else 0 }}%)</span>
        </div>
        <div class="metric">
            <span class="label">Extracciones fallidas:</span>
            <span class="value">{{ metrics.failed }}</span>
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
        <div class="metric">
            <span class="label">Costo total:</span>
            <span class="value">$0.00 (Groq Free Tier)</span>
        </div>
    </div>

    <div class="section">
        <h3>Resultados detallados</h3>
        <table>
            <thead>
                <tr>
                    <th>Asunto</th>
                    <th>Cliente</th>
                    <th>País</th>
                    <th>Tipo Proceso</th>
                    <th>Correo</th>
                </tr>
            </thead>
            <tbody>
                {% for r in results %}
                <tr>
                    <td>{{ r.subject[:50] }}{% if r.subject|length > 50 %}...{% endif %}</td>
                    <td>{{ r.cliente or '-' }}</td>
                    <td>{{ r.pais or '-' }}</td>
                    <td>{{ r.tipo_proceso or '-' }}</td>
                    <td>{{ r.correo or '-' }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
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

def extract_email_info(client, groq, subject, body, sender):
    prompt = f"""Extrae la siguiente información de este correo electrónico:

1. Cliente: Nombre completo del cliente o persona que realiza la solicitud
2. País: País mencionado o asociado al cliente
3. Tipo de proceso: Qué tipo de trámite, servicio o proceso se está solicitando
4. Correo: Dirección de correo electrónico del cliente (si está disponible)

Correo:
De: {sender}
Asunto: {subject}
Cuerpo: {body[:1500]}

Responde SOLO en formato JSON con estas claves exactas:
{{"cliente": "...", "pais": "...", "tipo_proceso": "...", "correo": "..."}}

Si no puedes extraer algún campo, usa null. No incluyas texto adicional, solo el JSON."""

    try:
        response = groq.client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200
        )
        
        content = response.choices[0].message.content.strip()
        
        # Intentar parsear JSON
        try:
            data = json.loads(content)
            return {
                "cliente": data.get("cliente"),
                "pais": data.get("pais"),
                "tipo_proceso": data.get("tipo_proceso"),
                "correo": data.get("correo"),
                "tokens_input": response.usage.prompt_tokens if response.usage else 0,
                "tokens_output": response.usage.completion_tokens if response.usage else 0,
                "success": True
            }
        except json.JSONDecodeError:
            # Si no es JSON válido, intentar extraer manualmente
            return {
                "cliente": None,
                "pais": None,
                "tipo_proceso": None,
                "correo": None,
                "tokens_input": response.usage.prompt_tokens if response.usage else 0,
                "tokens_output": response.usage.completion_tokens if response.usage else 0,
                "success": False,
                "raw_response": content
            }
    except Exception as e:
        return {
            "cliente": None,
            "pais": None,
            "tipo_proceso": None,
            "correo": None,
            "tokens_input": 0,
            "tokens_output": 0,
            "success": False,
            "error": str(e)
        }

def run_extraction():
    try:
        # Cargar resultados de Prueba 1
        solicitudes = load_prueba1()
        if not solicitudes:
            state["error"] = "No hay solicitudes de la Prueba 1. Ejecuta primero la Prueba 1."
            state["status"] = "error"
            return
        
        # Cargar progreso previo de Prueba 2
        prev_progress = load_prueba2()
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
        
        # Leer correos completos
        emails = client.get_emails(count=100)
        email_map = {e["subject"]: e for e in emails}
        
        # Filtrar solicitudes no procesadas
        pending = [s for s in solicitudes if s["subject"] not in processed_subjects]
        state["total"] = len(solicitudes)
        state["progress"] = len(state["results"])
        state["status"] = "processing"
        
        # Extraer información
        groq = GroqClient()
        total_input_tokens = 0
        total_output_tokens = 0
        
        for sol in pending:
            email = email_map.get(sol["subject"])
            if not email:
                continue
            
            extraction = extract_email_info(
                client, groq,
                email["subject"],
                email["body"],
                email["from"]
            )
            
            state["results"].append({
                "subject": email["subject"],
                "from": email["from"],
                "date": email["date"],
                "cliente": extraction.get("cliente"),
                "pais": extraction.get("pais"),
                "tipo_proceso": extraction.get("tipo_proceso"),
                "correo": extraction.get("correo"),
                "success": extraction.get("success", False)
            })
            
            total_input_tokens += extraction.get("tokens_input", 0)
            total_output_tokens += extraction.get("tokens_output", 0)
            
            state["progress"] = len(state["results"])
            save_prueba2()
            
            # Rate limiting
            time.sleep(10)
        
        # Calcular métricas
        successful = sum(1 for r in state["results"] if r.get("success"))
        failed = len(state["results"]) - successful
        
        state["metrics"] = {
            "total": len(state["results"]),
            "successful": successful,
            "failed": failed
        }
        
        state["cost"] = {
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
            "total_cost_usd": 0
        }
        
        state["status"] = "completed"
        
    except Exception as e:
        state["error"] = str(e)
        state["status"] = "error"

@app.route("/")
def index():
    if state["status"] == "waiting" or state["status"] == "authenticating":
        if state["user_code"]:
            solicitudes = load_prueba1()
            return render_template_string(AUTH_HTML, 
                user_code=state["user_code"],
                verification_uri=state["verification_uri"],
                email_count=len(solicitudes))
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
            cost=state["cost"],
            results=state["results"])
    
    elif state["status"] == "error":
        return render_template_string(ERROR_HTML, error=state["error"])

@app.route("/download")
def download():
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = f"output/extraccion_{timestamp}.csv"
    
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        if state["results"]:
            writer = csv.DictWriter(f, fieldnames=["subject", "from", "date", "cliente", "pais", "tipo_proceso", "correo", "success"])
            writer.writeheader()
            writer.writerows(state["results"])
    
    return send_file(csv_path, as_attachment=True)

@app.route("/reset")
def reset():
    if os.path.exists(PRUEBA2_FILE):
        os.remove(PRUEBA2_FILE)
    state["results"] = []
    state["status"] = "waiting"
    return redirect(url_for("index"))

if __name__ == "__main__":
    thread = threading.Thread(target=run_extraction, daemon=True)
    thread.start()
    app.run(host="0.0.0.0", port=5000, debug=False)
