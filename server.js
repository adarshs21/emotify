const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5500;

let accessToken = null;

async function getSpotifyToken() {
  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  accessToken = res.data.access_token;
}

app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    if (!accessToken) await getSpotifyToken();

    const result = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: q + " song",
        type: 'track',
        limit: 5
      }
    });

    const track = result.data.tracks.items[0];
    if (!track) return res.status(404).json({ error: 'No track found' });

    res.json(result.data.tracks.items.map(track => ({
      title: track.name + ' - ' + track.artists[0].name,
      id: track.id
    })));

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Spotify fetch failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.29.6:${PORT}`);
});
