import { SignUp } from "@clerk/nextjs";
export default function Cadastrar() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUp fallbackRedirectUrl="/selecionar-empresa" signInUrl="/sign-in" />
    </main>
  );
}
