import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extending the built-in session types
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      departamento?: string | null;
    }
  }

  /**
   * Extending the built-in JWT types
   */
  interface JWT {
    id: string;
    role: string;
    departamento?: string | null;
  }

  /**
   * Extending the built-in User types
   */
  interface User {
    id: string;
    role: string;
    departamento?: string | null;
  }
}
