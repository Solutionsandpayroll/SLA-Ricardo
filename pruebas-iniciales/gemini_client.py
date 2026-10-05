import google.generativeai as genai
import time
from config import GEMINI_API_KEY

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-3.6-flash')
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.call_count = 0
        self.call_history = []
        self.last_call_time = 0
        self.min_interval = 10  # segundos entre llamadas (6 RPM = 1 cada 10s)

    def classify_email(self, subject, body, sender):
        # Rate limiting: esperar si es necesario
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)

        prompt = f"""Clasifica este correo como SOLICITUD o NO SOLICITUD.

SOLICITUD: El correo requiere una acción, respuesta o trámite específico.
NO SOLICITUD: Spam, informativo, newsletter, notificación automática, saludo general.

Correo:
Remitente: {sender}
Asunto: {subject}
Cuerpo: {body[:4000]}

Responde SOLO con una palabra: SOLICITUD o NO SOLICITUD"""

        max_retries = 3
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                response = self.model.generate_content(prompt)
                elapsed = time.time() - start_time

                self.call_count += 1
                self.last_call_time = time.time()
                
                # Contar tokens
                if hasattr(response, 'usage_metadata'):
                    self.total_input_tokens += response.usage_metadata.prompt_token_count
                    self.total_output_tokens += response.usage_metadata.candidates_token_count

                result = response.text.strip().upper()
                classification = "SOLICITUD" if "SOLICITUD" in result and "NO SOLICITUD" not in result else "NO SOLICITUD"

                latency_ms = round(elapsed * 1000, 2)
                self.call_history.append({"latency_ms": latency_ms})

                return {
                    "classification": classification,
                    "raw_response": response.text,
                    "tokens_input": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else 0,
                    "tokens_output": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else 0,
                    "latency_ms": latency_ms
                }
                
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg and "quota" in error_msg.lower():
                    # Extraer tiempo de espera del error
                    import re
                    match = re.search(r'retry in ([\d.]+)s', error_msg)
                    if match:
                        wait_time = float(match.group(1)) + 5  # agregar 5s de buffer
                        print(f"  ⚠ Rate limit alcanzado. Esperando {wait_time:.0f}s...")
                        time.sleep(wait_time)
                        continue
                raise

    def get_cost_estimate(self):
        # Precios Gemini 2.0 Flash
        input_cost = (self.total_input_tokens / 1_000_000) * 0.10
        output_cost = (self.total_output_tokens / 1_000_000) * 0.40
        return {
            "input_tokens": self.total_input_tokens,
            "output_tokens": self.total_output_tokens,
            "input_cost_usd": round(input_cost, 6),
            "output_cost_usd": round(output_cost, 6),
            "total_cost_usd": round(input_cost + output_cost, 6),
            "calls": self.call_count
        }
