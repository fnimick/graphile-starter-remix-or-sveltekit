import type { HandleFetch, HandleServerError } from "@sveltejs/kit";
import setCookie from "set-cookie-parser";

import { SHARED_DOMAIN } from "$env/static/private";
import { PUBLIC_ROOT_URL } from "$env/static/public";

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (request.url.startsWith(PUBLIC_ROOT_URL)) {
    const cookie = event.request.headers.get("cookie");
    if (cookie) {
      request.headers.set("cookie", cookie);
    }
  }

  const response = await fetch(request);
  if (request.url.startsWith(PUBLIC_ROOT_URL)) {
    const cookieHeader = response.headers.get("set-cookie");
    if (cookieHeader) {
      for (const cookie of setCookie.parse(cookieHeader)) {
        const { name, value, expires } = cookie;
        event.cookies.set(name, value, {
          expires,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          domain: SHARED_DOMAIN,
        });
      }
    }
  }
  return response;
};

export const handleError: HandleServerError = async ({ event, error }) => {
  console.error("handleError server");
  console.error(error);
};