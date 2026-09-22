import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((request) => {
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  if (!request.auth?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next|favicon.ico|robots.txt).*)"],
};
