const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Host': 'app.orderkuota.com',
  'User-Agent': 'okhttp/4.12.0',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip'
};

const response = (data, status = 200) => 
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const fetchApp = async (path, payload) => {
  const res = await fetch(`https://app.orderkuota.com/api/v2/qris/${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams(payload).toString()
  });
  return res.json();
};

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return response({ error: "Method Not Allowed" }, 405);

    try {
      const { username, apiKey } = await req.json();
      if (!username || !apiKey) return response({ success: false, error: "Missing parameters" }, 400);

      const id = apiKey.split(':')[0];
      const timestamp = Date.now().toString();
      const uuid = 'dCkcjSj0RSmAIGe8RAjTpO';
      const appRegId = `${uuid}:APA91bG0EMa_tJqp6eKj4gEPfLOOrAVADU3F6Oz4Mps51knjTFyEavU6Lp9qaZMaAs6UEov0HkYhYwq4wotqUi8ASww2MRLqS88Ebz-ypEF17A_JgK02q44`;

      await fetchApp(`menu/${id}`, {
        request_time: new Date().toISOString(),
        app_reg_id: appRegId,
        phone_android_version: '9',
        app_version_code: '250811',
        phone_uuid: id,
        auth_username: username,
        auth_token: apiKey,
        app_version_name: '25.08.11',
        ui_mode: 'light',
        'requests[0]': 'account',
        'requests[1]': 'qris_menu',
        phone_model: 'Nokia G10'
      });

      const mutasi = await fetchApp(`mutasi/${id}`, {
        app_reg_id: appRegId,
        phone_uuid: uuid,
        phone_model: 'KM6',
        request_time: timestamp,
        phone_android_version: '9',
        app_version_code: '250911',
        auth_username: username,
        auth_token: apiKey,
        app_version_name: '25.09.11',
        ui_mode: 'light',
        'requests[0]': 'account',
        'requests[qris_history][page]': '1',
        'requests[qris_history][keterangan]': '',
        'requests[qris_history][jumlah]': '',
        'requests[qris_history][dari_tanggal]': '',
        'requests[qris_history][ke_tanggal]': ''
      });

      const list = mutasi?.qris_history?.results || [];
      const data = list.slice(0, 5).map(tx => ({
        date: tx.tanggal,
        amount: parseInt((tx.kredit || '0').replace(/\./g, '')),
        brand: tx.brand?.name || 'QRIS',
        sender: tx.keterangan || '-',
        ref_id: String(tx.id),
        balance: tx.saldo_akhir
      }));

      return response({
        success: true,
        merchant: username,
        timestamp: new Date().toISOString(),
        data
      });

    } catch (e) {
      return response({ success: false, error: e.message }, 500);
    }
  }
};