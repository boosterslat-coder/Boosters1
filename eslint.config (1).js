export default async function handler(req, res) {
  let baseUrl = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !key) {
    return res.status(500).json({
      success: false,
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
    });
  }

  baseUrl = baseUrl.replace(/\/$/, '');

  if (!baseUrl.includes('/rest/v1')) {
    baseUrl = `${baseUrl}/rest/v1`;
  }

  const cleanUrl = `${baseUrl}/boosters_users?select=id&limit=1`;

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        status: response.status,
        url: cleanUrl,
        error: text,
      });
    }

    return res.status(200).json({
      success: true,
      status: response.status,
      url: cleanUrl,
      response: text,
      message: 'boosters_users table poked successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
