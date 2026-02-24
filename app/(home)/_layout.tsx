import { SignedIn, SignedOut } from '@clerk/clerk-expo'
import { Stack, Redirect } from 'expo-router'

export default function HomeLayout() {
  return (
    <SignedIn>
      <Stack />
    </SignedIn>

    <SignedOut>
      <Redirect href={'/auth/sign-in'} />
    </SignedOut>
  )
}
