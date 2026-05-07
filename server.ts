import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { Resend } from "resend";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import Stripe from "stripe";
import { MercadoPagoConfig, Preference, Payment, PreApproval, PreApprovalPlan } from 'mercadopago';
import { google } from 'googleapis';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase Admin
let firebaseAdminApp: admin.app.App;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

const initializeFirebaseAdmin = () => {
  // Use existing app if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (serviceAccountKey && serviceAccountKey.startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      console.log(`Firebase Admin: Initializing with Service Account for project [${serviceAccount.project_id}]`);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  // Use ADC with the specific project ID from our config.
  // This is crucial in AI Studio because the auto-detected project (Cloud Run environment)
  // might differ from the Firebase project created for the app.
  try {
    console.log(`Firebase Admin: Initializing with explicit projectId [${firebaseConfig.projectId}]...`);
    return admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  } catch (e) {
    console.warn(`Initialization with explicit projectId failed, trying pure zero-config ADC...`);
    try {
      return admin.initializeApp();
    } catch (e2) {
      console.error("All Firebase Admin initialization methods failed.");
      throw e2;
    }
  }
};

firebaseAdminApp = initializeFirebaseAdmin();

// Ensure subsequent admin helper calls use our app
const authAdmin = admin.auth(firebaseAdminApp);
const firestoreAdminSnapshot = admin.firestore; // we use the separate getFirestore(firebaseAdminApp) below anyway

// Ensure we use the correct database ID. 
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

// Diagnostics
const currentProject = firebaseAdminApp.options.projectId || "auto-detected";
console.log(`Firestore target: Project [${currentProject}] Database [${databaseId || '(default)'}]`);

// We use let for db to allow global fallback if named database is broken
let db = getFirestore(firebaseAdminApp, databaseId);

// --- Health Check System ---
const systemStatus = {
  firebase: { status: 'initializing', message: 'Iniciando conexão...' },
  resend: { enabled: false, message: 'Não configurado' },
  stripe: { enabled: false, message: 'Não configurado' },
  mercadopago: { enabled: false, message: 'Não configurado' },
  googleOAuth: { enabled: false, message: 'Não configurado' }
};

// Global flag for DB health
let isFirestoreHealthy = false;

// Initial connection test with automatic permanent switch to default database if broken
async function testFirestoreConnection() {
  const targetDbName = databaseId || "(default)";
  try {
    // Identity Debug
    console.log(`[Firebase Diagnostics]`);
    console.log(`- Project ID (Config): ${firebaseConfig.projectId}`);
    console.log(`- Project ID (App): ${firebaseAdminApp.options.projectId || 'auto-detected'}`);
    console.log(`- Database target: ${targetDbName}`);
    console.log(`- Authentication: ${serviceAccountKey ? "Service Account Key detected" : "Using environment Default Credentials (ADC)"}`);
    console.log(`- GOOGLE_CLOUD_PROJECT env: ${process.env.GOOGLE_CLOUD_PROJECT || 'not set'}`);
    
    // Quick Auth sanity check
    try {
      await admin.auth(firebaseAdminApp).listUsers(1);
      console.log(`- Auth Service: Reachable`);
    } catch (e: any) {
      console.warn(`- Auth Service: Check failed (${e.message})`);
    }

    const snapshot = await db.collection("users").limit(1).get();
    console.log(`Firestore connection success: Found ${snapshot.size} users.`);
    isFirestoreHealthy = true;
    systemStatus.firebase = { status: 'ok', message: `Conectado ao projeto ${firebaseAdminApp.options.projectId}, banco ${targetDbName}` };
  } catch (error: any) {
    const isPermissionError = error.code === 7 || error.message?.includes('PERMISSION_DENIED');
    const isNotFoundError = error.code === 5 || error.message?.includes('NOT_FOUND');

    systemStatus.firebase = { 
      status: 'error', 
      message: `Erro ${error.code}: ${error.message}` 
    };

    if (isPermissionError) {
      console.error(`[CRITICAL] PERMISSION_DENIED on project ${firebaseAdminApp.options.projectId}, database ${targetDbName}.`);
      console.error("  -> Possible Cause: Identity mismatch. The server's identity does not have 'Cloud Datastore User' permissions on this project.");
    }

    if (databaseId && (isPermissionError || isNotFoundError)) {
      console.warn(`Attempting EMERGENCY FALLBACK to (default) database...`);
      try {
        const fallbackDb = getFirestore(firebaseAdminApp);
        await fallbackDb.collection("users").limit(1).get();
        db = fallbackDb; // PERMANENTLY switch the global db reference
        isFirestoreHealthy = true;
        console.log(`Fallback SUCCESS: Using (default) database for the rest of the session.`);
        systemStatus.firebase = { status: 'warning', message: 'Usando banco de dados (default) por falha no banco nomeado' };
      } catch (fallbackError: any) {
        console.error(`TOTAL FAILURE: Access to (default) also denied.`);
        isFirestoreHealthy = false;
      }
    } else {
      isFirestoreHealthy = false;
    }
  }
}
testFirestoreConnection();

