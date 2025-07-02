import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Book } from '@/services/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Settings, CheckCircle, BookText } from 'lucide-react';
import { Label } from "@/components/ui/label"; // <-- ECCO LA RIGA MANCANTE
import { EditProfilePage } from './EditProfilePage';
import { Badge } from '@/components/ui/badge';

interface ProfilePageProps {
  books: Book[];
}

export const ProfilePage = ({ books }: ProfilePageProps) => {
  const { user, userProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  if (!user || !userProfile) {
    return <div>Caricamento...</div>;
  }
  
  const booksScanned = books.length;
  const genresCount = userProfile.favoriteGenres?.length || 0;
  const readingGoal = userProfile.readingGoal || 12;
  const booksReadCount = books.filter(b => b.readingStatus === 'read').length;
  
  const completenessChecks = [
      !!userProfile.displayName && !userProfile.displayName.startsWith('Lettore #'),
      !!userProfile.bio && userProfile.bio.length > 0,
      genresCount > 0,
      !!userProfile.readingGoal,
      (userProfile.preferredLanguages?.length || 0) > 0,
      (userProfile.vibes?.length || 0) > 0, // Aggiunto check per le vibes
  ];
  const profileCompleteness = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);
  const goalProgress = readingGoal > 0 ? Math.min((booksReadCount / readingGoal) * 100, 100) : 0;
  const initials = userProfile.displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="p-4 space-y-6">
      {/* CARD PROFILO e STATS (invariata) */}
      <Card className="text-center overflow-hidden shadow-lg">
        <div className="p-6 bg-muted/30">
           <Avatar className="h-24 w-24 mx-auto border-4" style={{borderColor: userProfile.avatarColor || '#8B5CF6'}}>
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="text-3xl font-semibold" style={{backgroundColor: userProfile.avatarColor || '#8B5CF6', color: 'white'}}>{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mt-4">{userProfile.displayName || 'Lettore BookScan'}</h2>
            <p className="text-muted-foreground">Membro della community BookScan AI</p>
        </div>
        <div className="grid grid-cols-3 p-4 border-t">
            <div><p className="text-2xl font-bold">{booksScanned}</p><p className="text-xs text-muted-foreground">Libri Libreria</p></div>
            <div><p className="text-2xl font-bold">{genresCount}</p><p className="text-xs text-muted-foreground">Generi Preferiti</p></div>
            <div><p className="text-2xl font-bold">{profileCompleteness}%</p><p className="text-xs text-muted-foreground">Profilo Completo</p></div>
        </div>
      </Card>

      {/* CARD OBIETTIVO LETTURA (invariata) */}
      <Card>
        <CardHeader><CardTitle>Obiettivo di Lettura {new Date().getFullYear()}</CardTitle></CardHeader>
        <CardContent>
            <div className="flex justify-between text-sm mb-2 font-medium"><span>Progresso</span><span>{booksReadCount} di {readingGoal} libri</span></div>
            <Progress value={goalProgress} />
            <p className="text-center text-sm text-muted-foreground mt-3">{goalProgress >= 100 ? "Obiettivo raggiunto! 🎉" : `Ti mancano ${readingGoal - booksReadCount} libri!`}</p>
        </CardContent>
      </Card>
      
      {/* CARD DNA LETTERARIO CON LA NUOVA SEZIONE VIBES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookText className="w-5 h-5 text-primary"/>Il Mio DNA Letterario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label className="text-muted-foreground">La mia bio letteraria</Label>
                <p className="italic text-base">"{userProfile.bio || 'Non impostata'}"</p>
            </div>
            <div className="space-y-2">
                <Label className="text-muted-foreground">Generi Preferiti</Label>
                <div className="flex flex-wrap gap-2">{userProfile.favoriteGenres && userProfile.favoriteGenres.length > 0 ? userProfile.favoriteGenres.map(g => <Badge key={g}>{g}</Badge>) : <span className="text-sm italic">Nessuno</span>}</div>
            </div>
            {/* --- NUOVA SEZIONE VIBES IN VISUALIZZAZIONE --- */}
            <div className="space-y-2">
                <Label className="text-muted-foreground">Vibes / Atmosfere Ricercate</Label>
                <div className="flex flex-wrap gap-2">{userProfile.vibes && userProfile.vibes.length > 0 ? userProfile.vibes.map(v => <Badge key={v} variant="secondary">{v}</Badge>) : <span className="text-sm italic">Nessuna</span>}</div>
            </div>
        </CardContent>
      </Card>
      
      {/* DIALOGO PER LE IMPOSTAZIONI (invariato) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
             <Button variant="outline" className="w-full"><Settings className="w-4 h-4 mr-2"/>Impostazioni Profilo e Preferenze</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="text-2xl">Impostazioni Profilo</DialogTitle>
              </DialogHeader>
              <EditProfilePage onSave={() => setIsEditDialogOpen(false)} />
          </DialogContent>
      </Dialog>
    </div>
  );
};