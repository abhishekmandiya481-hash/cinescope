import './globals.css'
import './responsive.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import { Providers } from './providers'

export const metadata = {
  title: 'CineScope - Discover Movies',
  description: 'A cinematic movie discovery platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <Providers>
          <Navbar />
          <main style={{ flex: 1, paddingBottom: '70px' }} className="mobile-only-padding">
            {children}
          </main>
          <MobileBottomNav />
          <Footer />
        </Providers>
        <style jsx global>{`
          @media (max-width: 768px) {
            .mobile-only-padding {
              padding-bottom: 80px !important;
            }
          }
          @media (min-width: 769px) {
            .mobile-only-padding {
              padding-bottom: 0 !important;
            }
          }
        `}</style>
      </body>
    </html>
  )
}