function validateIntegrations() {
  console.log(`[Integration Health Check]`);
  
  if (process.env.RESEND_API_KEY) {
    systemStatus.resend = { enabled: true, message: 'Configurado e pronto' };
    console.log('✅ Resend: Configurado');
  } else {
    console.warn('⚠️ Resend: RESEND_API_KEY faltando. Notificações por e-mail desativadas.');
  }

  if (process.env.STRIPE_SECRET_KEY) {
    systemStatus.stripe = { enabled: true, message: 'Configurado e pronto' };
    console.log('✅ Stripe: Configurado');
  } else {
    console.warn('⚠️ Stripe: STRIPE_SECRET_KEY faltando. Pagamentos Stripe desativados.');
  }

  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    systemStatus.mercadopago = { enabled: true, message: 'Configurado e pronto' };
    console.log('✅ Mercado Pago: Configurado');
  } else {
    console.warn('⚠️ Mercado Pago: MERCADOPAGO_ACCESS_TOKEN faltando. Pagamentos Mercado Pago desativados.');
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    systemStatus.googleOAuth = { enabled: true, message: 'Configurado e pronto' };
    console.log('✅ Google OAuth: Configurado');
  } else {
    console.warn('⚠️ Google OAuth: GOOGLE_CLIENT_ID/SECRET faltando. Login Google (OAuth) desativado.');
  }
}
validateIntegrations();

// Safe wrapper for cron operations to provide better context
const runSafeCron = async (taskName: string, operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error: any) {
    const isPermissionError = error.code === 7 || error.message?.includes('PERMISSION_DENIED');
    const isNotFoundError = error.code === 5 || error.message?.includes('NOT_FOUND');
    
    if (isPermissionError) {
      console.warn(`[Cron: ${taskName}] Access Denied. The server's identity (ADC) lacks permissions on project ${firebaseAdminApp.options.projectId}.`);
      console.warn(` -> Background tasks like email notifications require a Service Account Key (FIREBASE_SERVICE_ACCOUNT_KEY).`);
    } else if (isNotFoundError) {
      console.warn(`[Cron: ${taskName}] Resource not found (DB ID: ${databaseId || '(default)'}).`);
    } else {
      console.error(`[Cron: ${taskName}] Unexpected Error:`, error.message || error);
    }
  }
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Mercado Pago Config
const mpClient = process.env.MERCADOPAGO_ACCESS_TOKEN 
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN }) 
  : null;

/**
 * Syncs Firestore plans with Mercado Pago PreApproval Plans
 */
async function syncMercadoPagoPlans() {
  if (!mpClient) return;

  const runSync = async () => {
    console.log('[Mercado Pago] Syncing plans...');
    const plansSnapshot = await db.collection("planos").where("active", "==", true).get();
    
    for (const doc of plansSnapshot.docs) {
      const planData = doc.data();
      const planId = doc.id;

      // Only sync if it's a paid plan that doesn't have an MP ID yet
      if (planData.price > 0 && !planData.mp_plan_id) {
        try {
          const mpPlan = new PreApprovalPlan(mpClient);
          const result = await mpPlan.create({
            body: {
              reason: `Assinatura PowerLife - ${planData.name}`,
              auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: Number(planData.price),
                currency_id: 'BRL'
              },
              back_url: `${process.env.APP_URL || 'http://localhost:3000'}/Dashboard`
            }
          });

          await db.collection("planos").doc(planId).update({
            mp_plan_id: result.id
          });
          console.log(`Plan synced: ${planData.name} -> MP ID: ${result.id}`);
        } catch (error: any) {
          console.error(`Error syncing plan ${planData.name}:`, error.message);
        }
      }
    }
  };

  await runSafeCron('Sync Mercado Pago Plans', runSync);
}
syncMercadoPagoPlans();

