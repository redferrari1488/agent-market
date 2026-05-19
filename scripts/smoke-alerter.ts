import { alert } from "../src/lib/alerter";

alert({
  key: "smoke:alerter-test",
  severity: "warn",
  title: "Alerter smoke test",
  details: { time: new Date().toISOString(), source: "local dev" },
});

setTimeout(() => process.exit(0), 3000);
