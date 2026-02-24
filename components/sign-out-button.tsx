import React from 'react'
import { Button } from 'react-native'
import { useClerk } from '@clerk/clerk-expo'

export default function SignOutButton() {
  const { signOut } = useClerk()

  return <Button title="Sign out" onPress={() => signOut()} />
}
