const https = require("https");

const host = "electricpmr.vercel.app";
const key = "8f2d73d2e6a84c64a6b1f31c50c9b7d4";
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  `https://${host}/`,
  `https://${host}/avariynyy-elektrik`,
  `https://${host}/contact`,
  `https://${host}/elektrik-v-benderah`,
  `https://${host}/elektrik-v-slobodzee`,
  `https://${host}/elektrik-v-tiraspole`,
  `https://${host}/elektromontazh-v-dome`,
  `https://${host}/elektromontazh-v-kvartire`,
  `https://${host}/sborka-elektroshchita`,
  `https://${host}/stoimost`,
  `https://${host}/uslugi`,
  `https://${host}/zamena-provodki`,
];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList,
});

const request = https.request(
  "https://yandex.com/indexnow",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      body += chunk;
    });
    response.on("end", () => {
      console.log(`IndexNow status: ${response.statusCode}`);
      if (body.trim()) {
        console.log(body);
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        process.exitCode = 1;
      }
    });
  },
);

request.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

request.write(payload);
request.end();
