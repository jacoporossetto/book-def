import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, CheckCircle } from 'lucide-react';
import { EditProfileForm } from '../pages/Profile/EditProfilePage'; // Importiamo il nostro nuovo form

export const UserProfile = ({ libraryBooks }) => { // Accetta i libri come prop
  const { user, userProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  if (!user || !userProfile) {
    return <div>Caricamento...</div>;
  }
  
  const booksScanned = libraryBooks.length;
  const genresCount = userProfile.favoriteGenres?.length || 0;
  const readingGoal = userProfile.readingGoal || 12;
  const booksReadCount = libraryBooks.filter(b => b.readingStatus === 'read').length;
  
  // Calcolo della completezza del profilo come da tuo screenshot
  const completenessChecks = [
      !!userProfile.displayName,
      !!userProfile.bio,
      genresCount > 0,
      !!userProfile.readingGoal,
      (userProfile.preferredLanguages?.length || 0) > 0
  ];
  const profileCompleteness = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);

  const goalProgress = readingGoal > 0 ? Math.min((booksReadCount / readingGoal) * 100, 100) : 0;
  
  const initials = userProfile.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="p-4 space-y-6">
        {/* CARD PRINCIPALE PROFILO E STATS */}
        <Card className="text-center overflow-hidden shadow-lg">
            <div className="p-6 bg-gradient-to-b from-primary/10 to-transparent">
                <Avatar className="h-24 w-24 mx-auto border-4" style={{borderColor: userProfile.avatarColor || '#6366F1'}}>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-3xl font-semibold" style={{backgroundColor: userProfile.avatarColor || '#6366F1', color: 'white'}}>{initials}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mt-4">{userProfile.displayName || 'Lettore BookScan'}</h2>
                <p className="text-muted-foreground">Membro della community BookScan AI</p>
            </div>
            <div className="grid grid-cols-3 p-4 border-t">
                <div>
                    <p className="text-2xl font-bold">{booksScanned}</p>
                    <p className="text-xs text-muted-foreground">Libri Libreria</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{genresCount}</p>
                    <p className="text-xs text-muted-foreground">Generi Preferiti</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{profileCompleteness}%</p>
                    <p className="text-xs text-muted-foreground">Profilo Completo</p>
                </div>
            </div>
        </Card>

        {/* CARD OBIETTIVO LETTURA */}
        <Card>
            <CardHeader><CardTitle>Obiettivo di Lettura {new Date().getFullYear()}</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Progresso</span>
                    <span className="text-muted-foreground">{booksReadCount} di {readingGoal} libri</span>
                </div>
                <Progress value={goalProgress} />
                <p className="text-center text-sm text-muted-foreground mt-3">
                    {goalProgress >= 100 ? "Obiettivo raggiunto! Complimenti! 🎉" : `Ti mancano ${readingGoal - booksReadCount} libri per raggiungere il tuo obiettivo!`}
                </p>
            </CardContent>
        </Card>
      
        {/* CARD IMPOSTAZIONI PROFILO (APRE IL DIALOGO) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted transition-colors">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <Settings className="w-6 h-6 text-primary"/>
                        <div>
                            <CardTitle>Impostazioni Profilo</CardTitle>
                            <CardDescription>Personalizza le tue preferenze per ricevere raccomandazioni migliori.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Impostazioni Profilo</DialogTitle>
                    <DialogDescription>
                        Le modifiche verranno salvate e usate dall'IA per le prossime analisi.
                    </DialogDescription>
                </DialogHeader>
                {/* Il nostro form di modifica viene renderizzato qui dentro */}
                <EditProfileForm onSave={() => setIsEditDialogOpen(false)} />
            </DialogContent>
        </Dialog>

        {/* CARD COMPLETEZZA PROFILO */}
        <Card>
             <CardHeader><CardTitle>Completezza Profilo</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                {completenessChecks.map((isComplete, index) => (
                    <div key={index} className={`flex items-center gap-2 ${isComplete ? '' : 'text-muted-foreground'}`}>
                        <CheckCircle className={`w-5 h-5 ${isComplete ? 'text-green-500' : ''}`} />
                        <span>{['Nome impostato', 'Bio compilata', 'Generi selezionati', 'Obiettivo impostato', 'Lingue selezionate'][index]}</span>
                    </div>
                ))}
             </CardContent>
        </Card>
    </div>
  );
};