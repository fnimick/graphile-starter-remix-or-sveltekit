import { Link, useSearchParams } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { IoLogInOutline, IoPersonAddOutline } from "react-icons/io5";

import { SocialLoginOptions } from "~/components";
import { isSafe } from "~/utils/uri";
import { requireNoUser } from "~/utils/users";

export const handle = { hideLogin: true, title: "Login" };

export const loader = async ({ context }: LoaderArgs) => {
  await requireNoUser(context);
  return null;
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = isSafe(rawNext) ? rawNext : "/";

  return (
    <div className="flex max-w-lg flex-col gap-y-2">
      <Link
        className="btn btn-primary"
        to={`email?next=${encodeURIComponent(next)}`}
        data-cy="loginpage-button-withusername"
      >
        <span className="mx-1 text-lg">
          <IoLogInOutline />
        </span>
        Sign in with E-mail or Username
      </Link>
      <SocialLoginOptions next={next} />
      <Link
        className="btn btn-outline btn-ghost"
        to={`/register?next=${encodeURIComponent(next)}`}
        data-cy="loginpage-button-register"
      >
        <span className="mx-1 text-lg">
          <IoPersonAddOutline />
        </span>
        Create an account
      </Link>
    </div>
  );
}