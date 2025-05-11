import { NextResponse } from "next/server";

export async function POST() {
  // Limpa o cookie do token
  const response = NextResponse.json({ message: "Logout realizado com sucesso!" });
  response.cookies.set("token", "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
