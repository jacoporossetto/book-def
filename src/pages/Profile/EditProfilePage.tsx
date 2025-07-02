import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, updateUserProfile } from '@/services/database';
import { PREDEFINED_GENRES, ALL_LANGUAGES, AVATAR_COLORS, READING_GOALS, PREDEFINED_VIBES } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // <-- ECCO LA RIGA MANCANTE
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { MultiSelectBadge } from '@/components/ui/MultiSelectBadge';

interface EditProfilePageProps {
  onSave: () => void;
}

export const EditProfilePage = ({ onSave }: EditProfilePageProps) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        avatarColor: userProfile.avatarColor || AVATAR_COLORS[0],
        bio: userProfile.bio || '',
        readingGoal: userProfile.readingGoal || 12,
        favoriteGenres: userProfile.favoriteGenres || [],
        preferredLanguages: userProfile.preferredLanguages || ['Italiano'],
        vibes: userProfile.vibes || [],
      });
    }
  }, [userProfile]);

  const handleVibesChange = (newVibes: string[]) => {
    setFormData(prev => ({ ...prev, vibes: newVibes }));
  };

  const handleGenreChange = (newGenres: string[]) => {
    setFormData(prev => ({ ...prev, favoriteGenres: newGenres }));
  };

  const handleLanguageChange = (language: string) => {
    const currentLanguages = formData.preferredLanguages || [];
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    setFormData(prev => ({ ...prev, preferredLanguages: newLanguages }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Creiamo l'oggetto dati pulito da salvare
      const dataToSave: Partial<UserProfile> = {
          displayName: formData.displayName,
          avatarColor: formData.avatarColor,
          bio: formData.bio,
          readingGoal: formData.readingGoal,
          favoriteGenres: formData.favoriteGenres,
          preferredLanguages: formData.preferredLanguages,
          vibes: formData.vibes
      };
      await updateUserProfile(user.uid, dataToSave);
      toast({ title: "Profilo aggiornato!", description: "Le tue preferenze sono state salvate con successo." });
      onSave();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiornare il profilo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pt-4">
        <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
        </div>
        <div className="space-y-2">
            <Label>Colore Avatar</Label>
            <div className="flex gap-3 pt-2">
                {AVATAR_COLORS.map(color => (
                    <button key={color} onClick={() => setFormData({...formData, avatarColor: color})} style={{ backgroundColor: color }} className={`w-8 h-8 rounded-full transition-all ${formData.avatarColor === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-background' : ''}`}/>
                ))}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Racconta qualcosa di te e dei tuoi gusti..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
        </div>
        <div className="space-y-2">
            <Label>Obiettivo di lettura annuale</Label>
            <Select value={String(formData.readingGoal)} onValueChange={val => setFormData({...formData, readingGoal: Number(val)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{READING_GOALS.map(num => <SelectItem key={num} value={String(num)}>{num} libri all'anno</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className="space-y-3">
            <Label className="text-base">Generi Preferiti</Label>
            <MultiSelectBadge options={PREDEFINED_GENRES} selectedOptions={formData.favoriteGenres || []} onSelectionChange={handleGenreChange} />
        </div>
        <div className="space-y-3">
            <Label className="text-base">"Vibes" / Atmosfere Ricercate</Label>
            <p className="text-sm text-muted-foreground">Che tipo di sensazioni cerchi in un libro?</p>
            <MultiSelectBadge options={PREDEFINED_VIBES} selectedOptions={formData.vibes || []} onSelectionChange={handleVibesChange} />
        </div>
        <div className="space-y-2">
            <Label>Lingue Preferite</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {ALL_LANGUAGES.map(lang => (
                    <div key={lang} className="flex items-center space-x-2">
                        <Checkbox id={`lang-${lang}`} checked={formData.preferredLanguages?.includes(lang)} onCheckedChange={() => handleLanguageChange(lang)} />
                        <Label htmlFor={`lang-${lang}`} className="font-normal cursor-pointer">{lang}</Label>
                    </div>
                ))}
            </div>
        </div>
        <div className="pt-4">
            <Button size="lg" className="w-full" onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salva Preferenze
            </Button>
        </div>
    </div>
  );
};