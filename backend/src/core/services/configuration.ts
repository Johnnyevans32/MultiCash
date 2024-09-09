export interface Configuration {
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
  ui: {
    url: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export default (): Configuration => ({
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
  ui: {
    url: process.env.UI_URL,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});
