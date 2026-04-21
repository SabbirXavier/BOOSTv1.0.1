import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin for Token Verification
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error("Firebase Admin Init Error:", err);
  }
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || '';
mongoose.set('bufferCommands', false); // Disable buffering to prevent hanging on bad connections

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { 
    serverSelectionTimeoutMS: 5000 // Fast fail if DB unreachable
  })
    .then(() => console.log("Connected to MongoDB Core Engine"))
    .catch(err => console.error("MongoDB Connection Error:", err));
} else {
  console.warn("MONGODB_URI is not defined. Database operations will fail immediately (buffering disabled).");
}

// MongoDB Schemas
const streamerSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  displayName: String,
  role: { type: String, default: 'streamer' },
  bio: String,
  accentColor: { type: String, default: '#ea580c' },
  profileImage: String,
  coverImage: String,
  preferredCurrency: { type: String, default: 'INR' },
  subscriptionActive: { type: Boolean, default: true },
  planId: { type: String, default: 'standard' },
  isTrial: { type: Boolean, default: false },
  trialEndsAt: Date,
  obsToken: String,
  gateways: [{ type: Object }], // Public config
  secrets: { type: Object, default: {} }, // Sensitive keys
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const widgetSchema = new mongoose.Schema({
  streamerId: { type: String, required: true }, // firebaseUid
  type: String,
  config: Object,
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const donationSchema = new mongoose.Schema({
  streamerId: { type: String, required: true },
  donorName: String,
  amount: Number,
  currency: String,
  message: String,
  status: { type: String, default: 'pending' },
  orderId: String,
  paymentId: String,
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: Object
}, {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  currency: { type: String, default: '₹' },
  trialDays: Number,
  features: Object,
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const StreamerModel = mongoose.model('Streamer', streamerSchema);
const WidgetModel = mongoose.model('Widget', widgetSchema);
const DonationModel = mongoose.model('Donation', donationSchema);
const SettingsModel = mongoose.model('Settings', settingsSchema);
const PlanModel = mongoose.model('Plan', planSchema);

// Middleware: Verify Firebase Auth Token
const verifyAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Setting up common middleware...");
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      db: dbStatus,
      domain: process.env.APP_URL 
    });
  });

  // --- Streamer Routes ---
  app.get('/api/streamers/:username', async (req, res) => {
    try {
      const streamer = await StreamerModel.findOne({ username: req.params.username.toLowerCase() });
      if (!streamer) return res.status(404).json({ error: 'Streamer not found' });
      res.json(streamer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/me', verifyAuth, async (req: any, res) => {
    try {
      const streamer = await StreamerModel.findOne({ firebaseUid: req.user.uid });
      res.json(streamer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/me', verifyAuth, async (req: any, res) => {
    try {
      const existing = await StreamerModel.findOne({ firebaseUid: req.user.uid });
      if (existing) return res.status(400).json({ error: 'Account already setup' });

      // Check username uniqueness
      const usernameTaken = await StreamerModel.findOne({ username: req.body.username.toLowerCase() });
      if (usernameTaken) return res.status(400).json({ error: 'Username already taken' });

      const newStreamer = new StreamerModel({
        ...req.body,
        firebaseUid: req.user.uid,
        username: req.body.username.toLowerCase()
      });
      await newStreamer.save();
      res.status(201).json(newStreamer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/me', verifyAuth, async (req: any, res) => {
    try {
      const updated = await StreamerModel.findOneAndUpdate(
        { firebaseUid: req.user.uid },
        { $set: req.body },
        { new: true }
      );
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/me', verifyAuth, async (req: any, res) => {
    try {
      await StreamerModel.deleteOne({ firebaseUid: req.user.uid });
      await WidgetModel.deleteMany({ streamerId: req.user.uid });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Widget Routes ---
  app.get('/api/widgets', verifyAuth, async (req: any, res) => {
    const widgets = await WidgetModel.find({ streamerId: req.user.uid });
    res.json(widgets);
  });

  app.post('/api/widgets', verifyAuth, async (req: any, res) => {
    const widget = new WidgetModel({ ...req.body, streamerId: req.user.uid });
    await widget.save();
    res.json(widget);
  });

  app.patch('/api/widgets/:id', verifyAuth, async (req: any, res) => {
    const updated = await WidgetModel.findOneAndUpdate(
      { _id: req.params.id, streamerId: req.user.uid },
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  });

  // --- Donation Routes ---
  app.get('/api/donations', verifyAuth, async (req: any, res) => {
    const donations = await DonationModel.find({ streamerId: req.user.uid }).sort({ createdAt: -1 }).limit(50);
    res.json(donations);
  });

  // --- Payment Routes ---
  app.post('/api/payment/razorpay/order', async (req, res) => {
    const { streamerId, amount, currency } = req.body; // streamerId here is the firebaseUid or mongo _id? Let's use firebaseUid for consistency
    if (!streamerId || !amount) return res.status(400).json({ error: 'Missing fields' });

    try {
      const streamer = await StreamerModel.findOne({ firebaseUid: streamerId });
      if (!streamer) return res.status(404).json({ error: 'Streamer not found' });
      
      const razorpayGateway = streamer.gateways?.find((g: any) => g.type === 'razorpay');
      if (!razorpayGateway) return res.status(400).json({ error: 'Razorpay not configured' });
      
      const keyId = razorpayGateway.config.razorpayKeyId;
      const keySecret = streamer.secrets?.razorpayKeySecret;
      
      if (!keyId || !keySecret) return res.status(400).json({ error: 'Keys missing' });

      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: currency === '₹' ? 'INR' : (currency || 'INR'),
        receipt: `rcpt_${Date.now()}`
      });
      
      res.json({ orderId: order.id, keyId, amount: order.amount, currency: order.currency });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payment/success', async (req, res) => {
    // Record the donation in MongoDB
    try {
      const donation = new DonationModel(req.body);
      await donation.save();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tts', async (req, res) => {
    const { text, voiceName } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    try {
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Using a stable model for TTS if preview is flaky
        contents: [{ parts: [{ text: `Generate spoken audio for this message: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ audioData });
    } catch (err: any) {
      console.error("TTS Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Admin Routes ---
  app.get('/api/admin/streamers', verifyAuth, async (req: any, res) => {
    // Check if requester is admin
    const requester = await StreamerModel.findOne({ firebaseUid: req.user.uid });
    if (requester?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const all = await StreamerModel.find({});
    res.json(all);
  });

  app.get('/api/admin/settings', async (req, res) => {
    const settings = await SettingsModel.findOne({ key: 'platform' });
    res.json(settings?.value || {});
  });

  app.patch('/api/admin/settings', verifyAuth, async (req: any, res) => {
    const requester = await StreamerModel.findOne({ firebaseUid: req.user.uid });
    if (requester?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const updated = await SettingsModel.findOneAndUpdate(
      { key: 'platform' },
      { $set: { value: req.body.value } },
      { new: true, upsert: true }
    );
    res.json(updated.value);
  });

  app.get('/api/admin/plans', async (req, res) => {
    const plans = await PlanModel.find({});
    res.json(plans);
  });

  app.post('/api/admin/plans', verifyAuth, async (req: any, res) => {
    const requester = await StreamerModel.findOne({ firebaseUid: req.user.uid });
    if (requester?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const plan = new PlanModel(req.body);
    await plan.save();
    res.status(201).json(plan);
  });

  app.patch('/api/admin/plans/:id', verifyAuth, async (req: any, res) => {
    const requester = await StreamerModel.findOne({ firebaseUid: req.user.uid });
    if (requester?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const updated = await PlanModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  });

  app.delete('/api/admin/plans/:id', verifyAuth, async (req: any, res) => {
    const requester = await StreamerModel.findOne({ firebaseUid: req.user.uid });
    if (requester?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    await PlanModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // --- Twitch Auth ---
  console.log("Registering routes...");
  app.get('/api/auth/twitch/url', (req, res) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'Twitch Client ID not configured' });
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/twitch/callback`;
    const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read:email&state=${Math.random().toString(36).substring(7)}`;
    res.json({ url: twitchUrl });
  });

  app.get('/api/auth/twitch/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');
    try {
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
      const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${access_token}` }
      });
      const twitchUser = userResponse.data.data[0];
      let customToken = null;
      if (admin.apps.length) {
        customToken = await admin.auth().createCustomToken(`twitch:${twitchUser.id}`, { email: twitchUser.email });
      }
      res.send(`<html><body><script>
        window.opener.postMessage(${JSON.stringify({ type: 'OAUTH_AUTH_SUCCESS', provider: 'twitch', user: twitchUser, token: customToken })}, '*');
        window.close();
      </script></body></html>`);
    } catch (err: any) {
      res.status(500).send(`Auth failed: ${err.message}`);
    }
  });

  console.log("Configuring frontend serving...");
  if (process.env.NODE_ENV !== 'production') {
    console.log("Initializing Vite dev server...");
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: 'spa' 
    });
    app.use(vite.middlewares);
    console.log("Vite middleware ready.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server fully operational on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical Server Startup Error:", err);
  process.exit(1);
});
