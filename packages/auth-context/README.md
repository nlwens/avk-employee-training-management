# Authentication Context

The authentication context, located in `packages/auth-context`, manages user authentication state and JWT (JSON Web Token) tokens across the client applications.

#### `AuthProvider`

Wraps the application to provide authentication context. It stores JWT token in `localStorage` as `accessToken` and automatically decodes it to extract user information (id, name, surname, admin).

```ts
import { AuthProvider } from '@auth-context/src';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* App routes */}
      </Routes>
    </AuthProvider>
  );
}
```

#### `useAuth()`

A custom hook used to access authentication state and methods throughout the application. Exposes the current user, authentication status and functions.

```ts
import { useAuth } from "@auth-context/src";

export function Component() {
  const { token, user, isAuthenticated, login, logout } = useAuth();
  // ...
}
```
