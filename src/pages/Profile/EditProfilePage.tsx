import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectBadge } from '@/components/ui/MultiSelectBadge';
import { genres, vibes } from '@/lib/options';
import { Loader2 } from 'lucide-react';

interface EditProfilePageProps {
  onSave: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onSave }) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Inizializziamo lo stato con i dati del profilo esistente
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(userProfile?.favoriteGenres || []);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(userProfile?.vibes || []);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect per sincronizzare lo stato se il profilo viene caricato dopo il mount del componente
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
      onSave(); // Chiude la finestra di dialogo dopo il salvataggio
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

      <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salva Modifiche'}
      </Button>
    </div>
  );
};
