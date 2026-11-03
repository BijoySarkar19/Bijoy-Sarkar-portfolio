import https from "https";

const host = "bijoy-sarkar-portfolio.vercel.app";
const key = "7c92bdf1e8844896a2977f80efcb1342";
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  `https://${host}/`,
  `https://${host}/projects`,
  `https://${host}/projects/civiclens-core`,
  `https://${host}/projects/rakshak-ai`,
  `https://${host}/projects/aether`,
  `https://${host}/projects/expense-tracker`,
];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList,
});

async function submitToIndexNow(targetHost) {
  return new Promise((resolve) => {
    const options = {
      hostname: targetHost,
      port: 443,
      path: "/indexnow",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log(`IndexNow [${targetHost}] status:`, res.statusCode, body || "(empty body)");
        resolve(res.statusCode);
      });
    });

    req.on("error", (err) => {
      console.warn(`IndexNow [${targetHost}] request error:`, err.message);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Submitting ${urlList.length} URLs to IndexNow for Bing & search engines...`);
  await submitToIndexNow("api.indexnow.org");
  await submitToIndexNow("www.bing.com");
  console.log("IndexNow submission completed.");
}

main().catch(console.error);
