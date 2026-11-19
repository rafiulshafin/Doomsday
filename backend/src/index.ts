import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 5000;
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Doomsday Ready Backend running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});
