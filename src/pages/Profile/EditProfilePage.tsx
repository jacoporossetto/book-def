import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, auth } from '@/firebase'; // Importa auth da firebase
import { deleteUser, signOut } from 'firebase/auth'; // Importa deleteUser e signOut
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectBadge } from '@/components/ui/MultiSelectBadge';
import { genres, vibes } from '@/lib/options';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditProfilePageProps {
  onSave: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onSave }) => {
  const { user, userProfile } = useAuth(); // Rimosso logout dalla destrutturazione
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(userProfile?.favoriteGenres || []);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(userProfile?.vibes || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setSelectedGenres(userProfile.favoriteGenres || []);
      setSelectedVibes(userProfile.vibes || []);
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedProfileData = {
        displayName,
        bio,
        favoriteGenres: selectedGenres,
        vibes: selectedVibes,
      };
      await updateUserProfile(user.uid, updatedProfileData);
      toast({ title: "Profilo aggiornato con successo!" });
      onSave();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche al profilo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({ title: "Errore", description: "Utente non trovato.", variant: "destructive" });
        return;
    }

    setIsDeleting(true);
    try {
        await deleteUser(currentUser);
        toast({ title: "Account eliminato", description: "Ci dispiace vederti andare via." });
        await signOut(auth); // Utilizza signOut direttamente da Firebase
        // Il redirect alla pagina di login verrà gestito dal router principale
        // grazie all'observer onAuthStateChanged
    } catch (error: any) {
        console.error("Errore eliminazione account:", error);
        let description = "Non è stato possibile eliminare l'account.";
        if (error.code === 'auth/requires-recent-login') {
            description = "Questa operazione è sensibile e richiede una nuova autenticazione. Effettua di nuovo il login e riprova.";
        }
        toast({ title: "Errore", description, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <Label htmlFor="displayName">Nome Visualizzato</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Il tuo nome o nickname"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">La tua bio letteraria</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Descrivi che tipo di lettore sei..."
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Generi Preferiti</Label>
        <MultiSelectBadge
          options={genres}
          selected={selectedGenres}
          onChange={setSelectedGenres}
        />
      </div>

      <div className="space-y-2">
        <Label>Vibes / Atmosfere Ricercate</Label>
        <MultiSelectBadge
          options={vibes}
          selected={selectedVibes}
          onChange={setSelectedVibes}
        />
      </div>

      <Button onClick={handleSaveProfile} disabled={isLoading || isDeleting} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salva Modifiche'}
      </Button>

      {/* --- ZONA PERICOLO --- */}
      <div className="border-t border-destructive/20 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona Pericolo
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
            L'eliminazione del tuo account è un'azione permanente e non può essere annullata.
        </p>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Elimina il mio account'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Questa azione eliminerà permanentemente il tuo account, la tua libreria e tutti i dati associati. Per confermare, digita <strong>ELIMINA</strong> nel campo qui sotto.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                    id="delete-confirm"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder='Scrivi "ELIMINA"'
                    className="border-destructive focus-visible:ring-destructive"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'ELIMINA' || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Sì, elimina il mio account
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
