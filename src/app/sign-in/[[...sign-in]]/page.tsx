import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
/**
 * Renders a sign-in page with the sign-in form centered on a dark-themed background.
 *
 * The sign-in form uses the dark base theme for appearance and is vertically and horizontally centered within the viewport.
 */
export default function Page() {
  return (
  <div className='flex justify-center items-center h-screen'>
    <SignIn  appearance={{
      baseTheme: dark
    }}/>
    </div>
  )
}