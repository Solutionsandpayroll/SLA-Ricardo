from groq import Groq
import time
import re
import html
from config import GROQ_API_KEY

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.call_count = 0
        self.call_history = []
        self.last_call_time = 0
        self.min_interval = 10  # segundos entre llamadas

    def _clean_html(self, text):
        # Remover tags HTML
        clean = re.sub(r'<[^>]+>', ' ', text)
        # Decodificar entidades HTML
        clean = html.unescape(clean)
        # Remover espacios extra
        clean = re.sub(r'\s+', ' ', clean)
        return clean.strip()

    def classify_email(self, subject, body, sender):
        # Rate limiting: esperar si es necesario
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)

        # Limpiar HTML y truncar a 300 caracteres
        clean_body = self._clean_html(body)[:300]
        clean_subject = subject[:200]
        clean_sender = sender[:100]
        
        prompt = f"""Clasifica este correo como SOLICITUD o NO SOLICITUD.

SOLICITUD: El correo requiere una accion, respuesta o tramite especifico.
NO SOLICITUD: Spam, informativo, newsletter, notificacion automatica, saludo general.

Correo:
Remitente: {clean_sender}
Asunto: {clean_subject}
Cuerpo: {clean_body}

Responde SOLO con una palabra: SOLICITUD o NO SOLICITUD"""

        max_retries = 3
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                
                response = self.client.chat.completions.create(
                    model="groq/compound",
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=10
                )
                
                elapsed = time.time() - start_time
                self.call_count += 1
                self.last_call_time = time.time()
                
                # Contar tokens
                if response.usage:
                    self.total_input_tokens += response.usage.prompt_tokens
                    self.total_output_tokens += response.usage.completion_tokens
                
                result = response.choices[0].message.content.strip().upper()
                classification = "SOLICITUD" if "SOLICITUD" in result and "NO SOLICITUD" not in result else "NO SOLICITUD"
                
                latency_ms = round(elapsed * 1000, 2)
                self.call_history.append({"latency_ms": latency_ms})
                
                return {
                    "classification": classification,
                    "raw_response": response.choices[0].message.content,
                    "tokens_input": response.usage.prompt_tokens if response.usage else 0,
                    "tokens_output": response.usage.completion_tokens if response.usage else 0,
                    "latency_ms": latency_ms
                }
                
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg and "rate_limit" in error_msg.lower():
                    # Extraer tiempo de espera del error
                    match = re.search(r'try again in ([\d.]+)s', error_msg)
                    if match:
                        wait_time = float(match.group(1)) + 2
                        print(f"  [!] Rate limit alcanzado. Esperando {wait_time:.0f}s...")
                        time.sleep(wait_time)
                        continue
                elif "413" in error_msg:
                    print(f"  [!] Request too large, skipping email")
                    self.call_count += 1
                    self.last_call_time = time.time()
                    return {
                        "classification": "NO SOLICITUD",
                        "raw_response": "ERROR_413",
                        "tokens_input": 0,
                        "tokens_output": 0,
                        "latency_ms": 0
                    }
                raise

    def get_cost_estimate(self):
        # Groq free tier - costo $0
        return {
            "input_tokens": self.total_input_tokens,
            "output_tokens": self.total_output_tokens,
            "input_cost_usd": 0,
            "output_cost_usd": 0,
            "total_cost_usd": 0,
            "calls": self.call_count
        }
