import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { auth, googleProvider } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { BookHeart, Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthForm } from './AuthForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();

  const handleError = (error: any) => {
    let description = "Si è verificato un errore inaspettato.";
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          description = "Email o password non corretti.";
          break;
        case 'auth/email-already-in-use':
          description = "Questa email è già stata registrata.";
          break;
        case 'auth/weak-password':
          description = "La password deve essere di almeno 6 caratteri.";
          break;
        case 'auth/invalid-email':
            description = "L'indirizzo email non è valido.";
            break;
        default:
          description = "Controlla le credenziali e riprova.";
          console.error("FIREBASE ERROR:", error.code, error.message);
      }
    }
    toast({ variant: "destructive", title: "Errore di autenticazione", description });
  };

  const handleEmailSignup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Registrazione completata!", description: "Benvenuto!" });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Accesso effettuato!" });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Accesso con Google riuscito!" });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: "destructive", title: "Errore", description: "Per favore, inserisci la tua email." });
        return;
    }
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: "Email inviata!", description: "Controlla la tua casella di posta per il link di recupero." });
        setIsResetMode(false);
        setResetEmail("");
    } catch (error) {
        handleError(error);
    } finally {
        setIsLoading(false);
    }
  };

  if (isResetMode) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <BookHeart className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="text-2xl mt-4">Recupera Password</CardTitle>
                    <CardDescription>Inserisci la tua email per ricevere un link e reimpostare la password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="email"
                        placeholder="La tua email di registrazione"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button onClick={handlePasswordReset} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Invia Link di Recupero'}
                    </Button>
                    <Button variant="link" className="w-full" onClick={() => setIsResetMode(false)}>
                        Torna al Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BookHeart className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl mt-4">BookSnap</CardTitle>
          <CardDescription>La tua libreria, potenziata dall'intelligenza artificiale.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="signup">Registrati</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-4">
              <AuthForm 
                buttonText="Accedi" 
                isLoading={isLoading} 
                onSubmit={handleEmailLogin} 
              />
               <Button variant="link" size="sm" className="w-full mt-2" onClick={() => setIsResetMode(true)}>
                Password dimenticata?
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <AuthForm 
                buttonText="Crea Account" 
                isLoading={isLoading} 
                onSubmit={handleEmailSignup} 
              />
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Oppure</span></div>
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.3 56.2l-64.8 64.2C324.7 97.5 289.1 80 248 80c-82.6 0-150.2 67.6-150.2 150.2S165.4 406.4 248 406.4c97.1 0 133-54.8 137.2-85.3H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>}
            Continua con Google
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
