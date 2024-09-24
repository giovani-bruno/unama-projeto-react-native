import React from "react"
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Checkbox from "expo-checkbox"
import { Link, Stack } from "expo-router"
// import { Zocial } from "@expo/vector-icons"
import { Controller, useForm } from "react-hook-form"

import type { SignInParams } from "~/utils/auth"
import { SigninOAuthButtons } from "~/components/buttons-signin-oauth"
import { useSignIn } from "~/utils/auth"

export default function SignUpScreen() {
    const [remember, setRemember] = React.useState(false)
    const form = useForm<SignInParams>({
        defaultValues: { email: "", password: "" },
    })
    const { signIn, error, status } = useSignIn()

    async function onSubmit(data: SignInParams) {
        await signIn(data)
    }

    return (
        <SafeAreaView>
            <Stack.Screen
                options={{
                    headerShown: false,
                    statusBarColor: "#02391E",
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="h-full w-full bg-primary"
            >
                <View className="mt-auto max-h-[470px] rounded-t-[3rem] bg-white p-8">
                    <Text className="text-center text-4xl font-bold text-green-900">
                        Bem vindo
                    </Text>

                    <Text className="m-1 mt-2 text-lg">Email</Text>
                    <Controller
                        name="email"
                        control={form.control}
                        render={({ field }) => (
                            <TextInput
                                className="rounded-xl border border-border px-4 py-2"
                                placeholder="Seu email de acesso"
                                onChangeText={field.onChange}
                                value={field.value}
                                onBlur={field.onBlur}
                            />
                        )}
                    />

                    <Text className="m-1 mt-2 text-lg">Senha</Text>
                    <Controller
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <TextInput
                                secureTextEntry
                                className="rounded-xl border border-border px-4 py-2"
                                placeholder="Sua senha"
                                onChangeText={field.onChange}
                                value={field.value}
                                onBlur={field.onBlur}
                            />
                        )}
                    />

                    <View className="flex w-full flex-row items-center justify-between py-4">
                        <View className="flex flex-row gap-2">
                            <Checkbox
                                value={remember}
                                onValueChange={(value) => setRemember(value)}
                                color="#14542E"
                            />
                            <Text>Lembrar de mim?</Text>
                        </View>
                        <Text className="font-medium text-green-900">
                            Esqueceu sua senha?
                        </Text>
                    </View>

                    <Pressable
                        className="relative flex flex-row items-center justify-center rounded-3xl bg-green-900 py-4 disabled:opacity-80"
                        onPress={form.handleSubmit(onSubmit)}
                        disabled={status === "pending" || status === "success"}
                    >
                        {status === "pending" ? (
                            <ActivityIndicator
                                className="absolute left-[35%]"
                                size="small"
                                color="#FFFFFF"
                            />
                        ) : null}
                        <Text className="text-xl font-bold text-white">
                            Entrar
                        </Text>
                    </Pressable>

                    {error ? (
                        <Text className="mt-4 text-center text-destructive">
                            {error.message}
                        </Text>
                    ) : null}

                    <SigninOAuthButtons />

                    <View className="flex flex-row items-center justify-center gap-2">
                        <Text>Não possui uma conta?</Text>
                        <Link
                            href="/signup"
                            className="font-medium text-green-900"
                        >
                            Crie uma
                        </Link>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
