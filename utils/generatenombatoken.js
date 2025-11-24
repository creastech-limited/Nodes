import axios from "axios";


export async function generateNombaToken() {
  const url = "https://api.nomba.com/v1/auth/token/issue";

  const payload = {
    grant_type: "client_credentials",
    client_id: process.env.TEST_NOMBA_CLIENT_ID,
    client_secret: process.env.TEST_NOMBA_SECRET_KEY,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: process.env.NOMBA_ACCOUNT_ID,
    },
    body: JSON.stringify(payload),
  };

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    console.log("TOKEN RESPONSE:", json);

    if (!json.data) {
      throw new Error("Token generation failed: " + JSON.stringify(json));
    }

    return json.data.access_token;

  } catch (err) {
    console.error("Nomba Token Error:", err.message);
    throw err;
  }
}
