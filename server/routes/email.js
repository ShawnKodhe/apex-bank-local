import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.post('/', (req, res) => {
  const { to, subject, body } = req.body;
  if (process.env.SMTP_HOST) {
    // Extend with nodemailer when SMTP is configured
    console.log('[Email]', { to, subject, body: body?.slice(0, 80) });
  } else {
    console.log('[Email — dev mode]', { to, subject, preview: body?.slice(0, 120) });
  }
  res.json({ success: true });
});

export default router;
