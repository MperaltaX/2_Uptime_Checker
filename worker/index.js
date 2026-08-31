require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configure Nodemailer for Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify SMTP connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("Error al conectar con el servidor SMTP:", error);
  } else {
    console.log("Servidor SMTP listo para enviar mensajes.");
  }
});

async function sendAlertEmail(websiteName, url, status) {
  if (!process.env.NOTIFY_EMAIL || !process.env.SMTP_USER) return;
  
  const mailOptions = {
    from: `"Uptime Checker" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `ALERTA: El sitio ${websiteName} está CAÍDO 🚨`,
    html: `
      <h2>Alerta de Uptime Checker</h2>
      <p>El sitio web <strong>${websiteName}</strong> (${url}) no está respondiendo correctamente.</p>
      <p>Estado actual reportado: <strong>${status}</strong></p>
      <br/>
      <p>Revisa tu servidor lo antes posible.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent for ${websiteName}`);
  } catch (error) {
    console.error(`Failed to send email for ${websiteName}:`, error.message);
  }
}

async function checkWebsites() {
  console.log(`[${new Date().toISOString()}] Starting website check cycle...`);
  
  try {
    const { rows: websites } = await pool.query('SELECT * FROM websites');
    
    if (websites.length === 0) {
      console.log('No websites to check.');
      return;
    }

    // Ping all websites concurrently
    const promises = websites.map(async (site) => {
      let currentStatus = 'DOWN';
      
      try {
        const response = await axios.get(site.url, { timeout: 5000 });
        if (response.status >= 200 && response.status < 400) {
          currentStatus = 'UP';
        }
      } catch (error) {
        currentStatus = 'DOWN';
      }

      // Check if status changed to DOWN (from UP or PENDING)
      if ((site.status === 'UP' || site.status === 'PENDING') && currentStatus === 'DOWN') {
        console.log(`Site ${site.name} went DOWN! Sending alert...`);
        await sendAlertEmail(site.name, site.url, currentStatus);
      }

      // Update database status
      await pool.query(
        'UPDATE websites SET status = $1, last_checked = CURRENT_TIMESTAMP WHERE id = $2',
        [currentStatus, site.id]
      );
      
      // Save history record
      await pool.query(
        'INSERT INTO checks_history (website_id, status) VALUES ($1, $2)',
        [site.id, currentStatus]
      );
      
      // Clean up old records (keep only latest 50 per site)
      await pool.query(`
        DELETE FROM checks_history 
        WHERE id IN (
          SELECT id FROM checks_history 
          WHERE website_id = $1 
          ORDER BY checked_at DESC 
          OFFSET 50
        )
      `, [site.id]);
      
      return { id: site.id, name: site.name, url: site.url, status: currentStatus };
    });

    const results = await Promise.allSettled(promises);
    const upCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'UP').length;
    
    console.log(`Cycle finished. ${upCount}/${websites.length} websites are UP.`);

  } catch (error) {
    console.error('Error during check cycle:', error);
  }
}

// Run the check every 1 minute
cron.schedule('* * * * *', () => {
  checkWebsites();
});

console.log('Worker started. Cron job scheduled to run every 1 minute.');
// Run immediately on startup
checkWebsites();

// Expose a simple HTTP server to allow manual triggers
const express = require('express');
const app = express();
app.post('/trigger', async (req, res) => {
  console.log('Manual trigger received');
  await checkWebsites();
  res.json({ success: true });
});
app.listen(3001, () => {
  console.log('Worker HTTP server listening on port 3001 for manual triggers');
});
