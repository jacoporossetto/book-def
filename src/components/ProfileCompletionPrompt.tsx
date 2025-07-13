import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, User, X } from "lucide-react";

interface ProfileCompletionPromptProps {
  onComplete: () => void;
  onDismiss: () => void;
}

/**
 * Un pop-up che invita l'utente a completare il proprio profilo per migliorare
 * l'accuratezza delle analisi AI.
 */
export const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({ onComplete, onDismiss }) => {
  return (
    // Posizionato in modo assoluto per apparire sopra il contenuto della pagina
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 animate-in fade-in-50 slide-in-from-top-10 duration-500">
      <Card className="shadow-2xl border-yellow-400 border-2 bg-yellow-50/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Completa il tuo Profilo Lettore
          </CardTitle>
          <CardDescription className="text-yellow-800">
            Per ottenere analisi AI più accurate, ti consigliamo di completare il tuo profilo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={onComplete} className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900">
            <User className="mr-2 h-4 w-4" />
            Vai al Profilo
          </Button>
          <Button onClick={onDismiss} variant="ghost" size="icon" className="text-yellow-800 hover:bg-yellow-100/50">
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
