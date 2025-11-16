export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you’re looking for doesn’t exist or has moved.</p>
      <a href="/" className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go home</a>
    </div>
  );
}
