import './globals.css'
import './responsive.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Providers } from './providers'

export const metadata = {
  title: 'CineScope - Discover Movies',
  description: 'A cinematic movie discovery platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
