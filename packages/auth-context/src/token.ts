import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";

export interface CustomJwtPayload extends JwtPayload {
  sub: string;
  name: string;
  surname: string;
  admin: boolean;
  passwordChangedAt: number;
}

export function decodeToken(token: string): CustomJwtPayload | null {
  if (!token) return null;

  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);
    const now = Date.now();

    if (decoded.exp && decoded.exp * 1000 < now) return null;

    return decoded;
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}
