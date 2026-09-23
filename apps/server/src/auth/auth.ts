export interface JwtPayload {
  sub: string;
  name: string;
  surname: string;
  admin: boolean;
  passwordChangedAt: number;
}
