import app from '@/app';
import CONFIG from '@/config/env';

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${CONFIG.PORT}`);
  console.log(`📝 Docs available at http://localhost:${CONFIG.PORT}/docs`);
});
