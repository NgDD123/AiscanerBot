import "../on-board.css";
export default function NotFound() {
  const handleGoBack = () => {
    history.back();
  };
  return (
    <main className="grid min-h-screen place-items-center bg-major-text-style px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center glass_morphism w-[50%] py-10 px-12">
        <p className="text-5xl font-semibold text-[#ca217ebb]">404!</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Page not found
        </h1>
        <p className="text-base leading-5 text-center text-white  pt-4">
          The page you are looking for was not found. If you think this is an
          issue, please contact support for help
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={handleGoBack}
            className="rounded-md bg-major-text-style px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-light-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-blue"
          >
            Go back
          </button>
          <div role="button" className="text-sm font-semibold text-[#ca217ebb]">
            Contact support <span aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </div>
    </main>
  );
}
