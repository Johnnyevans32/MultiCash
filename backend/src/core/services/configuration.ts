type EnvType = "staging" | "production" | "local";
export interface Configuration {
  app: { name: string; uiUrl: string; portableDidInBase64: string };
  database: {
    uri: string;
  };
  server: {
    port: number;
    host: string;
  };
  mail: {
    server: string;
    port: number;
    username: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  paystack: {
    baseurl: string;
    secretKey: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  stripe: {
    baseurl: string;
    secretKey: string;
    webhookSecret: string;
  };
  intercom: {
    secretKey: string;
  };
  ipapi: {
    accessKey: string;
  };
  wise: { baseurl: string; apiKey: string };
  env: EnvType;
  puppeteer: {
    executablePath: string;
  };
}

export default (): Configuration => ({
  env: (process.env.ENV as EnvType) || "local",
  app: {
    name: process.env.APP_NAME,
    uiUrl: process.env.UI_URL,
    portableDidInBase64: process.env.PORTABLE_DID_BASE64,
  },
  database: {
    uri: process.env.DATABASE_URI,
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || "localhost",
  },
  mail: {
    server: process.env.MAIL_SERVER,
    port: parseInt(process.env.MAIL_PORT, 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  paystack: {
    baseurl: process.env.PAYSTACK_BASE_URL,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  stripe: {
    baseurl: process.env.STRIPE_BASE_URL,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  intercom: {
    secretKey: process.env.INTERCOM_SECRET_KEY,
  },
  ipapi: {
    accessKey: process.env.IPAPI_ACCESS_KEY,
  },
  wise: {
    baseurl: process.env.WISE_BASE_URL,
    apiKey: process.env.WISE_API_KEY,
  },
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  },
});
