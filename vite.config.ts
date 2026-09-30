import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function cashfreeDevPlugin(env: Record<string, string>) {
  return {
    name: "cashfree-dev-middleware",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === "/api/create-order" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: any) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const { amount, customer_phone, customer_email, customer_name } = JSON.parse(body || "{}");
              const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

              const appId = env.VITE_CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || "";
              const secret = env.CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || "";

              if (!appId || !secret) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ message: "Cashfree API keys missing in environment variables" }));
                return;
              }

              const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
                method: "POST",
                headers: {
                  accept: "application/json",
                  "content-type": "application/json",
                  "x-api-version": "2023-08-01",
                  "x-client-id": appId,
                  "x-client-secret": secret,
                },
                body: JSON.stringify({
                  order_amount: Number(amount) || 1,
                  order_currency: "INR",
                  order_id: orderId,
                  customer_details: {
                    customer_id: `CUST_${Date.now()}`,
                    customer_phone: customer_phone && customer_phone.length >= 10 ? customer_phone : "9999999999",
                    customer_email: customer_email || "student@projectdukaan.com",
                    customer_name: customer_name || "Engineering Student",
                  },
                  order_meta: {
                    return_url: `http://localhost:8080/marketplace`,
                  },
                }),
              });

              const data = await response.json();
              res.setHeader("Content-Type", "application/json");

              if (!response.ok) {
                res.statusCode = response.status;
                res.end(JSON.stringify({ message: data.message || "Payment Gateway Error", details: data }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ payment_session_id: data.payment_session_id, order_id: orderId }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ message: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger(), cashfreeDevPlugin(env)].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