// Google OAuth Config
const googleOAuth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/google/callback`
);

/**
 * Ensures valid Google tokens are available, refreshing if necessary.
 */
async function getValidGoogleTokens(userId: string) {
  const tokenDoc = await db.collection("users").doc(userId).collection("tokens").doc("google").get();
  
  if (!tokenDoc.exists) {
    throw new Error("Google Calendar not connected");
  }

  const tokens = tokenDoc.data();
  const oauth2Client = googleOAuth2Client();
  oauth2Client.setCredentials(tokens as any);

  // Check if token is expired or expires in the next 5 minutes
  const expiryDate = tokens?.expiry_date || 0;
  const isExpired = expiryDate <= (Date.now() + 300000);

  if (isExpired && tokens?.refresh_token) {
    console.log(`Refreshing Google access token for user ${userId}...`);
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      const updatedTokens = {
        access_token: credentials.access_token,
        scope: credentials.scope || tokens?.scope,
        token_type: credentials.token_type || tokens?.token_type,
        expiry_date: credentials.expiry_date,
        updated_at: new Date().toISOString()
      };

      // Only update if we got a new access_token
      if (credentials.access_token) {
        await db.collection("users").doc(userId).collection("tokens").doc("google").set(updatedTokens, { merge: true });
        oauth2Client.setCredentials(credentials);
        console.log(`Token refreshed successfully for user ${userId}.`);
      }
      
      return oauth2Client;
    } catch (error: any) {
      console.error(`Error refreshing Google token for ${userId}:`, error.message);
      
      // If refresh token is invalid (revoked), we should probably clear the tokens
      if (error.message?.includes('invalid_grant')) {
        console.warn(`Refresh token invalid for user ${userId}. Disconnecting calendar.`);
        await db.collection("users").doc(userId).collection("tokens").doc("google").delete();
        throw new Error("Disconnected: Google access revoked");
      }
      throw error;
    }
  }

  return oauth2Client;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Middleware to enforce Admin role and log actions
  const requireAdmin = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn(`Unauthorized access attempt to ${req.path} from IP ${req.ip}`);
      return res.status(401).json({ error: "Acesso total negado: Token não fornecido." });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
      console.log(`[Auth Check] Verifying token for path: ${req.path}`);
      const decodedToken = await admin.auth(firebaseAdminApp).verifyIdToken(idToken);
      
      // Check for master admin early to avoid unnecessary DB hits
      const isMasterAdminEmail = decodedToken.email === 'sys.powerlife@gmail.com';
      
      // Consultar Firestore para confirmar papel de admin se necessário
      let userData: any = null;
      let isAdminInCollection = false;
      let dbErrorOccurred = false;
      
      // Only hit the DB if we are not the master admin or if DB is healthy
      if (!isMasterAdminEmail && isFirestoreHealthy) {
        try {
          const userDoc = await db.collection("users").doc(decodedToken.uid).get();
          userData = userDoc.data();
          
          // Também checar coleção dedicada de admins
          const adminDoc = await db.collection("admins").doc(decodedToken.uid).get();
          isAdminInCollection = adminDoc.exists;
        } catch (dbError: any) {
          dbErrorOccurred = true;
          console.warn(`[Auth Check] Firestore access failed for UID ${decodedToken.uid} (falling back to roles/email):`, dbError.message || dbError);
        }
      } else if (isMasterAdminEmail && isFirestoreHealthy) {
        // Even for master admin, we might want their user data for logs, but we can skip if it's failing
        try {
          const userDoc = await db.collection("users").doc(decodedToken.uid).get();
          userData = userDoc.data();
        } catch (e) {
          // Ignore error for master admin
        }
      }
      
      const isAdminRole = isMasterAdminEmail || (userData?.role === 'admin') || isAdminInCollection;

      if (isAdminRole) {
        req.user = decodedToken;
        
        // Push to audit logs on success (if DB is definitely working)
        res.on('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 400 && isFirestoreHealthy && !dbErrorOccurred) {
            try {
              const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
              await db.collection("admin_audit_logs").add({
                uid: decodedToken.uid,
                action: `${req.method} ${req.path}`,
                ip: Array.isArray(ip) ? ip[0] : ip,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                  email: decodedToken.email,
                  statusCode: res.statusCode
                }
              });
            } catch (auditError: any) {
              // Silent failure for audit logs if it's just a permission thing we can't fix now
              if (auditError.code !== 7) {
                console.error("Failed to write admin audit log:", auditError.message || auditError);
              }
            }
          }
        });

        return next();
      } else {
        console.warn(`Forbidden access attempt to ${req.path} by UID ${decodedToken.uid}`);
        return res.status(403).json({ error: "Acesso negado: Somente administradores podem realizar esta ação." });
      }
    } catch (error) {
      console.error("Error verifying admin token:", error);
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
  };

  // Apply admin protection to all admin routes
  app.use("/api/admin", requireAdmin);

  // Helper function to handle subscription interruptions
  async function handleSubscriptionInterruption(userId: string, reason: string) {
    if (!userId) return;
    try {
      console.log(`Handling subscription interruption for user ${userId}. Reason: ${reason}`);
      const updateData = {
        plan: 'free',
        subscriptionStatus: 'inactive',
        updated_at: new Date().toISOString()
      };

      await db.collection("users").doc(userId).update(updateData);

      // Update subscription subcollection
      await db.collection("users").doc(userId).collection("subscription").doc("current").set({
        ...updateData,
        last_interruption_reason: reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await db.collection("notifications").add({
        userId,
        title: "Assinatura Interrompida",
        message: `Sua assinatura foi alterada para o plano Gratuito (${reason}).`,
        type: "warning",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        link: "/Dashboard"
      });
      
      // Notify via email too if configured
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      if (userData?.email && resend) {
        await resend.emails.send({
          from: "PowerLife <billing@powerlife.app>",
          to: [userData.email],
          subject: "Atualização de Assinatura - PowerLife",
          html: `
            <h1>Olá, ${userData.name}!</h1>
            <p>Informamos que sua assinatura no PowerLife foi alterada devido a: <strong>${reason}</strong>.</p>
            <p>Sua conta agora está no plano <strong>Gratuito</strong>.</p>
            <p>Para recuperar o acesso às funcionalidades Pro/Master, por favor revise suas configurações de cobrança.</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/Dashboard">Acesse seu painel aqui.</a></p>
          `
        });
      }
    } catch (error) {
      console.error(`Error handling subscription interruption for ${userId}:`, error);
    }
  }

  // Stripe Webhook
  app.post("/api/webhook", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      let event;

      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn("Stripe or Webhook Secret not configured. Skipping signature verification.");
        event = req.body;
      } else {
        try {
          event = stripe.webhooks.constructEvent(
            (req as any).rawBody || JSON.stringify(req.body),
            sig as string,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err: any) {
          console.error(`Webhook Signature Error: ${err.message}`);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.client_reference_id;
          const plan = session.metadata.plan;

          if (userId && plan) {
            console.log(`Payment success for user ${userId}. Upgrading to ${plan}.`);
            await db.collection("users").doc(userId).update({
              plan: plan,
              stripeCustomerId: session.customer,
              subscriptionStatus: "active",
              updated_at: new Date().toISOString()
            });

            // Notify user
            await db.collection("notifications").add({
              userId: userId,
              title: "Assinatura Ativada!",
              message: `Parabéns! Seu plano ${plan.toUpperCase()} foi ativado com sucesso.`,
              type: "success",
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              link: "/Dashboard"
            });

            // Log Revenue
            const amount = plan === 'pro' ? 97.00 : (plan === 'master' ? 197.00 : 0);
            if (amount > 0) {
              await db.collection("revenue_history").add({
                userId,
                plan,
                amount,
                currency: 'BRL',
                gateway: 'stripe',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          const userSnapshot = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnapshot.empty) {
            await handleSubscriptionInterruption(userSnapshot.docs[0].id, "Assinatura cancelada no Stripe");
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          
          const userSnapshot = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnapshot.empty) {
            const userId = userSnapshot.docs[0].id;
            await db.collection("notifications").add({
              userId,
              title: "Falha na Cobrança",
              message: "Houve uma falha ao processar o pagamento da sua assinatura. Verifique seu cartão ou faturas pendentes.",
              type: "error",
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              link: "/Dashboard"
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe Webhook Error:", error);
      res.status(500).json({ error: "Internal Webhook Error" });
    }
  });

  // AI Insights Endpoint
  app.post("/api/ai/insights", async (req, res) => {
    const { context } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY Missing. AI Insights disabled.");
      return res.status(503).json({ error: "Serviço de IA não configurado (GEMINI_API_KEY faltando)." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Aja como um mentor de alta performance experiente e empático. 
        Analise o seguinte contexto de um cliente de mentoria e forneça 3 insights práticos, estratégicos e motivadores.
        
        Contexto do Cliente:
        ${JSON.stringify(context)}

        IMPORTANT: Forneça a resposta APENAS em JSON, sem markdown, no seguinte formato:
        {
          "insights": [
            { "title": "Título Curto", "description": "Explicação detalhada da ação", "category": "Mindset|Estratégia|Execução" },
            { "title": "...", "description": "...", "category": "..." },
            { "title": "...", "description": "...", "category": "..." }
          ],
          "summary": "Um breve resumo encorajador de 2 frases."
        }
        
        Idioma da resposta: Português (Brasil).
      `;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });
      let text = result.text || "";
      
      // Clean potential markdown code blocks if the model ignores the instruction
      text = text.replace(/```json|```/g, "").trim();
      
      try {
        const parsed = JSON.parse(text);
        res.json(parsed);
      } catch (parseError) {
        console.error("Error parsing AI JSON response:", text);
        res.status(500).json({ error: "Erro ao processar resposta da IA." });
      }
    } catch (error: any) {
      console.error("AI Insights Error:", error);
      res.status(500).json({ error: "Falha ao gerar insights de IA." });
    }
  });

  // Mercado Pago: Create Preference
  app.post("/api/payments/create-preference", async (req, res) => {
    const { plan, userId, email, name, paymentMethod } = req.body;

    if (!mpClient) {
      return res.status(500).json({ error: "Mercado Pago not configured" });
    }

    const preference = new Preference(mpClient);
    
    // Fetch plan details from Firestore to ensure price integrity
    let amount = 0;
    let planTitle = `Plano PowerLife ${plan.toUpperCase()}`;
    
    try {
      const planDoc = await db.collection("planos").doc(plan).get();
      if (planDoc.exists) {
        const planData = planDoc.data();
        amount = Number(planData?.price) || 0;
        planTitle = `Plano PowerLife ${planData?.name || plan.toUpperCase()}`;
      } else {
        // Fallback for known legacy IDs if not found in collection
        amount = plan === 'pro' ? 97.00 : (plan === 'master' ? 197.00 : 0);
      }
    } catch (err) {
      console.error("Error fetching plan from Firestore:", err);
      amount = plan === 'pro' ? 97.00 : (plan === 'master' ? 197.00 : 0);
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid plan or price" });
    }

    // Filter payment methods if specified
    const paymentMethods: any = {};
    if (paymentMethod === 'card') {
      paymentMethods.excluded_payment_types = [{ id: 'ticket' }, { id: 'bank_transfer' }];
    } else if (paymentMethod === 'pix') {
      paymentMethods.excluded_payment_types = [{ id: 'credit_card' }, { id: 'debit_card' }];
    }

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: plan,
              title: planTitle,
              quantity: 1,
              unit_price: amount,
              currency_id: 'BRL'
            }
          ],
          payer: {
            email: email,
            name: name
          },
          payment_methods: paymentMethods,
          back_urls: {
            success: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard?payment=success`,
            failure: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard?payment=failure`,
            pending: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard?payment=pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.APP_URL}/api/payments/webhook`,
          external_reference: userId,
          metadata: {
            userId: userId,
            plan: plan
          }
        }
      });

      res.json({ id: result.id, init_point: result.init_point });
    } catch (error) {
      console.error("Error creating MP preference:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Mercado Pago: Create Subscription
  app.post("/api/payments/create-subscription", async (req, res) => {
    const { planId, userId, email, cardToken } = req.body;

    if (!mpClient) {
      return res.status(500).json({ error: "Mercado Pago not configured" });
    }

    try {
      // 1. Get plan details
      const planDoc = await db.collection("planos").doc(planId).get();
      if (!planDoc.exists) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }
      const planData = planDoc.data();
      
      if (!planData?.mp_plan_id) {
        return res.status(400).json({ error: "Este plano ainda não está configurado para recorrência." });
      }

      const preApproval = new PreApproval(mpClient);
      
      const result = await preApproval.create({
        body: {
          preapproval_plan_id: planData.mp_plan_id,
          payer_email: email,
          card_token_id: cardToken, // If using custom card flow
          back_url: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard?payment=success`,
          status: 'authorized',
          external_reference: userId,
          reason: `Assinatura PowerLife - ${planData.name}`
        }
      });

      res.json({ id: result.id, init_point: result.init_point });
    } catch (error: any) {
      console.error("Error creating MP subscription:", error);
      res.status(500).json({ error: error.message || "Falha ao criar assinatura" });
    }
  });

  // Mercado Pago: Webhook
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { action, data, type } = req.body;
      
      if (!mpClient) return res.status(500).json({ error: "Mercado Pago not configured" });

      // Handle Subscription (Preapproval)
      if (type === 'subscription_preapproval' || action === 'subscription_preapproval.created' || action === 'subscription_preapproval.updated') {
        const preapprovalId = data?.id || req.query.id;
        if (!preapprovalId) return res.status(200).send("OK");

        console.log(`Mercado Pago Subscription Notification: ${preapprovalId}`);
        
        try {
          const preApproval = new PreApproval(mpClient);
          const subData = await preApproval.get({ id: String(preapprovalId) });
          
          const userId = subData.external_reference;
          const status = subData.status; // authorized, paused, cancelled, pending

          if (userId) {
            console.log(`Updating subscription for user ${userId} to status: ${status}`);
            
            // Map status to our system
            const isActive = status === 'authorized';
            const mappedStatus = isActive ? 'active' : (status === 'paused' ? 'paused' : 'inactive');

            await db.collection("users").doc(userId).update({
              subscriptionId: preapprovalId,
              subscriptionStatus: mappedStatus,
              updated_at: new Date().toISOString()
            });

            if (status === 'authorized') {
              // Get plan name from preference_id/plan_id if stored, or just use subData info
              // For now we assume if it's authorized it's active.
              await db.collection("notifications").add({
                userId,
                title: "Assinatura Confirmada",
                message: "Sua assinatura recorrente foi ativada com sucesso!",
                type: "success",
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
            } else if (status === 'cancelled') {
              await handleSubscriptionInterruption(userId, "Assinatura cancelada no Mercado Pago");
            }
          }
        } catch (subErr) {
          console.error("Error fetching subscription details:", subErr);
        }
      }

      // Handle Payment notifications (often triggered by subscriptions too)
      if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data?.id || req.query.id;
        
        if (!paymentId) return res.status(200).send("OK");

        const payment = new Payment(mpClient);
        const paymentData = await payment.get({ id: paymentId });
        
        if (paymentData.status === 'approved') {
          const userId = paymentData.external_reference;
          const plan = paymentData.metadata?.plan;

          if (userId && plan) {
            console.log(`Payment approved for user ${userId}. Plan: ${plan}`);
            
            await db.collection("users").doc(userId).update({
              plan: plan,
              paymentId: paymentId,
              paymentStatus: "approved",
              subscriptionStatus: "active",
              updated_at: new Date().toISOString()
            });

            // Notify user
            await db.collection("notifications").add({
              userId: userId,
              title: "Pagamento Aprovado!",
              message: `Seu plano ${plan.toUpperCase()} foi ativado com sucesso via Mercado Pago.`,
              type: "success",
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              link: "/Dashboard"
            });

            // Log Revenue
            const amount = plan === 'pro' ? 97.00 : (plan === 'master' ? 197.00 : 0);
            if (amount > 0) {
              await db.collection("revenue_history").add({
                userId,
                plan,
                amount,
                currency: 'BRL',
                gateway: 'mercadopago',
                paymentId: String(paymentId),
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        } else if (paymentData.status === 'cancelled' || paymentData.status === 'rejected') {
          const userId = paymentData.external_reference;
          if (userId) {
            await handleSubscriptionInterruption(userId, `Pagamento Mercado Pago ${paymentData.status}`);
          }
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing MP webhook:", error);
      res.status(200).send("Error logged"); // MP expects 200/201
    }
  });

  // Google Calendar: Auth URL
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = googleOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'],
      prompt: 'consent'
    });
    res.json({ url });
  });

  // Google Calendar: Callback
  app.get("/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const oauth2Client = googleOAuth2Client();
    
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info to identify who this token belongs to
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // We need to find the user in our DB by email
      const userSnapshot = await db.collection("users").where("email", "==", userInfo.data.email).limit(1).get();
      
      if (userSnapshot.empty) {
        return res.status(404).send("User not found in PowerLife");
      }

      const userId = userSnapshot.docs[0].id;
      
      // Store tokens in Firestore
      await db.collection("users").doc(userId).collection("tokens").doc("google").set({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null, // refresh_token is only sent on first auth or with prompt=consent
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
        updated_at: new Date().toISOString()
      }, { merge: true });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                window.close();
              } else {
                window.location.href = '/Dashboard';
              }
            </script>
            <p>Autenticação concluída com sucesso! Esta janela fechará automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Google Calendar: Sync Status
  app.get("/api/calendar/status", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      // Use the utility to ensure we check validity
      await getValidGoogleTokens(userId).catch(() => null);
      
      const tokenDoc = await db.collection("users").doc(userId).collection("tokens").doc("google").get();
      const userDoc = await db.collection("users").doc(userId).get();
      
      res.json({ 
        connected: tokenDoc.exists,
        lastSync: userDoc.data()?.last_calendar_sync || null
      });
    } catch (error) {
      res.json({ connected: false, lastSync: null });
    }
  });

  // Google Calendar: Disconnect
  app.delete("/api/calendar/disconnect", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      await db.collection("users").doc(userId).collection("tokens").doc("google").delete();
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  // Google Calendar: Sync Events
  app.post("/api/calendar/sync", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      const oauth2Client = await getValidGoogleTokens(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Fetch all agendamentos for this user
      const agendamentosSnapshot = await db.collection("agendamentos").where("created_by", "==", userId).get();
      
      const results = { synced: 0, errors: 0 };

      for (const doc of agendamentosSnapshot.docs) {
        const ag = doc.data();
        const agId = doc.id;

        try {
          const event = {
            summary: ag.titulo,
            description: ag.descricao || '',
            start: {
              dateTime: ag.data_inicio,
              timeZone: 'America/Sao_Paulo',
            },
            end: {
              dateTime: ag.data_fim || new Date(new Date(ag.data_inicio).getTime() + 3600000).toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
          };

          if (ag.google_event_id) {
            // Update existing event
            await calendar.events.update({
              calendarId: 'primary',
              eventId: ag.google_event_id,
              requestBody: event,
            });
          } else {
            // Create new event
            const createdEvent = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: event,
            });
            
            // Update agendamento with google_event_id
            await db.collection("agendamentos").doc(agId).update({
              google_event_id: createdEvent.data.id
            });
          }
          results.synced++;
        } catch (err) {
          console.error(`Error syncing agendamento ${agId}:`, err);
          results.errors++;
        }
      }

      await db.collection("users").doc(userId).update({
        last_calendar_sync: new Date().toISOString()
      });

      res.json({ message: "Sync completed", ...results, lastSync: new Date().toISOString() });
    } catch (error) {
      console.error("Error in Google Calendar sync:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { plan, userId, email } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const priceId = plan === "pro" ? process.env.VITE_STRIPE_PRO_PRICE_ID : process.env.VITE_STRIPE_MASTER_PRICE_ID;

    if (!priceId) {
      return res.status(400).json({ error: `Price ID for plan ${plan} not configured` });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/Dashboard`,
        client_reference_id: userId,
        customer_email: email,
        metadata: {
          plan: plan,
          userId: userId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Invite User
  app.post("/api/admin/invite", async (req, res) => {
    const { email, name, invitedBy } = req.body;

    try {
      // 1. Create invitation in Firestore
      const invitationRef = db.collection("invitations").doc();
      await invitationRef.set({
        email,
        name,
        status: "pending",
        invited_by: invitedBy,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Send email via Resend
      if (resend) {
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        await resend.emails.send({
          from: "PowerLife <noreply@powerlife.com>",
          to: [email],
          subject: "Você foi convidado para o PowerLife!",
          html: `
            <h1>Olá, ${name}!</h1>
            <p>Você foi convidado para se juntar à plataforma PowerLife como mentor.</p>
            <p>Clique no link abaixo para criar sua conta:</p>
            <a href="${appUrl}/register?email=${encodeURIComponent(email)}&inviteId=${invitationRef.id}">Aceitar Convite</a>
          `,
        });
      }

      res.json({ success: true, invitationId: invitationRef.id });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: System Health Check
  app.get("/api/admin/health", requireAdmin, async (req, res) => {
    res.json(systemStatus);
  });

  // Public: Feature Flags (simplified health check)
  app.get("/api/config/features", (req, res) => {
    res.json({
      gemini: !!process.env.GEMINI_API_KEY,
      resend: !!process.env.RESEND_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      mercadopago: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      googleCalendar: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  // Admin: Reset Password
  app.post("/api/admin/reset-password", async (req, res) => {
    const { email } = req.body;
    try {
      const link = await admin.auth(firebaseAdminApp).generatePasswordResetLink(email);
      if (resend) {
        await resend.emails.send({
          from: "PowerLife <noreply@powerlife.com>",
          to: [email],
          subject: "Redefinição de Senha - PowerLife",
          html: `<p>Clique no link abaixo para redefinir sua senha:</p><a href="${link}">Redefinir Senha</a>`,
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Toggle User Status (Auth + Firestore)
  app.post("/api/admin/toggle-user-status", async (req, res) => {
    const { userId, habilitado } = req.body;
    try {
      // 1. Update Firebase Auth
      await admin.auth(firebaseAdminApp).updateUser(userId, { disabled: !habilitado });
      
      // 2. Update Firestore
      await db.collection("users").doc(userId).update({
        habilitado: habilitado,
        updated_at: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Create User directly
  app.post("/api/admin/create-user", async (req, res) => {
    const { email, name, password, role } = req.body;
    try {
      // 1. Create in Firebase Auth
      const userRecord = await admin.auth(firebaseAdminApp).createUser({
        email,
        password,
        displayName: name,
      });
      
      // 2. Create in Firestore
      await db.collection("users").doc(userRecord.uid).set({
        email,
        name,
        role: role || 'user',
        habilitado: true,
        created_at: new Date().toISOString()
      });

      res.json({ success: true, userId: userRecord.uid });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Delete User
  app.post("/api/admin/delete-user", async (req, res) => {
    const { userId } = req.body;
    try {
      // 1. Delete from Firebase Auth
      await admin.auth(firebaseAdminApp).deleteUser(userId);
      
      // 2. Delete from Firestore
      await db.collection("users").doc(userId).delete();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Endpoint to manually trigger email (for testing)
  app.post("/api/notifications/test-email", async (req, res) => {
    const { to, subject, body } = req.body;
    
    if (!resend) {
      return res.status(500).json({ error: "RESEND_API_KEY not configured" });
    }

    try {
      const data = await resend.emails.send({
        from: "PowerLife <notifications@powerlife.app>",
        to: [to],
        subject: subject,
        html: body,
      });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    setupCronJobs();
  });
}

async function checkCompletedGoalsAndNotify() {
  console.log("Checking for completed goals to notify...");
  try {
    const metasRef = db.collection("metas_smart");
    const snapshot = await metasRef.where("status", "==", "concluido").get();
    
    console.log(`Found ${snapshot.docs.length} goals with status 'concluido'.`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already notified
      if (data.completed_notification_sent === true) continue;
      if (!data.created_by) {
        console.warn(`Goal ${doc.id} has no created_by field.`);
        continue;
      }

      console.log(`Processing completion notification for goal: "${data.titulo}" (User: ${data.created_by})`);

      const userDoc = await db.collection("users").doc(data.created_by).get();
      const userData = userDoc.data();
      const preferences = userData?.notification_preferences || { goals: true };

      if (preferences.goals !== false) {
        // 1. Send In-App Notification
        await db.collection("notifications").add({
          userId: data.created_by,
          title: "Meta Concluída! 🎉",
          message: `Parabéns! Você concluiu a meta: "${data.titulo}"`,
          type: "success",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          link: "/MetaSmart"
        });

        // 2. Send Email
        if (userData?.email && resend) {
          console.log(`Goal "${data.titulo}" completed. Notifying user ${data.created_by}`);
          
          await resend.emails.send({
            from: "PowerLife <notifications@powerlife.app>",
            to: [userData.email],
            subject: "Parabéns! Meta SMART Concluída 🚀",
            html: `
              <h1>Parabéns, ${userData.name}!</h1>
              <p>Você concluiu a meta: <strong>"${data.titulo}"</strong>.</p>
              <p>Celebrar pequenas vitórias é fundamental para o sucesso a longo prazo. Continue assim!</p>
              <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/MetaSmart">Veja o progresso das suas outras metas aqui.</a></p>
              <br/>
              <p>Atenciosamente,<br/>Equipe PowerLife</p>
            `,
          });
        }
      }

      await doc.ref.update({ completed_notification_sent: true });
    }
  } catch (error: any) {
    // Re-throw to be handled by runSafeCron
    throw error;
  }
}

async function sendWeeklyAITips() {
  try {
    console.log("Checking for users to send weekly AI tips...");
    const usersSnapshot = await db.collection("users").get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const preferences = userData?.notification_preferences || { ai_tips: true };

      if (userData?.email && resend && preferences.ai_tips !== false) {
        // Here we would typically call Gemini to generate a special tip based on user's goals/metrics
        // For now, let's send a generic helpful tip
        const tips = [
          "Dica da Semana: metas SMART funcionam melhor quando você as revisa diariamente.",
          "Dica da Semana: Praticar meditação por apenas 5 minutos por dia pode aumentar sua produtividade em 20%.",
          "Dica da Semana: O registro no seu diário de reflexão ajuda a solidificar o aprendizado das sessões.",
          "Dica da Semana: Divida metas grandes em micro-metas para manter a motivação alta."
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        await resend.emails.send({
          from: "PowerLife <ai@powerlife.app>",
          to: [userData.email],
          subject: "Insight da Semana: PowerLife AI 🧠",
          html: `
            <h1>Olá, ${userData.name}!</h1>
            <p>Aqui está o seu insight semanal gerado pela nossa inteligência artificial:</p>
            <blockquote style="padding: 20px; background: #f0f7ff; border-left: 5px solid #3b82f6; font-style: italic;">
              ${randomTip}
            </blockquote>
            <p>Continue focado nos seus objetivos!</p>
            <br/>
            <p>Atenciosamente,<br/>PowerLife AI</p>
          `,
        });
      }
    }
  } catch (error: any) {
    console.error("Error in sendWeeklyAITips:", error);
  }
}

function setupCronJobs() {
  // Run daily at 08:00 (Daily Checks)
  cron.schedule("0 8 * * *", () => runSafeCron("Daily All Checks", async () => {
    console.log("Running daily notification check...");
    await checkOverdueGoalsAndNotify();
    await checkCompletedGoalsAndNotify();
    await checkNewUsersAndWelcome();
    await checkUpcomingSessionsAndNotify();
  }));

  // Run weekly on Mondays at 09:00 for AI Tips
  cron.schedule("0 9 * * 1", () => runSafeCron("Weekly AI Tips", sendWeeklyAITips));

  // For testing, run every 5 minutes in dev
  if (process.env.NODE_ENV !== "production") {
    cron.schedule("*/5 * * * *", () => runSafeCron("Dev Fast Check", async () => {
      console.log("Running dev notification check (every 5 mins)...");
      await checkOverdueGoalsAndNotify();
      await checkCompletedGoalsAndNotify();
      await checkNewUsersAndWelcome();
      await checkUpcomingSessionsAndNotify();
    }));
  }
}

async function checkUpcomingSessionsAndNotify() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const agendamentosRef = db.collection("agendamentos");
    
    const snapshot = await agendamentosRef
      .where("tipo", "==", "sessao")
      .where("status", "==", "pendente")
      .get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.data_inicio || !data.created_by) continue;

      const dataInicio = new Date(data.data_inicio);
      
      // If session is within the next 24 hours and hasn't been notified
      if (dataInicio > now && dataInicio <= tomorrow && !data.reminder_sent) {
        console.log(`Session "${data.titulo}" is upcoming. Notifying user ${data.created_by}`);
        
      const userDoc = await db.collection("users").doc(data.created_by).get();
      const userData = userDoc.data();
      const preferences = userData?.notification_preferences || { sessions: true };
      
      if (preferences.sessions !== false) {
        // 1. Send In-App Notification
        await db.collection("notifications").add({
          userId: data.created_by,
          title: "Lembrete de Sessão",
          message: `Sua sessão "${data.titulo}" está agendada para amanhã às ${dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
          type: "info",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          link: "/Agendamentos"
        });

        // 2. Send Email if possible
        if (userData?.email && resend) {
          await resend.emails.send({
            from: "PowerLife <notifications@powerlife.app>",
            to: [userData.email],
            subject: "Lembrete: Sessão de Mentoria Amanhã",
            html: `
              <h1>Olá, ${userData.name}!</h1>
              <p>Este é um lembrete amigável de que sua sessão <strong>"${data.titulo}"</strong> está agendada para amanhã, ${dataInicio.toLocaleDateString('pt-BR')} às ${dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</p>
              <p>Prepare-se revisando suas anotações e metas.</p>
              <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/Agendamentos">Clique aqui para ver seus agendamentos.</a></p>
              <br/>
              <p>Atenciosamente,<br/>Equipe PowerLife</p>
            `,
          });
        }
      }

        // Update reminder sent flag
        await doc.ref.update({
          reminder_sent: true
        });
      }
    }
  } catch (error: any) {
    throw error;
  }
}

