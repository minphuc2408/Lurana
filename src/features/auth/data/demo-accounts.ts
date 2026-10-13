import type { AuthUser } from "../auth.types";
export const ACCOUNTS: Array<AuthUser & {
  password: string;
}> = [{
  name: "Maria Santos",
  email: "mariasantos@sample.com",
  password: "maria2004",
  role: "user"
}, {
  name: "Tan Kurt",
  email: "tankurt@sample.com",
  password: "kurt0428",
  role: "admin"
}];
