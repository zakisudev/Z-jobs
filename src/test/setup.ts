import { config } from "dotenv";

// Load .env so tests hit the same local MySQL the app does.
config({ path: ".env" });

// NODE_ENV is set by vitest itself; assigning it is a readonly error in TS.
