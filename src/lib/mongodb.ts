import mongoose from "mongoose";
import { promises as dnsPromises } from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

// Public DNS servers used to bypass the OS resolver when it refuses SRV
// queries (Windows corp/VPN/ISP DNS → querySrv ECONNREFUSED).
const FALLBACK_DNS_SERVERS = ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"];

if (!MONGODB_URI) {
  console.warn("[mongodb] Missing MONGODB_URI — MongoDB disabled");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Resolve mongodb+srv:// manually via public DNS resolvers, then rewrite as
// mongodb://host1:port,host2:port,… so mongoose never touches the OS resolver.
// If any step fails, return the original URI and let mongoose try normally.
async function resolveSrvUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) return uri;

  try {
    const url = new URL(uri);
    const hostname = url.hostname;
    const srvHost = `_mongodb._tcp.${hostname}`;

    const resolver = new dnsPromises.Resolver();
    resolver.setServers(FALLBACK_DNS_SERVERS);

    const [srvRecords, txtRecords] = await Promise.all([
      resolver.resolveSrv(srvHost),
      resolver.resolveTxt(hostname).catch(() => [] as string[][]),
    ]);

    if (!srvRecords.length) {
      throw new Error(`No SRV records for ${srvHost}`);
    }

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");

    // TXT records carry connection options (e.g. authSource=admin&replicaSet=…).
    // Concatenated chunks per record, records joined by '&'.
    const txtParams = new URLSearchParams(
      txtRecords.map((chunks) => chunks.join("")).join("&"),
    );

    const params = new URLSearchParams(url.search);

    // SRV connections default to TLS on.
    if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");

    // TXT-provided options fill in what the user didn't specify.
    for (const [k, v] of txtParams) {
      if (!params.has(k)) params.set(k, v);
    }

    const auth = url.username
      ? `${url.username}${url.password ? `:${url.password}` : ""}@`
      : "";
    const pathname = url.pathname || "/";
    const query = params.toString();
    const rewritten = `mongodb://${auth}${hosts}${pathname}${query ? `?${query}` : ""}`;

    console.log(
      `[mongodb] SRV resolved successfully via public DNS → ${srvRecords.length} shard(s)`,
    );
    return rewritten;
  } catch (err: any) {
    console.warn(
      "[mongodb] Manual SRV resolve failed, falling back to original URI:",
      err?.message,
    );
    return uri;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (!cached.promise) {
    cached.promise = resolveSrvUri(MONGODB_URI)
      .then((uri) =>
        mongoose.connect(uri, {
          bufferCommands: false,
          family: 4,
          serverSelectionTimeoutMS: 10_000,
          socketTimeoutMS: 45_000,
        }),
      )
      .catch((err) => {
        console.error("[mongodb] connect failed:", err?.name, err?.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export { mongoose };
