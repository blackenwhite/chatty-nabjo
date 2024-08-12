import Head from "next/head";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/dist/server/api-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { isLoading, error, user } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  return (
    <>
      <Head>
        <title>Chatty Nabjo - Login or Signup</title>
      </Head>

      <div className="flex  min-h-screen w-full items-center justify-center  bg-gray-800 text-center text-white">
        <div>
          <div>
            <FontAwesomeIcon icon={faRobot} className="text-6xl text-emerald-50"/>
          </div>
          <h1 className="text-4xl mb-2 font-bold">
            Welcome to Chatty Nabjo
          </h1>
          <p className="text-lg mb-2">Login with your account to continue </p>
          <div className="mt-4 flex justify-center gap-3">
            {!!user && <Link href="/api/auth/logout">Logout</Link>}
            {!user && (
              <>
                <Link
                  href="/api/auth/login"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  Login
                </Link>
                <Link
                  href="/api/auth/signup"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const session = await getSession(ctx.req, ctx.res);
  if (!!session) {
    return {
      redirect: {
        destination: "/chat",
      },
    };
  }

  return {
    props: {},
  };
};
