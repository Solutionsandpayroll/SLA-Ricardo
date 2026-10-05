from flask import Flask, render_template_string, redirect, url_for
import threading
import time
from graph_client import GraphClient
from analyzer import EmailAnalyzer
from config import EMAIL_COUNT

app = Flask(__name__)

state = {
    "status": "waiting",
    "user_code": None,
    "verification_uri": None,
    "user": None,
    "metrics": None,
    "error": None
}

AUTH_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 0 - Autenticación</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #0078d4; letter-spacing: 3px; }
        .btn { background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #005a9e; }
        .status { color: #666; }
    </style>
</head>
<body>
    <h1>Prueba 0 - Análisis de Volumen de Correos</h1>
    <div class="box">
        <h2>Paso 1: Autenticación</h2>
        <p>1. Abre este enlace en tu navegador:</p>
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

RESULTS_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Prueba 0 - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #0078d4; }
        .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .label { font-weight: bold; }
        .value { color: #0078d4; }
        .distribution { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .bar-container { background: #e0e0e0; height: 20px; border-radius: 4px; overflow: hidden; }
        .bar { background: #0078d4; height: 100%; }
    </style>
</head>
<body>
    <h1>Resultados - Análisis de Volumen</h1>
    <p>Autenticado como: <strong>{{ user }}</strong></p>
    
    <div class="section">
        <h3>General</h3>
        <div class="metric">
            <span class="label">Total de correos analizados:</span>
            <span class="value">{{ metrics.total_emails }}</span>
        </div>
    </div>

    <div class="section">
        <h3>Asunto</h3>
        <div class="metric">
            <span class="label">Promedio:</span>
            <span class="value">{{ metrics.subject.avg_length }} caracteres</span>
        </div>
        <div class="metric">
            <span class="label">Rango:</span>
            <span class="value">{{ metrics.subject.min_length }} - {{ metrics.subject.max_length }} caracteres</span>
        </div>
    </div>

    <div class="section">
        <h3>Cuerpo</h3>
        <div class="metric">
            <span class="label">Promedio:</span>
            <span class="value">{{ metrics.body.avg_length }} caracteres</span>
        </div>
        <div class="metric">
            <span class="label">Rango:</span>
            <span class="value">{{ metrics.body.min_length }} - {{ metrics.body.max_length }} caracteres</span>
        </div>
    </div>

    <div class="section">
        <h3>Total por correo</h3>
        <div class="metric">
            <span class="label">Promedio:</span>
            <span class="value">{{ metrics.total.avg_chars_per_email }} caracteres</span>
        </div>
        <div class="metric">
            <span class="label">Rango:</span>
            <span class="value">{{ metrics.total.min_chars }} - {{ metrics.total.max_chars }} caracteres</span>
        </div>
        <div class="metric">
            <span class="label">Total caracteres:</span>
            <span class="value">{{ "{:,}".format(metrics.total.total_chars) }}</span>
        </div>
        <div class="metric">
            <span class="label">Tokens estimados:</span>
            <span class="value">{{ "{:,.2f}".format(metrics.total.estimated_tokens) }}</span>
        </div>
    </div>

    <div class="section">
        <h3>Distribución de tamaños</h3>
        <div class="distribution">
            {% for bucket, count in metrics.distribution.items() %}
            <div>
                <div class="metric">
                    <span class="label">{{ bucket }}</span>
                    <span class="value">{{ count }} ({{ "%.1f"|format((count / metrics.total_emails) * 100) }}%)</span>
                </div>
                <div class="bar-container">
                    <div class="bar" style="width: {{ (count / metrics.total_emails) * 100 }}%"></div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>

    {% if 'error' not in metrics.daily_volume %}
    <div class="section">
        <h3>Volumen estimado</h3>
        <div class="metric">
            <span class="label">Rango de fechas:</span>
            <span class="value">{{ metrics.daily_volume.date_range.from[:10] }} a {{ metrics.daily_volume.date_range.to[:10] }}</span>
        </div>
        <div class="metric">
            <span class="label">Diario:</span>
            <span class="value">{{ metrics.daily_volume.estimated_daily_volume }} correos/día</span>
        </div>
        <div class="metric">
            <span class="label">Mensual:</span>
            <span class="value">{{ metrics.daily_volume.estimated_monthly_volume }} correos/mes</span>
        </div>
    </div>
    {% endif %}
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
    </style>
</head>
<body>
    <h1>Error</h1>
    <div class="error">{{ error }}</div>
</body>
</html>
"""

def run_analysis():
    try:
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
        
        emails = client.get_emails(count=EMAIL_COUNT)
        analyzer = EmailAnalyzer(emails)
        metrics = analyzer.analyze()
        analyzer.save_report(metrics)
        
        state["metrics"] = metrics
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
                verification_uri=state["verification_uri"])
        return "<h1>Iniciando...</h1><script>setTimeout(() => location.reload(), 1000);</script>"
    
    elif state["status"] == "completed":
        return render_template_string(RESULTS_HTML,
            user=state["user"],
            metrics=state["metrics"])
    
    elif state["status"] == "error":
        return render_template_string(ERROR_HTML, error=state["error"])

if __name__ == "__main__":
    thread = threading.Thread(target=run_analysis, daemon=True)
    thread.start()
    app.run(host="0.0.0.0", port=5000, debug=False)
