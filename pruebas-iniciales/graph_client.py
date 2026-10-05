import msal
import requests
from config import CLIENT_ID, AUTHORITY, SCOPES

class GraphClient:
    def __init__(self):
        self.app = msal.PublicClientApplication(
            CLIENT_ID,
            authority=AUTHORITY
        )
        self.token = None
        self.user = None

    def _get_scopes(self):
        return SCOPES

    def authenticate(self):
        flow = self.app.initiate_device_flow(scopes=self._get_scopes())
        if "user_code" not in flow:
            raise Exception("Error al iniciar device code flow")

        print(f"\n{'='*60}")
        print(f"Abre: {flow['verification_uri']}")
        print(f"Código: {flow['user_code']}")
        print(f"{'='*60}\n")

        result = self.app.acquire_token_by_device_flow(flow)

        if "access_token" not in result:
            raise Exception(f"Error de autenticación: {result.get('error_description', 'Unknown error')}")

        self.token = result["access_token"]
        self.user = self._get_user_info()
        print(f"✓ Autenticado como: {self.user['displayName']} ({self.user['mail']})")
        return True

    def _get_user_info(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers)
        response.raise_for_status()
        return response.json()

    def get_emails(self, count=1000):
        headers = {"Authorization": f"Bearer {self.token}"}
        emails = []
        page_size = min(count, 100)
        url = f"https://graph.microsoft.com/v1.0/me/messages?$top={page_size}&$select=subject,body,from,receivedDateTime&$orderby=receivedDateTime desc"

        while url and len(emails) < count:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            for msg in data.get("value", []):
                emails.append({
                    "subject": msg.get("subject", ""),
                    "body": msg.get("body", {}).get("content", ""),
                    "body_type": msg.get("body", {}).get("contentType", ""),
                    "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                    "date": msg.get("receivedDateTime", "")
                })

            url = data.get("@odata.nextLink")

        return emails[:count]
