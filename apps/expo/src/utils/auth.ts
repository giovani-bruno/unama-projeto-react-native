import * as Linking from "expo-linking"
import { useRouter } from "expo-router"
import * as Browser from "expo-web-browser"

import { Api } from "./api"
import { getBaseUrl } from "./base-url"
import { deleteToken, setToken } from "./session-store"

export const signIn = async () => {
    console.log("Hello signIn")
    const signInUrl = `${getBaseUrl()}/api/auth/signin`
    const redirectTo = Linking.createURL("/")
    const result = await Browser.openAuthSessionAsync(
        `${signInUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
        redirectTo,
    )

    if (result.type !== "success") return
    const url = Linking.parse(result.url)
    const sessionToken = String(url.queryParams?.session_token)
    if (!sessionToken) return

    setToken(sessionToken)
}

export const useUser = () => {
    const { data: session } = Api.auth.getSession.useQuery()
    return session?.user ?? null
}

export const useSignIn = () => {
    const utils = Api.useUtils()
    const router = useRouter()

    return async () => {
        await signIn()
        await utils.invalidate()
        router.replace("/")
    }
}

export const useSignOut = () => {
    const utils = Api.useUtils()
    const signOut = Api.auth.signOut.useMutation()
    const router = useRouter()

    return async () => {
        const res = await signOut.mutateAsync()
        if (!res.success) return
        await deleteToken()
        await utils.invalidate()
        router.replace("/")
    }
}
