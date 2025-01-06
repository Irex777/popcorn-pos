import './globals.css'

const RootLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Cinema Popcorn</h1>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-neutral-900 text-white rounded-md">POS</button>
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                  <span className="mr-2">History</span>
                </button>
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                  <span className="mr-2">Inventory</span>
                </button>
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                  <span className="mr-2">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

export default RootLayout