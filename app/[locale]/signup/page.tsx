import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ plan?: string }> }

export default async function LocaleSignupRedirect({ searchParams }: Props) {
  const { plan } = await searchParams
  redirect(plan ? `/signup?plan=${plan}` : "/signup")
}
