import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Standard initialization without explicit service account (uses default credentials)
      admin.initializeApp();
      console.log("Firebase Admin initialized with default credentials.");
    }
  } catch (err) {
    console.error("Firebase Admin Init Error:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', domain: process.env.APP_URL });
  });
  
  // Razorpay Order Creation
  app.post('/api/payment/razorpay/order', async (req, res) => {
    const { streamerId, amount, currency } = req.body;
    
    if (!streamerId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // 1. Fetch Streamer Credentials
      const streamerDoc = await admin.firestore(process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID).collection('streamers').doc(streamerId).get();
      if (!streamerDoc.exists) return res.status(404).json({ error: 'Streamer not found' });
      
      const streamerData = streamerDoc.data();
      const razorpayGateway = streamerData?.gateways?.find((g: any) => g.type === 'razorpay');
      
      if (!razorpayGateway) return res.status(400).json({ error: 'Razorpay not configured by streamer' });
      
      const keyId = razorpayGateway.config.razorpayKeyId;
      const keySecret = streamerData?.secrets?.razorpayKeySecret;
      
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: 'Razorpay keys missing or incomplete' });
      }

      // 2. Initialize Razorpay with Streamer Keys
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });

      // 3. Create Order
      const options = {
        amount: Math.round(amount * 100), // to paisa
        currency: currency === '₹' ? 'INR' : (currency || 'INR'),
        receipt: `receipt_${Math.random().toString(36).substring(7)}`,
      };

      const order = await razorpay.orders.create(options);
      
      res.json({ 
        orderId: order.id, 
        keyId,
        amount: order.amount,
        currency: order.currency
      });

    } catch (err: any) {
      console.error('Razorpay Order Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Twitch Auth - Step 1: Get URL
  app.get('/api/auth/twitch/url', (req, res) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'Twitch Client ID not configured' });

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/twitch/callback`;
    const scope = 'user:read:email';
    const state = Math.random().toString(36).substring(7);

    const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    res.json({ url: twitchUrl });
  });

  // Twitch Auth - Step 2: Callback
  app.get('/api/auth/twitch/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
      // 1. Exchange code for token
      const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/twitch/callback`
        }
      });

      const { access_token } = tokenResponse.data;

      // 2. Get user info
      const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${access_token}`
        }
      });

      const twitchUser = userResponse.data.data[0];
      
      // 3. (Optional) Create Firebase Custom Token if admin is configured
      let customToken = null;
      if (admin.apps.length) {
        const uid = `twitch:${twitchUser.id}`;
        customToken = await admin.auth().createCustomToken(uid, {
          twitch_login: twitchUser.login,
          email: twitchUser.email
        });
      }

      // Send success script to parent window
      res.send(`
        <html>
          <body>
            <script>
              const authData = ${JSON.stringify({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                provider: 'twitch',
                user: {
                  id: twitchUser.id,
                  login: twitchUser.login,
                  display_name: twitchUser.display_name,
                  profile_image_url: twitchUser.profile_image_url,
                  email: twitchUser.email
                },
                token: customToken
              })};
              if (window.opener) {
                window.opener.postMessage(authData, '*');
                window.close();
              } else {
                window.location.href = '/?twitch_auth=success';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Twitch Auth Error:', err.response?.data || err.message);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
