import CONFIG from '@/config/env';
import app from '@/app';

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${CONFIG.PORT}`);
});