async function checkNewUsersAndWelcome() {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("welcome_email_sent", "==", false).get();

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      if (userData.email && resend) {
        console.log(`Sending welcome email to ${userData.email}`);
        await resend.emails.send({
          from: "PowerLife <welcome@powerlife.app>",
          to: [userData.email],
          subject: "Bem-vindo ao PowerLife!",
          html: `
            <h1>Bem-vindo, ${userData.name}!</h1>
            <p>Estamos muito felizes em ter você conosco na sua jornada de desenvolvimento pessoal e profissional.</p>
            <p>No PowerLife, você pode:</p>
            <ul>
              <li>Avaliar sua Roda da Vida</li>
              <li>Definir Metas SMART</li>
              <li>Acompanhar seu PDI</li>
              <li>E muito mais!</li>
            </ul>
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}">Comece agora mesmo explorando seu Dashboard.</a></p>
            <br/>
            <p>Atenciosamente,<br/>Equipe PowerLife</p>
          `,
        });

        await doc.ref.update({ welcome_email_sent: true });
      }
    }
  } catch (error: any) {
    throw error;
  }
}

async function checkOverdueGoalsAndNotify() {
  try {
    const now = new Date();
    const metasRef = db.collection("metas_smart");
    
    const snapshot = await metasRef.where("status", "in", ["a_fazer", "em_andamento", "pausada", "pendente"]).get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.prazo || !data.created_by) continue;

      const prazo = new Date(data.prazo);
      
      // If overdue
      if (prazo < now) {
        // Check if we should re-notify (every 7 days)
        const lastNotificationAt = data.last_overdue_notification_at ? new Date(data.last_overdue_notification_at) : null;
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (!lastNotificationAt || lastNotificationAt < sevenDaysAgo) {
          const userDoc = await db.collection("users").doc(data.created_by).get();
          const userData = userDoc.data();
          const preferences = userData?.notification_preferences || { goals: true };

          if (preferences.goals !== false) {
            console.log(`Goal "${data.titulo}" is overdue. Notifying user ${data.created_by}`);
            
            // 1. Send In-App Notification
            await db.collection("notifications").add({
              userId: data.created_by,
              title: "Meta Atrasada",
              message: `A meta "${data.titulo}" está atrasada desde ${prazo.toLocaleDateString()}. Que tal revisar seu plano?`,
              type: "warning",
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              link: "/MetaSmart"
            });

            // 2. Send Email if possible
            if (userData?.email && resend) {
              await resend.emails.send({
                from: "PowerLife <notifications@powerlife.app>",
                to: [userData.email],
                subject: "Lembrete: Meta SMART Atrasada",
                html: `
                  <h1>Olá, ${userData.name}!</h1>
                  <p>Notamos que sua meta <strong>"${data.titulo}"</strong> está com o prazo vencido desde ${prazo.toLocaleDateString()}.</p>
                  <p>O acompanhamento constante é fundamental para o seu desenvolvimento.</p>
                  <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/MetaSmart">Clique aqui para revisar sua meta.</a></p>
                  <br/>
                  <p>Atenciosamente,<br/>Equipe PowerLife</p>
                `,
              });
            }
          }

          // Update last notification timestamp
          await doc.ref.update({
            last_overdue_notification_at: now.toISOString()
          });
        }
      }
    }
  } catch (error: any) {
    throw error;
  }
}

startServer().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
  process.exit(1);
});
