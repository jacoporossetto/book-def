import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../../contexts/AuthContext';
import { completeOnboarding } from '../../services/database';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnboardingPage = () => {
    const { user, isProfileComplete } = useAuth();
    const navigate = useNavigate();
    const [bio, setBio] = useState('');
    const [genres, setGenres] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Questo effetto ascolta i cambiamenti e gestisce il reindirizzamento
    useEffect(() => {
        if (isProfileComplete) {
            console.log('Onboarding completo, reindirizzo alla Dashboard...');
            navigate('/');
        }
    }, [isProfileComplete, navigate]);

    const handleSubmit = async () => {
        if (!user) return;
        if (!bio.trim() || !genres.trim()) {
            toast({ variant: 'destructive', title: "Campi obbligatori", description: "Per favore, compila entrambi i campi." });
            return;
        }
        setIsLoading(true);
        try {
            const favoriteGenres = genres.split(',').map(g => g.trim()).filter(g => g);
            await completeOnboarding(user.uid, { bio, favoriteGenres });
            toast({ title: "Profilo completato!", description: "Verrai reindirizzato..." });
            // Non c'è bisogno di chiamare navigate() qui, se ne occuperà l'useEffect
        } catch (error) {
            console.error("Errore durante il salvataggio dell'onboarding:", error);
            toast({ variant: 'destructive', title: "Errore", description: "Impossibile salvare il profilo." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Un ultimo passo...</CardTitle>
                    <CardDescription>
                        Aiutaci a capire i tuoi gusti per consigli su misura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ...il tuo JSX per i campi input... */}
                    <div>
                        <Label htmlFor="genres">I tuoi generi preferiti (separati da una virgola)</Label>
                        <Input 
                            id="genres" 
                            placeholder="es. Fantascienza, Thriller Psicologico, Romanzo Storico"
                            value={genres}
                            onChange={(e) => setGenres(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="bio">Descrivi in una frase cosa cerchi in un libro</Label>
                        <Textarea
                            id="bio"
                            placeholder="es. Cerco storie che mi facciano riflettere sulla condizione umana."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva e Inizia
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default OnboardingPage;